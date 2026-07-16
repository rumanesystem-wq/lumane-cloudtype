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
