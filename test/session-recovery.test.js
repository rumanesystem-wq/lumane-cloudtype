'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SESSION_IDLE_TTL_MS,
  SESSION_RECOVERY_TTL_MS,
  isIdleSession,
  isRecoverableSession,
  recoverRuntimeState,
} = require('../lib/session-recovery');

test('only recently persisted sessions are eligible for recovery', () => {
  const now = Date.parse('2026-07-20T00:00:00Z');
  assert.equal(isRecoverableSession({ saved_at: new Date(now - SESSION_RECOVERY_TTL_MS).toISOString() }, now), true);
  assert.equal(isRecoverableSession({ saved_at: new Date(now - SESSION_RECOVERY_TTL_MS - 1).toISOString() }, now), false);
  assert.equal(isRecoverableSession({ saved_at: new Date(now + 1).toISOString() }, now), false);
  assert.equal(isRecoverableSession({ saved_at: 'invalid' }, now), false);
});

test('cleanup only targets sessions beyond the idle window', () => {
  const now = Date.parse('2026-07-20T00:00:00Z');
  assert.equal(isIdleSession(new Date(now - SESSION_IDLE_TTL_MS).toISOString(), now), false);
  assert.equal(isIdleSession(new Date(now - SESSION_IDLE_TTL_MS - 1).toISOString(), now), true);
  assert.equal(isIdleSession(new Date(now + 1).toISOString(), now), false);
});

test('runtime flags and token totals are reconstructed from persisted rows', () => {
  const state = recoverRuntimeState([
    { id: 'msg_1', role: 'user', content: '문의', ts: '2026-07-20T00:01:00Z' },
    { id: 'fallback_msg_1', role: 'assistant', content: '담당자 연결', ts: '2026-07-20T00:02:00Z' },
    { mid: 'adm-1-abcdef', role: 'assistant', content: '확인했습니다', fromAdmin: true, read: false },
    { mid: 'adm-2-abcdef', role: 'assistant', content: '안내 완료', fromAdmin: true, read: true, readAt: '2026-07-20T00:03:00Z' },
  ], {
    input_tokens: 100,
    output_tokens: 20,
    cache_write_tokens: 30,
    cache_read_tokens: 40,
    turns: 2,
  }, '2026-07-20T00:00:00Z');

  assert.equal(state.fallbackSent, true);
  assert.equal(state.slackNotified, true);
  assert.equal(state.lastMessageAt, Date.parse('2026-07-20T00:02:00Z'));
  assert.equal(state.lastReadAt, '2026-07-20T00:03:00.000Z');
  assert.deepEqual(state.tokens, {
    input: 100,
    output: 20,
    cacheWrite: 30,
    cacheRead: 40,
    turns: 2,
  });
});

test('missing or malformed counters recover as zero without poisoning the session', () => {
  const state = recoverRuntimeState([], {
    input_tokens: -1,
    output_tokens: 'not-a-number',
    turns: null,
  }, null);

  assert.equal(state.fallbackSent, false);
  assert.equal(state.slackNotified, false);
  assert.equal(state.lastMessageAt, null);
  assert.deepEqual(state.tokens, {
    input: 0,
    output: 0,
    cacheWrite: 0,
    cacheRead: 0,
    turns: 0,
  });
});
