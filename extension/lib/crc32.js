const table = new Uint32Array(256);
for (let value = 0; value < table.length; value += 1) {
  let remainder = value;
  for (let bit = 0; bit < 8; bit += 1) {
    remainder = (remainder & 1) ? (0xedb88320 ^ (remainder >>> 1)) : (remainder >>> 1);
  }
  table[value] = remainder >>> 0;
}

export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
