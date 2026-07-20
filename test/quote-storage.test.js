'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { insertIdempotentQuote } = require('../lib/quote-storage');

test('request_id conflict returns the existing quote without inserting again', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: '23505' });
  const result = await insertIdempotentQuote({
    payload: { request_id: 'request-1', quote_number: 'KB-1' },
    insert: async () => { throw duplicate; },
    findByRequestId: async () => ({ id: 7, request_id: 'request-1', quote_number: 'KB-1' }),
    regenerateQuoteNumber: () => 'KB-2',
  });
  assert.equal(result.deduplicated, true);
  assert.equal(result.data.id, 7);
});

test('unrelated unique collision regenerates quote_number and retries', async () => {
  const duplicate = Object.assign(new Error('duplicate'), { code: '23505' });
  const attempted = [];
  const result = await insertIdempotentQuote({
    payload: { request_id: 'request-2', quote_number: 'KB-COLLISION' },
    insert: async payload => {
      attempted.push(payload.quote_number);
      if (attempted.length === 1) throw duplicate;
      return { id: 8, ...payload };
    },
    findByRequestId: async () => null,
    regenerateQuoteNumber: () => 'KB-RETRY',
  });
  assert.equal(result.deduplicated, false);
  assert.deepEqual(attempted, ['KB-COLLISION', 'KB-RETRY']);
  assert.equal(result.data.quote_number, 'KB-RETRY');
});

test('non-unique errors are propagated without lookup or retry', async () => {
  const failure = Object.assign(new Error('permission denied'), { code: '42501' });
  let lookups = 0;
  await assert.rejects(insertIdempotentQuote({
    payload: { request_id: 'request-3', quote_number: 'KB-3' },
    insert: async () => { throw failure; },
    findByRequestId: async () => { lookups++; return null; },
    regenerateQuoteNumber: () => 'KB-4',
  }), failure);
  assert.equal(lookups, 0);
});
