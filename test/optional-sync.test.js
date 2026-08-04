'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { runOptionalSync } = require('../lib/optional-sync');

test('optional sync reports a storage failure without rejecting the primary flow', async () => {
  const failure = Object.assign(new Error('missing conflict constraint'), { code: '42P10' });
  const reported = [];

  const succeeded = await runOptionalSync(
    async () => { throw failure; },
    async error => { reported.push(error); },
  );

  assert.equal(succeeded, false);
  assert.deepEqual(reported, [failure]);
});

test('optional sync remains non-blocking when failure reporting also fails', async () => {
  const succeeded = await runOptionalSync(
    async () => { throw new Error('storage failed'); },
    async () => { throw new Error('reporting failed'); },
  );

  assert.equal(succeeded, false);
});

test('optional sync returns success without reporting', async () => {
  let reports = 0;
  const succeeded = await runOptionalSync(
    async () => undefined,
    async () => { reports += 1; },
  );

  assert.equal(succeeded, true);
  assert.equal(reports, 0);
});

test('quote integrations do not treat phone as a customer conflict key', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  assert.doesNotMatch(source, /from\('customer'\)\.upsert/);
  assert.doesNotMatch(source, /onConflict:\s*'phone'/);
  assert.match(source, /AI customer\.install upsert[\s\S]*onConflict:\s*'source_ref'/);
  assert.match(source, /form customer\.install upsert[\s\S]*onConflict:\s*'source_ref'/);
});
