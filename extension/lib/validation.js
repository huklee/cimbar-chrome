export const CIMBAR_MODES = Object.freeze({ B: 68, Bm: 67, Bu: 66, '4C': 4 });
export const VALID_RPS = Object.freeze([5, 10, 15, 20]);
export const PIXEL_LIMITS = Object.freeze({ min: 512, max: 2048, step: 4 });

const INVALID_PATH_CHARS = /[<>:"\\|?*\u0000-\u001f]/u;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu;

export function normalizeEntryName(rawName, type) {
  const extension = String(type).toLowerCase();
  if (extension !== 'txt' && extension !== 'xml') {
    throw new Error('Document type must be TXT or XML.');
  }
  let name = String(rawName).trim();
  if (/\.(?:txt|xml)$/iu.test(name)) {
    name = name.slice(0, name.lastIndexOf('.'));
  }
  name = name.trim();
  if (!name) throw new Error('Filename cannot be empty.');
  if (name.startsWith('/') || name.endsWith('/') || name.includes('//')) {
    throw new Error('Filename folders must be relative and non-empty.');
  }
  if (INVALID_PATH_CHARS.test(name)) {
    throw new Error('Filename contains a character not supported in portable ZIP paths.');
  }
  for (const segment of name.split('/')) {
    if (segment === '.' || segment === '..') throw new Error('Filename cannot contain . or .. path segments.');
    if (segment.endsWith('.') || segment.endsWith(' ')) throw new Error('Filename segments cannot end in a dot or space.');
    if (WINDOWS_RESERVED.test(segment)) throw new Error(`“${segment}” is a reserved filename.`);
  }
  return `${name}.${extension}`;
}

export function normalizeArchiveName(rawName) {
  let name = String(rawName).trim();
  if (/\.zip$/iu.test(name)) name = name.slice(0, -4).trim();
  if (!name || name.includes('/') || INVALID_PATH_CHARS.test(name) || name === '.' || name === '..') {
    throw new Error('Archive name must be a portable filename without folders.');
  }
  if (name.endsWith('.') || name.endsWith(' ') || WINDOWS_RESERVED.test(name)) {
    throw new Error('Archive name is not portable across operating systems.');
  }
  return `${name}.zip`;
}

export function validateXml(text, Parser = globalThis.DOMParser) {
  if (typeof Parser !== 'function') throw new Error('XML validation is unavailable in this browser.');
  const document = new Parser().parseFromString(String(text), 'application/xml');
  const parserError = document.querySelector('parsererror');
  if (parserError) {
    const detail = parserError.textContent.replace(/\s+/gu, ' ').trim();
    throw new Error(`Malformed XML${detail ? `: ${detail}` : '.'}`);
  }
  return true;
}

export function validateDocuments(documents, Parser = globalThis.DOMParser) {
  if (!Array.isArray(documents) || documents.length === 0) throw new Error('Add at least one document.');
  const seen = new Set();
  return documents.map((document, index) => {
    let name;
    try {
      name = normalizeEntryName(document.name, document.type);
      const key = name.normalize('NFC').toLocaleLowerCase('en-US');
      if (seen.has(key)) throw new Error('Another document already uses this filename.');
      seen.add(key);
      if (document.type === 'xml') validateXml(document.content, Parser);
    } catch (error) {
      throw new Error(`Document ${index + 1}: ${error.message}`);
    }
    return { name, data: new TextEncoder().encode(String(document.content)) };
  });
}

export function validateSettings(settings) {
  if (!(settings.mode in CIMBAR_MODES)) throw new Error('Choose a supported CIMBAR mode.');
  const rps = Number(settings.rps);
  if (!VALID_RPS.includes(rps)) throw new Error('RPS must be 5, 10, 15, or 20.');
  const pixels = Number(settings.pixels);
  if (!Number.isInteger(pixels) || pixels < PIXEL_LIMITS.min || pixels > PIXEL_LIMITS.max || pixels % 4 !== 0) {
    throw new Error('Pixel width must be a multiple of 4 from 512 through 2048.');
  }
  return { mode: settings.mode, modeValue: CIMBAR_MODES[settings.mode], rps, pixels };
}
