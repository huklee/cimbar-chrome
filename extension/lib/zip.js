import { crc32 } from './crc32.js';

const encoder = new TextEncoder();
const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;
const UTF8_FLAG = 0x0800;
const DOS_DATE_1980_01_01 = 0x0021;
const ZIP32_MAX = 0xffffffff;

function uint16(value) {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return bytes;
}

function uint32(value) {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}

function concat(parts) {
  const size = parts.reduce((total, part) => total + part.length, 0);
  if (size > ZIP32_MAX) {
    throw new RangeError('The archive is too large for ZIP32.');
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

function localHeader(name, data, checksum) {
  return concat([
    uint32(LOCAL_SIGNATURE), uint16(20), uint16(UTF8_FLAG), uint16(0),
    uint16(0), uint16(DOS_DATE_1980_01_01), uint32(checksum),
    uint32(data.length), uint32(data.length), uint16(name.length), uint16(0), name,
  ]);
}

function centralHeader(name, data, checksum, offset) {
  return concat([
    uint32(CENTRAL_SIGNATURE), uint16(0x0314), uint16(20), uint16(UTF8_FLAG),
    uint16(0), uint16(0), uint16(DOS_DATE_1980_01_01), uint32(checksum),
    uint32(data.length), uint32(data.length), uint16(name.length), uint16(0),
    uint16(0), uint16(0), uint16(0), uint32(0), uint32(offset), name,
  ]);
}

/** Build a deterministic ZIP32 archive using uncompressed STORE entries. */
export function createZip(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new TypeError('At least one archive entry is required.');
  }
  if (entries.length > 0xffff) {
    throw new RangeError('The archive has too many entries for ZIP32.');
  }

  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const data = entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
    if (name.length === 0 || name.length > 0xffff) {
      throw new RangeError('Every ZIP filename must contain 1–65535 UTF-8 bytes.');
    }
    if (data.length > ZIP32_MAX) {
      throw new RangeError(`The entry “${entry.name}” is too large for ZIP32.`);
    }
    const checksum = crc32(data);
    const local = localHeader(name, data, checksum);
    localParts.push(local, data);
    centralParts.push(centralHeader(name, data, checksum, localOffset));
    localOffset += local.length + data.length;
    if (localOffset > ZIP32_MAX) {
      throw new RangeError('The archive is too large for ZIP32.');
    }
  }

  const central = concat(centralParts);
  const end = concat([
    uint32(END_SIGNATURE), uint16(0), uint16(0), uint16(entries.length),
    uint16(entries.length), uint32(central.length), uint32(localOffset), uint16(0),
  ]);
  return concat([...localParts, central, end]);
}
