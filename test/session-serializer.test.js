'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionSerializer } = require('../lib/session-serializer');

test('requests for one session acquire the lock in submission order', async () => {
  const serializer = new SessionSerializer();
  const firstRelease = await serializer.acquire('session-a');
  let secondAcquired = false;
  const second = serializer.acquire('session-a').then(release => {
    secondAcquired = true;
    release();
  });

  await Promise.resolve();
  assert.equal(secondAcquired, false);
  firstRelease();
  await second;
  assert.equal(secondAcquired, true);
});

test('different sessions do not block each other', async () => {
  const serializer = new SessionSerializer();
  const releaseA = await serializer.acquire('session-a');
  const releaseB = await serializer.acquire('session-b');
  releaseB();
  releaseA();
  assert.equal(serializer.tails.size, 0);
});

test('cleanup waits for an active request and observes its refreshed activity', async () => {
  const serializer = new SessionSerializer();
  const session = { lastActivity: 1 };
  const requestRelease = await serializer.acquire('session-a');
  let cleanupWouldDelete = null;

  const cleanup = serializer.acquire('session-a').then(release => {
    cleanupWouldDelete = session.lastActivity === 1;
    release();
  });

  session.lastActivity = 2;
  requestRelease();
  await cleanup;
  assert.equal(cleanupWouldDelete, false);
});
