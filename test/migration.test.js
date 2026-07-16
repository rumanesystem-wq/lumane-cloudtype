'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('idempotency keys use non-partial unique indexes for PostgREST upsert inference', () => {
  const sql = fs.readFileSync(
    path.join(__dirname, '..', 'migrations', '2026-07-16_add_storage_idempotency_keys.sql'),
    'utf8',
  );
  assert.match(sql, /unique index if not exists quotes_request_id_unique\s+on public\.quotes \(request_id\);/i);
  assert.match(sql, /unique index if not exists install_source_ref_unique\s+on customer\.install \(source_ref\);/i);
  assert.doesNotMatch(sql, /where\s+(request_id|source_ref)\s+is\s+not\s+null/i);
});
