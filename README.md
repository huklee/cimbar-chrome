# CIMBAR Text Bundle Encoder

A self-contained Chrome extension for composing multiple TXT or XML documents
and packaging them into a ZIP archive. Its optional animated CIMBAR transfer
tools are concealed until explicitly unlocked.

All editing, validation, ZIP creation, and encoding happens locally. The
extension bundles the official `libcimbar` v0.6.8 JavaScript and WebAssembly
encoder, so it needs no server, runtime download, account, or host permission.

## Features

- Multiple editable and reorderable text documents
- TXT and XML output with XML well-formedness validation
- Editable UTF-8 filenames and archive name
- Deterministic ZIP32 generation with CRC-32 checksums
- Neutral **Text Bundle ZIP** interface by default, with no transfer branding or image controls
- Session-only transfer unlock by typing `cimbar`
- CIMBAR B, Bm, Bu, and legacy 4C modes
- 5, 10, 15, and 20 rendered frames per second
- Adjustable 512–2048 px display size while preserving native encoder geometry
- Stable frame alignment without libcimbar's alternating display offset
- Pause, restart, fullscreen, wake-lock, and ZIP download controls
- Local draft persistence through `chrome.storage.local`
- Manifest V3 compatibility with desktop Chrome 152+

## Install unpacked

1. Open `chrome://extensions` in desktop Chrome 152 or newer.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Choose the [`extension/`](extension/) directory.
5. Pin the extension and click its toolbar icon.

The extension opens as a text-to-ZIP utility. Type `cimbar` anywhere in the
editor to reveal the complete transfer controls for the current page session.
Reloading or reopening the editor returns it to ZIP-only mode.

See [`docs/EXTENSION.md`](docs/EXTENSION.md) for complete usage and privacy
information.

## Build a distributable ZIP

No compilation is required. To create an archive suitable for loading or
sharing:

```sh
npm run package
```

This produces `cimbar-text-bundle-extension.zip` from the `extension/`
directory. The generated archive is intentionally not committed.

## Test

```sh
npm test
npm run check
npm run test:browser
```

The browser smoke test uses the standard macOS Chrome location by default. Set
`CIMBAR_CHROME_PATH` when Chrome or Chromium is installed elsewhere.

The physical camera acceptance procedure for <https://re.cimbar.org/> is
documented in [`docs/DECODER_TEST.md`](docs/DECODER_TEST.md).

## Documentation

- [`docs/PRD.md`](docs/PRD.md) — product requirements
- [`docs/JOBS.md`](docs/JOBS.md) — timestamped implementation tracker
- [`docs/EXTENSION.md`](docs/EXTENSION.md) — installation and usage
- [`docs/DECODER_TEST.md`](docs/DECODER_TEST.md) — camera round-trip test
- [`docs/VERSIONING.md`](docs/VERSIONING.md) — release versioning policy
- [`extension/THIRD_PARTY_NOTICES.md`](extension/THIRD_PARTY_NOTICES.md) — dependency notice

## License

This repository is licensed under the Mozilla Public License 2.0. Bundled
`libcimbar` assets retain their upstream MPL-2.0 notice in
`extension/vendor/LICENSE-libcimbar`.
