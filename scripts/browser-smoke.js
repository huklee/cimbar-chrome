import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const chromePath = process.env.CIMBAR_CHROME_PATH
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const extensionRoot = resolve('extension');
const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.png': 'image/png' };

function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

function commandSocket(url) {
  const socket = new WebSocket(url);
  let sequence = 0;
  const waiting = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    const resolveMessage = waiting.get(message.id);
    if (resolveMessage) {
      waiting.delete(message.id);
      resolveMessage(message);
    }
  });
  const ready = new Promise((resolveReady, reject) => {
    socket.addEventListener('open', resolveReady, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return {
    async call(method, params = {}) {
      await ready;
      const id = ++sequence;
      const response = new Promise((resolveResponse) => waiting.set(id, resolveResponse));
      socket.send(JSON.stringify({ id, method, params }));
      return response;
    },
    close: () => socket.close(),
  };
}

async function pollJson(url, timeoutMs = 15000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch { /* Chrome is still starting. */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

const webPort = await freePort();
const profile = await mkdtemp(`${tmpdir()}/cimbar-browser-smoke-`);
const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const relative = pathname === '/' ? 'app.html' : decodeURIComponent(pathname.slice(1));
    if (relative.includes('..')) throw new Error('Invalid path');
    const data = await readFile(resolve(extensionRoot, relative));
    response.writeHead(200, {
      'Content-Type': mime[extname(relative)] ?? 'application/octet-stream',
      'Content-Security-Policy': "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    });
    response.end(data);
  } catch {
    response.writeHead(404).end('Not found');
  }
});
await new Promise((resolveListen) => server.listen(webPort, '127.0.0.1', resolveListen));
const debugPort = await freePort();

const chrome = spawn(chromePath, [
  '--headless=new', '--no-first-run', '--disable-default-apps',
  `--user-data-dir=${profile}`, `--remote-debugging-port=${debugPort}`,
  '--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist',
  `http://127.0.0.1:${webPort}/app.html`,
], { stdio: 'ignore' });

try {
  let targets;
  try {
    targets = await pollJson(`http://127.0.0.1:${debugPort}/json`);
  } catch (error) {
    throw new Error(`${error.message}\nChrome exited with code ${chrome.exitCode ?? 'unknown'}.`);
  }
  const page = targets.find((target) => target.url.includes(`${webPort}/app.html`));
  assert(page, 'Chrome did not create the encoder page target.');
  const cdp = commandSocket(page.webSocketDebuggerUrl);
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const state = await cdp.call('Runtime.evaluate', {
      expression: "document.querySelectorAll('.document-card').length",
      returnByValue: true,
    });
    if (state.result.result.value === 1) break;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }

  const interaction = `(() => {
    const fire = (element, type) => element.dispatchEvent(new Event(type, { bubbles: true }));
    const first = document.querySelector('.document-card textarea');
    first.value = 'Hello from Chrome. 안녕하세요.'; fire(first, 'input');
    document.querySelector('#add-document').click();
    const second = document.querySelectorAll('.document-card')[1];
    const name = second.querySelector('[data-field=name]'); name.value = 'config'; fire(name, 'input');
    const type = second.querySelector('[data-field=type]'); type.value = 'xml'; fire(type, 'change');
    const content = second.querySelector('textarea');
    content.value = '<config>'; fire(content, 'input');
    document.querySelector('#build').click();
    const malformedXmlBlocked = !document.querySelector('#warning-dialog').open
      && document.querySelector('#status').dataset.kind === 'error';
    content.value = '<config enabled="true"/>'; fire(content, 'input');
    document.querySelector('#build').click();
    document.querySelector('#confirm-display').click();
    return { malformedXmlBlocked };
  })()`;
  const interactionResult = await cdp.call('Runtime.evaluate', { expression: interaction, returnByValue: true });
  if (interactionResult.result.exceptionDetails) {
    throw new Error(interactionResult.result.exceptionDetails.exception?.description ?? 'Browser interaction failed.');
  }
  assert.equal(interactionResult.result.result.value.malformedXmlBlocked, true);
  await new Promise((resolveWait) => setTimeout(resolveWait, 7000));
  const evaluated = await cdp.call('Runtime.evaluate', {
    expression: `({
      status: document.querySelector('#status').textContent,
      statusKind: document.querySelector('#status').dataset.kind,
      displayVisible: !document.querySelector('#display').hidden,
      canvasWidth: document.querySelector('#cimbar-canvas').width,
      canvasHeight: document.querySelector('#cimbar-canvas').height,
      wasmLoaded: Boolean(window.Module?._cimbare_render),
      documentCount: document.querySelectorAll('.document-card').length
    })`,
    returnByValue: true,
  });
  const result = evaluated.result.result.value;
  console.log('Browser state:', result);
  assert.equal(result.statusKind, 'success', result.status);
  assert.equal(result.displayVisible, true);
  assert.equal(result.wasmLoaded, true);
  assert.equal(result.documentCount, 2);
  assert.equal(result.canvasWidth, 1040);
  assert.equal(result.canvasHeight, 1040);
  const screenshot = await cdp.call('Page.captureScreenshot', { format: 'png' });
  assert(screenshot.result.data.length > 10_000, 'Rendered page screenshot was unexpectedly empty.');
  cdp.close();
  console.log(`Browser smoke passed: ${result.status}`);
} finally {
  chrome.kill('SIGTERM');
  server.close();
  await rm(profile, { recursive: true, force: true });
}
