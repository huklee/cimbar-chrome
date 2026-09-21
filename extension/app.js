import { CimbarEncoder } from './lib/encoder.js';
import { createZip } from './lib/zip.js';
import { normalizeArchiveName, normalizeEntryName, validateDocuments, validateSettings, VALID_RPS } from './lib/validation.js';
import { loadDraft, saveDraft } from './lib/storage.js';
import { createUnlockDetector } from './lib/unlock.js';

const $ = (selector, root = document) => root.querySelector(selector);
const elements = {
  list: $('#document-list'), template: $('#document-template'), add: $('#add-document'),
  archive: $('#archive-name'), rps: $('#rps'), rpsOutput: $('#rps-output'), pixels: $('#pixels'),
  size: $('#bundle-size'), count: $('#bundle-count'), status: $('#status'), build: $('#build'),
  download: $('#download-zip'), warning: $('#warning-dialog'), confirm: $('#confirm-display'),
  display: $('#display'), canvas: $('#cimbar-canvas'), displayFilename: $('#display-filename'),
  displaySettings: $('#display-settings'), pause: $('#pause'), restart: $('#restart'),
  fullscreen: $('#fullscreen'), exit: $('#exit-display'),
  brand: $('#brand'), brandTitle: $('#brand-title'), brandSubtitle: $('#brand-subtitle'),
  heroEyebrow: $('#hero-eyebrow'), heroLine: $('#hero-line'), heroAccent: $('#hero-accent'),
  heroDescription: $('#hero-description'), settingsTitle: $('#settings-title'),
  buildLabel: $('#build-label'), buildArrow: $('#build-arrow'),
  transferOnly: [...document.querySelectorAll('[data-transfer-only]')],
};

