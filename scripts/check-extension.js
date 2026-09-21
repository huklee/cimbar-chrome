import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve('extension');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const packageMetadata = JSON.parse(await readFile(resolve('package.json'), 'utf8'));
const required = [
  'app.html', 'app.css', 'app.js', 'background.js', 'cimbar-runtime.js',
  'vendor/cimbar.js', 'vendor/cimbar.wasm', 'vendor/LICENSE-libcimbar',
];

if (manifest.manifest_version !== 3) throw new Error('Manifest V3 is required.');
if (manifest.minimum_chrome_version !== '152') throw new Error('Chrome 152 minimum is required.');
if (manifest.version !== packageMetadata.version) throw new Error('Manifest and package versions must match.');
if (manifest.name !== 'Text Bundle ZIP') throw new Error('Undercover extension name is missing.');
if (/cimbar/i.test(`${manifest.name} ${manifest.description} ${manifest.action.default_title}`)) {
  throw new Error('The default Chrome UI must not expose the transfer mode.');
}
if (manifest.host_permissions?.length) throw new Error('The extension must not request host permissions.');
if (!manifest.content_security_policy.extension_pages.includes("'wasm-unsafe-eval'")) throw new Error('WASM CSP token is missing.');

for (const file of required) {
  const info = await stat(resolve(root, file));
  if (!info.isFile() || info.size === 0) throw new Error(`Required asset is missing: ${file}`);
}

const wasm = await readFile(resolve(root, 'vendor/cimbar.wasm'));
if (wasm.subarray(0, 4).toString('hex') !== '0061736d') throw new Error('Bundled encoder is not a WebAssembly binary.');
console.log(`Extension check passed (${(wasm.length / 1024 / 1024).toFixed(2)} MiB local WASM).`);
