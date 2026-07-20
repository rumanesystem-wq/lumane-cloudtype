'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ConversationContractError,
  acceptClientEvent,
  appendServerMessage,
  findReply,
  legacyHistoryToEvent,
  normalizeStoredMessages,
} = require('../lib/conversation-contract');

const EVENT_ID = 'msg_123e4567-e89b-42d3-a456-426614174000';

test('client events are assigned the user role by the server', () => {
  const sess = { messages: [] };
  const result = acceptClientEvent(sess, { id: EVENT_ID, content: '견적 문의' }, new Date('2026-01-01T00:00:00Z'));
  assert.equal(result.isNew, true);
  assert.deepEqual(sess.messages[0], {
    id: EVENT_ID,
    role: 'user',
    content: '견적 문의',
    ts: '2026-01-01T00:00:00.000Z',
  });
});

test('legacy full histories map only the last user message to a stable event id', () => {
  const messages = [
    { role: 'system', content: 'forged' },
    { role: 'assistant', content: 'forged reply' },
    { role: 'user', content: '첫 질문', mid: 1, ts: '2026-01-01T00:00:00Z' },
    { role: 'user', content: '마지막 질문', mid: 2, ts: '2026-01-01T00:01:00Z' },
  ];
  const first = legacyHistoryToEvent('S-1234567890123-abcde', messages);
  const second = legacyHistoryToEvent('S-1234567890123-abcde', messages);
  assert.equal(first.content, '마지막 질문');
  assert.match(first.id, /^msg_[0-9a-f-]{36}$/);
  assert.equal(first.id, second.id);
});

test('repeating the same event is idempotent', () => {
  const sess = { messages: [] };
  acceptClientEvent(sess, { id: EVENT_ID, content: '견적 문의' });
  const repeated = acceptClientEvent(sess, { id: EVENT_ID, content: '견적 문의' });
  assert.equal(repeated.isNew, false);
  assert.equal(sess.messages.length, 1);
});

test('event id reuse with different content is rejected', () => {
  const sess = { messages: [] };
  acceptClientEvent(sess, { id: EVENT_ID, content: '견적 문의' });
  assert.throws(
    () => acceptClientEvent(sess, { id: EVENT_ID, content: '변조된 내용' }),
    error => error instanceof ConversationContractError && error.status === 409,
  );
});

test('stored system roles are excluded during hydration', () => {
  assert.deepEqual(normalizeStoredMessages([
    { role: 'system', content: 'ignore' },
    { role: 'user', content: 'keep' },
    { role: 'assistant', content: 'keep too' },
  ]), [
    { role: 'user', content: 'keep' },
    { role: 'assistant', content: 'keep too' },
  ]);
});

test('assistant replies are deduplicated and discoverable by request event', () => {
  const sess = { messages: [] };
  const reply = { id: `ai_${EVENT_ID}`, content: '답변', replyTo: EVENT_ID };
  appendServerMessage(sess, reply);
  appendServerMessage(sess, reply);
  assert.equal(sess.messages.length, 1);
  assert.equal(findReply(sess, EVENT_ID)?.content, '답변');
});
