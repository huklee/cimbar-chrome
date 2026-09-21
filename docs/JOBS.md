# CIMBAR Chrome Extension Job Tracker

Timestamps use Korea Standard Time (KST, UTC+09:00).

## Documentation and design

- [x] Inspect the reference repository and upstream browser encoder. — completed 2026-09-20 22:36 KST
- [x] Confirm Manifest V3 and Chrome 152 compatibility approach. — completed 2026-09-20 22:36 KST
- [x] Write the product requirements document. — completed 2026-09-20 22:36 KST
- [x] Document installation, operation, privacy, limitations, and decoder round-trip procedure. — completed 2026-09-20 23:02 KST

## Extension foundation

- [x] Add the Manifest V3 package with Chrome 152 minimum version and local-only CSP. — completed 2026-09-20 23:02 KST
- [x] Add toolbar action behavior that opens/reuses the full editor tab. — completed 2026-09-20 23:02 KST
- [x] Vendor `libcimbar` v0.6.8 JS/WASM assets and MPL-2.0 notices. — completed 2026-09-20 23:02 KST
- [x] Add extension icons and package validation. — completed 2026-09-20 23:02 KST

## Authoring and ZIP bundle

- [x] Build the multiple-document editor with editable names and TXT/XML selection. — completed 2026-09-20 23:02 KST
- [x] Add document add, duplicate, delete, and reorder actions. — completed 2026-09-20 23:02 KST
- [x] Add secure filename normalization, duplicate detection, and XML validation. — completed 2026-09-20 23:02 KST
- [x] Implement dependency-free ZIP32 STORE generation with CRC-32 and UTF-8 names. — completed 2026-09-20 23:02 KST
- [x] Add archive preview metadata and local ZIP download. — completed 2026-09-20 23:02 KST
- [x] Persist drafts and settings locally. — completed 2026-09-20 23:02 KST

## CIMBAR renderer

- [x] Integrate the local official WebAssembly encoder. — completed 2026-09-20 23:02 KST
- [x] Implement B, Bm, Bu, and 4C mode selection. — completed 2026-09-20 23:02 KST
- [x] Implement 5/10/15/20 RPS control and frame pacing. — completed 2026-09-20 23:02 KST
- [x] Implement adjustable output pixel width and aspect-ratio-safe sizing. — completed 2026-09-20 23:02 KST
- [x] Add animated display, pause/resume, restart, fullscreen, wake lock, and exit controls. — completed 2026-09-20 23:02 KST
- [x] Add explicit photosensitivity warning before playback. — completed 2026-09-20 23:02 KST
- [x] Stabilize frame alignment by suppressing libcimbar's alternating display offset. — completed 2026-09-22 00:08 KST

## Undercover ZIP mode

- [x] Replace default Chrome and editor branding with the neutral Text Bundle ZIP identity. — completed 2026-09-22 01:14 KST
- [x] Hide transfer and image controls by default while retaining standalone ZIP creation and download. — completed 2026-09-22 01:14 KST
- [x] Add a session-only `cimbar` typing sequence that restores the complete transfer interface. — completed 2026-09-22 01:14 KST
- [x] Add and enforce the project versioning policy; bump the feature release to 1.1.0. — completed 2026-09-22 01:14 KST

## Verification

- [x] Add unit tests for CRC-32, ZIP structure, filenames, XML, and settings. — completed 2026-09-20 23:02 KST
- [x] Run ZIP interoperability tests with standard extraction tools. — completed 2026-09-20 23:02 KST
- [x] Run Chrome UI, XML rejection, offline/WASM loading, and live CIMBAR rendering smoke tests. — completed 2026-09-20 23:02 KST
- [x] Verify syntax, manifest, packaged assets, and local-only CSP behavior. — completed 2026-09-20 23:02 KST
- [x] Prepare the documented two-document decoder acceptance bundle and procedure. — completed 2026-09-20 23:02 KST
- [ ] Perform and record a physical round-trip with <https://re.cimbar.org/> (requires a camera/display test setup).

## Verification record

- 2026-09-20 23:01 KST — Node unit suite: 9/9 passed.
- 2026-09-20 23:01 KST — standard `unzip -t`: two UTF-8 entries passed CRC and structure checks.
- 2026-09-20 23:01 KST — desktop Chrome 153 headless: official local v0.6.8 WASM loaded; malformed XML was blocked; two-document ZIP encoded; native 1040×1040 mode-B frame rendered successfully under the extension CSP.
- 2026-09-20 23:01 KST — packaged extension archive: all entries passed `unzip -t`; size 688 KiB.
- 2026-09-22 00:08 KST — 11/11 unit tests and extension validation passed; desktop Chrome 153 rendered the live WASM stream and corrected 24 nonzero alignment offsets during the browser smoke test.
- 2026-09-22 01:14 KST — 14/14 unit tests, extension validation, and packaging passed; Chrome 153 verified a CIMBAR-free ZIP-only default, successful ZIP creation before unlock, the `cimbar` unlock sequence, lazy WASM loading, and live stabilized transfer playback.
