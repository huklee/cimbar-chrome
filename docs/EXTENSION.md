# CIMBAR Text Bundle Chrome Extension

## Install for development

1. Use desktop Google Chrome 152 or newer.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose this repository's `extension/` folder.
5. Pin **Text Bundle ZIP** and click its toolbar icon. The extension opens its editor in a reusable tab.

No server, build step, account, host permission, or internet connection is required. The official `libcimbar` v0.6.8 JavaScript and WebAssembly encoder is included locally.

## Use

By default, the extension is a neutral text-to-ZIP utility. Add documents, edit each filename, select TXT or XML, enter the content, and choose the archive name. **Create ZIP** validates the bundle and enables **Download latest ZIP**. Transfer branding, image settings, and display controls are not visible in this mode.

To enable transfer mode, type `cimbar` anywhere in the editor. Mode, RPS, pixel-width, and display controls then appear and **Build & display CIMBAR** becomes available. The unlock lasts only for the current page session; reload or reopen the editor to return to ZIP-only mode.

Use <https://re.cimbar.org/> on a camera-enabled device to scan. The decoder returns the named ZIP archive; extract it to recover all documents. The **Download latest ZIP** button is useful for checking the exact pre-transmission archive.

Modes B, Bm, Bu, and legacy 4C match the official encoder. B is fastest in typical conditions, while Bm and Bu progressively trade speed for scan robustness. The recommended starting point is B at 15 RPS and 1024 px.

The extension holds every rendered frame at the same screen position. It suppresses libcimbar's built-in alternating display offset while leaving the encoded frame contents unchanged.

## Privacy and offline behavior

All document editing, ZIP creation, and CIMBAR encoding occurs inside the extension. Drafts are stored only in `chrome.storage.local`. The extension has no host permissions, makes no application network requests, and contains no telemetry.

## Development checks

```sh
npm test
npm run check
npm run test:browser
npm run package
```

`test:browser` uses desktop Chrome at the standard macOS path. Set
`CIMBAR_CHROME_PATH` to a different Chrome/Chromium executable when needed.

The camera-based decoder acceptance procedure is in [`DECODER_TEST.md`](DECODER_TEST.md).

## Known limits

- Only authored UTF-8 TXT and XML documents are supported.
- ZIP32 limits apply; large files are also constrained by browser/WebAssembly memory.
- Camera scanning quality depends on screen brightness, reflections, focus, distance, selected mode, and frame rate.
- Automated tests can verify ZIP correctness and encoder rendering, but the final web-decoder camera round-trip requires a physical camera/display setup.
