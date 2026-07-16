'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SupabaseOperationError,
  assertSupabaseSuccess,
  executeSupabase,
  isRetryableSupabaseError,
} = require('../lib/supabase-reliability');

test('assertSupabaseSuccess returns data only when error is absent', () => {
  assert.deepEqual(assertSupabaseSuccess({ data: { id: 1 }, error: null }, 'insert quote'), { id: 1 });
});

test('assertSupabaseSuccess converts returned errors into thrown operation errors', () => {
  assert.throws(
    () => assertSupabaseSuccess({ data: null, error: { code: '23505', message: 'duplicate' } }, 'insert quote'),
    error => error instanceof SupabaseOperationError && error.code === '23505' && error.retryable === false,
  );
});

test('executeSupabase retries a transient returned error and then succeeds', async () => {
  let attempts = 0;
  const delays = [];
  const data = await executeSupabase('save conversation', async () => {
    attempts++;
    if (attempts === 1) return { data: null, error: { status: 503, message: 'temporarily unavailable' } };
    return { data: { saved: true }, error: null };
  }, {
    maxAttempts: 3,
    baseDelayMs: 5,
    sleep: async ms => delays.push(ms),
  });

  assert.deepEqual(data, { saved: true });
  assert.equal(attempts, 2);
  assert.deepEqual(delays, [5]);
});

test('executeSupabase does not retry a permanent error', async () => {
  let attempts = 0;
  await assert.rejects(
    executeSupabase('save conversation', async () => {
      attempts++;
      return { data: null, error: { code: '23503', message: 'foreign key violation' } };
    }, { maxAttempts: 3, sleep: async () => {} }),
    error => error instanceof SupabaseOperationError && error.retryable === false,
  );
  assert.equal(attempts, 1);
});

test('non-idempotent writes can explicitly disable transient retries', async () => {
  let attempts = 0;
  await assert.rejects(
    executeSupabase('install insert', async () => {
      attempts++;
      return { data: null, error: { status: 503, message: 'temporarily unavailable' } };
    }, { maxAttempts: 1, sleep: async () => {} }),
    error => error instanceof SupabaseOperationError && error.retryable === true,
  );
  assert.equal(attempts, 1);
});

test('executeSupabase propagates the final transient failure', async () => {
  let attempts = 0;
  await assert.rejects(
    executeSupabase('save conversation', async () => {
      attempts++;
      throw Object.assign(new Error('fetch failed'), { code: 'ECONNRESET' });
    }, { maxAttempts: 2, sleep: async () => {} }),
    error => error instanceof SupabaseOperationError && error.retryable === true,
  );
  assert.equal(attempts, 2);
});

test('retry classification covers HTTP and PostgreSQL transient failures', () => {
  assert.equal(isRetryableSupabaseError({ status: 429 }), true);
  assert.equal(isRetryableSupabaseError({ code: '40P01' }), true);
  assert.equal(isRetryableSupabaseError({ code: '23505' }), false);
});
