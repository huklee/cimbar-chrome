import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArchiveName, normalizeEntryName, validateDocuments, validateSettings } from '../extension/lib/validation.js';

test('entry extensions follow the selected type', () => {
  assert.equal(normalizeEntryName('notes.xml', 'txt'), 'notes.txt');
  assert.equal(normalizeEntryName('folder/안녕', 'xml'), 'folder/안녕.xml');
});

test('unsafe and non-portable paths are rejected', () => {
  for (const name of ['../secret', '/absolute', 'folder//file', 'a\\b', 'CON']) {
    assert.throws(() => normalizeEntryName(name, 'txt'));
  }
});

test('archive names are normalized', () => {
  assert.equal(normalizeArchiveName('transfer.zip'), 'transfer.zip');
  assert.equal(normalizeArchiveName('transfer'), 'transfer.zip');
  assert.throws(() => normalizeArchiveName('../transfer'));
});

test('duplicate document paths are case-insensitive', () => {
  assert.throws(() => validateDocuments([
    { name: 'Readme', type: 'txt', content: 'one' },
    { name: 'README.txt', type: 'txt', content: 'two' },
  ], class {}), /already uses/);
});

test('supported settings are normalized', () => {
  assert.deepEqual(validateSettings({ mode: 'Bu', rps: '10', pixels: '768' }), {
    mode: 'Bu', modeValue: 66, rps: 10, pixels: 768,
  });
  assert.throws(() => validateSettings({ mode: 'B', rps: 12, pixels: 769 }));
});
