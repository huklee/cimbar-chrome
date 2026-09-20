import test from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from '../extension/lib/crc32.js';

test('CRC-32 matches the standard check vector', () => {
  assert.equal(crc32(new TextEncoder().encode('123456789')), 0xcbf43926);
});

test('CRC-32 handles empty data', () => {
  assert.equal(crc32(new Uint8Array()), 0);
});