let documents = [{ id: crypto.randomUUID(), name: 'document-1', type: 'txt', content: '' }];
let latestZip = null;
let pendingTransmission = null;
let saveTimer = 0;
let transferUnlocked = false;
let transferRuntimePromise = null;
const encoder = new CimbarEncoder(elements.canvas, ({ paused }) => {
  elements.pause.textContent = paused ? 'Resume' : 'Pause';
});

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function setStatus(message, kind = '') {
  elements.status.textContent = message;
  elements.status.dataset.kind = kind;
}

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = source;
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load ${source}.`)), { once: true });
    document.head.append(script);
  });
}

function ensureTransferRuntime() {
  if (!transferRuntimePromise) {
    transferRuntimePromise = (async () => {
      await loadScript('cimbar-runtime.js');
      await loadScript('vendor/cimbar.js');
      return window.cimbarModuleReady;
    })();
  }
  return transferRuntimePromise;
}

function currentSettings() {
  return {
    mode: $('input[name="mode"]:checked').value,
    rps: VALID_RPS[Number(elements.rps.value)],
    pixels: Number(elements.pixels.value),
  };
}

function updateSummary() {
  const bytes = documents.reduce((sum, item) => sum + new TextEncoder().encode(item.content).length, 0);
  elements.size.textContent = formatBytes(bytes);
  const compression = transferUnlocked ? 'ZIP/CIMBAR compression' : 'ZIP compression';
  elements.count.textContent = `${documents.length} ${documents.length === 1 ? 'file' : 'files'} before ${compression}`;
  elements.rpsOutput.value = String(VALID_RPS[Number(elements.rps.value)]);
}

function unlockTransferMode() {
  if (transferUnlocked) return;
  transferUnlocked = true;
  document.documentElement.dataset.transferMode = 'unlocked';
  document.title = 'CIMBAR Text Bundle Encoder';
  elements.brand.setAttribute('aria-label', 'CIMBAR encoder home');
  elements.brandTitle.textContent = 'CIMBAR';
  elements.brandSubtitle.textContent = 'TEXT BUNDLE ENCODER';
  elements.heroEyebrow.textContent = 'AIR-GAPPED FILE TRANSFER';
  elements.heroLine.textContent = 'Turn text into';
  elements.heroAccent.textContent = 'moving light.';
  elements.heroDescription.textContent = 'Compose a small bundle of TXT or XML documents. This extension zips them locally and renders a decoder-compatible CIMBAR stream—nothing leaves this browser.';
  elements.settingsTitle.textContent = 'Transmission';
  elements.buildLabel.textContent = 'Build & display CIMBAR';
  elements.buildArrow.hidden = false;
  elements.transferOnly.forEach((element) => { element.hidden = false; });
  updateSummary();
  setStatus('CIMBAR encoder loading…');
  ensureTransferRuntime().then(() => {
    setStatus('CIMBAR transfer mode unlocked.', 'success');
  }).catch((error) => setStatus(error.message, 'error'));
}

document.documentElement.dataset.transferMode = 'locked';
document.addEventListener('keydown', createUnlockDetector(unlockTransferMode));

function draft() {
  return { documents, archiveName: elements.archive.value, settings: currentSettings() };
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveDraft(draft()).catch(() => {}), 250);
}

function safeResolvedName(item) {
  try { return normalizeEntryName(item.name, item.type); } catch { return 'Invalid filename'; }
}

function renderDocuments() {
  elements.list.replaceChildren();
  documents.forEach((item, index) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = $('.document-card', fragment);
    card.dataset.id = item.id;
    $('.document-number', card).textContent = String(index + 1).padStart(2, '0');
    $('[data-field="name"]', card).value = item.name;
    $('[data-field="type"]', card).value = item.type;
    $('[data-field="content"]', card).value = item.content;
    $('.character-count', card).textContent = `${item.content.length.toLocaleString()} characters`;
    $('.resolved-name', card).textContent = safeResolvedName(item);
    $('[data-action="up"]', card).disabled = index === 0;
    $('[data-action="down"]', card).disabled = index === documents.length - 1;
    $('[data-action="delete"]', card).disabled = documents.length === 1;
    elements.list.append(fragment);
  });
  updateSummary();
}

function addDocument(copy = null, afterIndex = documents.length - 1) {
  const next = copy
    ? { ...copy, id: crypto.randomUUID(), name: `${copy.name}-copy` }
    : { id: crypto.randomUUID(), name: `document-${documents.length + 1}`, type: 'txt', content: '' };
  documents.splice(afterIndex + 1, 0, next);
  renderDocuments();
  scheduleSave();
}

elements.list.addEventListener('input', (event) => {
  const field = event.target.dataset.field;
  if (!field) return;
  const card = event.target.closest('.document-card');
  const item = documents.find((document) => document.id === card.dataset.id);
  item[field] = event.target.value;
  $('.character-count', card).textContent = `${item.content.length.toLocaleString()} characters`;
  $('.resolved-name', card).textContent = safeResolvedName(item);
  updateSummary();
  scheduleSave();
});

elements.list.addEventListener('change', (event) => {
  if (event.target.dataset.field === 'type') {
    const card = event.target.closest('.document-card');
    const item = documents.find((document) => document.id === card.dataset.id);
    item.type = event.target.value;
    $('.resolved-name', card).textContent = safeResolvedName(item);
    scheduleSave();
  }
});

elements.list.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const card = button.closest('.document-card');
  const index = documents.findIndex((document) => document.id === card.dataset.id);
  if (button.dataset.action === 'delete' && documents.length > 1) documents.splice(index, 1);
  if (button.dataset.action === 'duplicate') return addDocument(documents[index], index);
  if (button.dataset.action === 'up' && index > 0) [documents[index - 1], documents[index]] = [documents[index], documents[index - 1]];
  if (button.dataset.action === 'down' && index < documents.length - 1) [documents[index + 1], documents[index]] = [documents[index], documents[index + 1]];
  renderDocuments();
  scheduleSave();
});

elements.add.addEventListener('click', () => addDocument());
[elements.archive, elements.rps, elements.pixels, $('#mode-options')].forEach((element) => {
  element.addEventListener('input', () => { updateSummary(); scheduleSave(); });
  element.addEventListener('change', () => { updateSummary(); scheduleSave(); });
});

elements.build.addEventListener('click', () => {
  try {
    const entries = validateDocuments(documents);
    const settings = transferUnlocked ? validateSettings(currentSettings()) : null;
    const filename = normalizeArchiveName(elements.archive.value);
    const bytes = createZip(entries);
    latestZip = { bytes, filename };
    pendingTransmission = transferUnlocked ? { bytes, filename, settings } : null;
    elements.download.disabled = false;
    setStatus(`${filename} ready · ${formatBytes(bytes.length)}`, 'success');
    if (transferUnlocked) elements.warning.showModal();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

elements.warning.addEventListener('close', async () => {
  if (elements.warning.returnValue !== 'default' || !pendingTransmission) return;
  const transmission = pendingTransmission;
  elements.display.hidden = false;
  elements.displayFilename.textContent = transmission.filename;
  elements.displaySettings.textContent = `${transmission.settings.mode} · ${transmission.settings.rps} RPS · ${transmission.settings.pixels}px`;
  document.body.classList.add('is-displaying');
  setStatus('Preparing CIMBAR frames…');
  try {
    await ensureTransferRuntime();
    const dimensions = await encoder.encode(transmission.bytes, transmission.filename, transmission.settings);
    setStatus(`Displaying ${transmission.filename} at ${dimensions.width}×${dimensions.height}.`, 'success');
  } catch (error) {
    elements.display.hidden = true;
    document.body.classList.remove('is-displaying');
    setStatus(error.message, 'error');
  }
});

elements.download.addEventListener('click', () => {
  if (!latestZip) return;
  const url = URL.createObjectURL(new Blob([latestZip.bytes], { type: 'application/zip' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = latestZip.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

elements.pause.addEventListener('click', () => encoder.togglePause());
elements.restart.addEventListener('click', async () => {
  elements.restart.disabled = true;
  try { await encoder.restart(); } catch (error) { setStatus(error.message, 'error'); }
  elements.restart.disabled = false;
});
elements.fullscreen.addEventListener('click', async () => {
  if (document.fullscreenElement) await document.exitFullscreen();
  else await elements.display.requestFullscreen();
});
elements.exit.addEventListener('click', async () => {
  encoder.stop();
  if (document.fullscreenElement) await document.exitFullscreen();
  elements.display.hidden = true;
  document.body.classList.remove('is-displaying');
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && encoder.active && !encoder.paused) encoder.acquireWakeLock();
});

async function restoreDraft() {
  const saved = await loadDraft();
  if (!saved) return;
  if (Array.isArray(saved.documents) && saved.documents.length > 0) {
    documents = saved.documents.map((item) => ({
      id: crypto.randomUUID(), name: String(item.name ?? ''),
      type: item.type === 'xml' ? 'xml' : 'txt', content: String(item.content ?? ''),
    }));
  }
  if (typeof saved.archiveName === 'string') {
    elements.archive.value = saved.archiveName === 'cimbar-bundle' ? 'text-bundle' : saved.archiveName;
  }
  if (saved.settings) {
    const mode = [...document.querySelectorAll('input[name="mode"]')]
      .find((input) => input.value === saved.settings.mode);
    if (mode) mode.checked = true;
    const rpsIndex = VALID_RPS.indexOf(Number(saved.settings.rps));
    if (rpsIndex >= 0) elements.rps.value = String(rpsIndex);
    if ([512, 768, 1024, 1280, 1536, 2048].includes(Number(saved.settings.pixels))) elements.pixels.value = String(saved.settings.pixels);
  }
}

await restoreDraft();
renderDocuments();
