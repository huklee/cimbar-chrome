(function initializeCimbarRuntime(global) {
  let resolveReady;
  let rejectReady;
  global.cimbarModuleReady = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  global.Module = {
    canvas: document.getElementById('cimbar-canvas'),
    locateFile(path) {
      return path.endsWith('.wasm') ? 'vendor/cimbar.wasm' : `vendor/${path}`;
    },
    onRuntimeInitialized() {
      resolveReady(global.Module);
      global.dispatchEvent(new CustomEvent('cimbar-runtime-ready'));
    },
    onAbort(reason) {
      rejectReady(new Error(`CIMBAR WebAssembly aborted: ${reason}`));
    },
  };
})(window);
