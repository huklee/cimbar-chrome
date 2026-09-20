import test from 'node:test';
import assert from 'node:assert/strict';
import { createZip } from '../extension/lib/zip.js';
import { crc32 } from '../extension/lib/crc32.js';

const decoder = new TextDecoder();

function parseLocalEntries(zip) {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries = [];
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const checksum = view.getUint32(offset + 14, true);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const data = zip.slice(dataStart, dataStart + size);
    entries.push({ name: decoder.decode(zip.slice(nameStart, nameStart + nameLength)), data, checksum });
    offset = dataStart + size;
  }
  return entries;
}

test('ZIP stores multiple UTF-8 entries with valid CRC values', () => {
  const zip = createZip([
    { name: 'hello.txt', data: new TextEncoder().encode('Hello') },
    { name: '자료/설정.xml', data: new TextEncoder().encode('<root value="✓"/>') },
  ]);
  const entries = parseLocalEntries(zip);
  assert.deepEqual(entries.map((entry) => entry.name), ['hello.txt', '자료/설정.xml']);
  assert.equal(decoder.decode(entries[0].data), 'Hello');
  assert.equal(decoder.decode(entries[1].data), '<root value="✓"/>');
  for (const entry of entries) assert.equal(entry.checksum, crc32(entry.data));
  assert.equal(new DataView(zip.buffer, zip.byteOffset + zip.length - 22, 4).getUint32(0, true), 0x06054b50);
});

test('ZIP output is deterministic', () => {
  const input = [{ name: 'same.txt', data: new TextEncoder().encode('same') }];
  assert.deepEqual(createZip(input), createZip(input));
});
