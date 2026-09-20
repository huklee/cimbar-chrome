export class CimbarEncoder {
  constructor(canvas, onState = () => {}) {
    this.canvas = canvas;
    this.onState = onState;
    this.module = null;
    this.animationId = 0;
    this.lastFrameAt = 0;
    this.rps = 15;
    this.paused = false;
    this.active = false;
    this.wakeLock = null;
    this.current = null;
    this.displaySize = null;
    window.addEventListener('resize', () => this.applyDisplaySize());
  }

  async initialize() {
    if (this.module) return this.module;
    this.module = await window.cimbarModuleReady;
    return this.module;
  }

  async encode(bytes, filename, settings) {
    const module = await this.initialize();
    this.stop();
    this.current = { bytes: new Uint8Array(bytes), filename, settings: { ...settings } };
    this.rps = settings.rps;

    const configured = module._cimbare_configure(settings.modeValue, -1);
    if (configured < 0) throw new Error(`CIMBAR configuration failed (${configured}).`);
    const ratio = module._cimbare_get_aspect_ratio();
    const height = Math.max(4, Math.round(settings.pixels / ratio));
    const initialized = module._cimbare_init_window(0, 0);
    if (initialized < 0) throw new Error(`CIMBAR WebGL initialization failed (${initialized}).`);
    this.displaySize = { width: settings.pixels, height };
    this.applyDisplaySize();

    const filenameBytes = new TextEncoder().encode(filename);
    const filenamePtr = module._malloc(filenameBytes.length);
    try {
      module.HEAPU8.set(filenameBytes, filenamePtr);
      const result = module._cimbare_init_encode(filenamePtr, filenameBytes.length, -1);
      if (result < 0) throw new Error(`CIMBAR stream initialization failed (${result}).`);
    } finally {
      module._free(filenamePtr);
    }

    const chunkSize = module._cimbare_encode_bufsize() * 16;
    const dataPtr = module._malloc(chunkSize);
    let result = 1;
    try {
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
        module.HEAPU8.set(chunk, dataPtr);
        result = module._cimbare_encode(dataPtr, chunk.length);
        if (result < 0) throw new Error(`CIMBAR data encoding failed (${result}).`);
      }
      if (bytes.length === 0 || result === 1) {
        result = module._cimbare_encode(dataPtr, 0);
      }
      if (result !== 0) throw new Error(`CIMBAR did not finish the input stream (${result}).`);
    } finally {
      module._free(dataPtr);
    }

    module._cimbare_next_frame(false);
    this.active = true;
    this.paused = false;
    this.lastFrameAt = 0;
    this.onState({ active: true, paused: false, width: settings.pixels, height });
    this.animationId = requestAnimationFrame((timestamp) => this.render(timestamp));
    this.acquireWakeLock();
    return { width: settings.pixels, height };
  }

  applyDisplaySize() {
    if (!this.displaySize) return;
    const availableWidth = Math.max(1, window.innerWidth - 24);
    const availableHeight = Math.max(1, window.innerHeight - 24);
    const scale = Math.min(1, availableWidth / this.displaySize.width, availableHeight / this.displaySize.height);
    this.canvas.style.setProperty('width', `${Math.floor(this.displaySize.width * scale)}px`, 'important');
    this.canvas.style.setProperty('height', `${Math.floor(this.displaySize.height * scale)}px`, 'important');
  }

  render(timestamp) {
    if (!this.active) return;
    const interval = 1000 / this.rps;
    if (!this.paused && (!this.lastFrameAt || timestamp - this.lastFrameAt >= interval)) {
      this.module._cimbare_render();
      this.module._cimbare_next_frame(false);
      this.lastFrameAt = timestamp;
    }
    this.animationId = requestAnimationFrame((next) => this.render(next));
  }

  togglePause() {
    if (!this.active) return false;
    this.paused = !this.paused;
    this.onState({ active: true, paused: this.paused });
    if (this.paused) this.releaseWakeLock();
    else this.acquireWakeLock();
    return this.paused;
  }

  async restart() {
    if (!this.current) return;
    const { bytes, filename, settings } = this.current;
    await this.encode(bytes, filename, settings);
  }

  stop() {
    this.active = false;
    this.paused = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = 0;
    this.releaseWakeLock();
    this.onState({ active: false, paused: false });
  }

  async acquireWakeLock() {
    if (!('wakeLock' in navigator) || this.wakeLock) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => { this.wakeLock = null; }, { once: true });
    } catch {
      // Wake lock is an optional enhancement and may be denied by browser policy.
    }
  }

  async releaseWakeLock() {
    const lock = this.wakeLock;
    this.wakeLock = null;
    if (lock) {
      try { await lock.release(); } catch { /* already released */ }
    }
  }
}
