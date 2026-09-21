# CIMBAR Text Bundle Encoder — Product Requirements Document

- Status: Approved for implementation
- Created: 2026-09-20 22:36 KST
- Target: Google Chrome desktop, major version 152 or newer
- Extension platform: Manifest V3

## 1. Product summary

The CIMBAR Text Bundle Encoder is a self-contained Chrome extension that lets a user compose multiple text documents, package them into one standards-compliant ZIP archive, and display that archive as an animated CIMBAR barcode. After installation, encoding must work without an internet connection or any runtime download.

The resulting CIMBAR stream must use the upstream `libcimbar` encoder format and preserve the archive filename so that the web decoder at <https://re.cimbar.org/> can recover a `.zip` file. The recovered ZIP must contain each document under the filename chosen by the user.

## 2. Goals

1. Create, rename, edit, duplicate, and remove multiple text entries in one extension page.
2. Let each entry be stored as `.txt` or `.xml`; reject malformed XML before encoding.
3. Produce a deterministic, unencrypted ZIP archive entirely in the browser.
4. Feed the ZIP bytes into the official `libcimbar` WebAssembly encoder bundled with the extension.
5. Let users adjust animation rate (RPS/frames per second), rendered barcode pixel size, and CIMBAR encoding mode.
6. Present a neutral text-to-ZIP utility by default and reveal CIMBAR functionality only after the user types the `cimbar` unlock sequence.
7. Provide a large, distraction-free display suitable for camera scanning and an accessible photosensitivity warning.
8. Require no host permissions, remote code, server, login, upload, or runtime asset download.
9. Load and operate as a Manifest V3 extension on Chrome desktop major 152.

## 3. Non-goals

- Decoding CIMBAR inside the extension.
- Adding arbitrary binary files in the first release.
- Password-protected or compressed ZIP entries. The ZIP uses the portable STORE method because CIMBAR applies Zstandard compression to the entire payload.
- Synchronizing documents across devices.
- Publishing to the Chrome Web Store as part of this repository task.

## 4. Primary user flow

1. The user clicks the extension toolbar button; the editor opens in a dedicated tab.
2. One initial text entry is present. The user edits its filename, chooses TXT or XML, and enters text.
3. The user adds any number of additional entries and optionally reorders, duplicates, or removes them.
4. The user chooses a ZIP filename and creates or downloads the archive locally.
5. When transfer is needed, the user types `cimbar` to reveal mode, RPS, pixel-width, and display controls.
6. The user presses **Build & display CIMBAR**.
7. The extension validates filenames, duplicate paths, XML documents, and size constraints; it then creates the ZIP locally.
8. The full-window CIMBAR display begins. The user scans it with <https://re.cimbar.org/> and downloads the decoded ZIP.
9. The user exits the display to revise content or settings.

## 5. Functional requirements

### 5.1 Text document editor

- Start with one entry named `document-1.txt`.
- Add, duplicate, delete, and move entries up or down.
- Edit the base filename independently of the TXT/XML selector.
- Normalize the extension to the selected type.
- Preserve Unicode text and filenames using UTF-8.
- Prevent empty names, absolute paths, `.`/`..` path segments, control characters, duplicate normalized paths, and ZIP-slip paths.
- Allow `/` in a name for intentional folders inside the archive.
- Parse XML with the browser `DOMParser` and show the specific entry that fails validation.
- Keep draft content and settings in `chrome.storage.local` when available, with a localStorage fallback for ordinary browser test pages.

### 5.2 ZIP packaging

- Generate a valid ZIP32 archive with local headers, central directory, end-of-central-directory record, CRC-32 checksums, UTF-8 filename flags, and STORE entries.
- Use a stable timestamp representation so identical documents produce identical ZIP bytes.
- Name the transmitted file using the chosen `.zip` archive name.
- Offer **Download ZIP** so archive contents can be inspected independently of CIMBAR.
- Refuse ZIP32 limits rather than silently generating an invalid archive.

### 5.3 CIMBAR encoding and display

- Vendor the official `libcimbar` v0.6.8 JavaScript and WebAssembly release assets in the extension.
- Support these decoder-compatible modes:
  - `B` (default, fastest general-purpose mode)
  - `Bm` (smaller/more robust)
  - `Bu` (most robust, slowest)
  - `4C` (legacy four-color mode)
- Support 5, 10, 15, and 20 RPS, with 15 as the default. “RPS” is the UI term for rendered CIMBAR frames per second.
- Support visible output widths from 512 through 2048 pixels. Preserve each mode's official native WebGL dimensions and aspect ratio, then scale the visible canvas to the selected width or the available viewport, whichever is smaller. This avoids altering the encoded symbol grid.
- Keep successive CIMBAR frames aligned to a fixed screen position without libcimbar's built-in alternating display offset.
- Provide pause/resume, restart, fullscreen, and exit controls.
- Request a screen wake lock while actively displaying when Chrome allows it; failure must not prevent encoding.
- Warn users before animation that flashing imagery may affect people with photosensitive epilepsy.

### 5.4 Offline and extension behavior

- Bundle every executable and data asset, including the `.wasm` binary.
- Use no host permissions and make no network request during normal operation.
- Use Manifest V3 with `minimum_chrome_version: "152"`.
- Use an extension-page content security policy that permits only local scripts plus WebAssembly execution.
- Open one reusable editor tab when the toolbar action is clicked.
- Use **Text Bundle ZIP** branding in Chrome and in the default editor state, with no visible CIMBAR wording or image-transfer controls.
- In the default state, validate, build, and download ZIP archives without opening the image display flow.
- Unlock the full CIMBAR interface when the user types `cimbar` anywhere in the editor. Keep this state in memory only so every reload and newly opened editor starts locked.

## 6. UX and accessibility requirements

- Responsive desktop layout with a document column and a settings/summary column.
- Clear inline errors plus a live status region.
- Complete keyboard access, visible focus states, semantic labels, and sufficient contrast.
- Respect `prefers-reduced-motion` in the editor UI. Barcode animation only starts after an explicit button press.
- Do not rely on color alone for state.

## 7. Privacy and security

- User content remains on the device and is never transmitted by the extension.
- No analytics or telemetry.
- Render filenames and content through DOM text/value properties, never unsanitized HTML.
- Validate archive paths to prevent traversal when decoded ZIPs are extracted.
- Release object URLs and WebAssembly buffers when replaced where practical.

## 8. Compatibility and acceptance criteria

The release is acceptable when all of the following are true:

1. Chrome loads the unpacked directory without manifest or CSP errors on desktop Chrome 152+.
2. The toolbar action opens the editor and all authoring controls work.
3. At least two entries—one Unicode TXT and one well-formed XML document—round-trip through ZIP creation with names, bytes, CRC values, and contents intact.
4. Invalid XML, duplicate filenames, and traversal filenames block encoding with useful messages.
5. Mode, RPS, and pixel-size changes take effect on the rendered CIMBAR stream.
6. After the extension has been loaded once, normal encoding succeeds with network access disabled.
7. An encoded sample is recoverable as the named ZIP by the current web decoder at <https://re.cimbar.org/>, and the ZIP extracts to the original documents.
8. Automated unit tests cover ZIP construction, CRC-32, path normalization, XML validation, and settings validation.
9. A browser smoke test confirms the official local WASM initializes and renders a non-empty frame.
10. A browser smoke test confirms that nonzero renderer alignment offsets are suppressed during playback.
11. A browser smoke test confirms that ZIP creation works with no visible CIMBAR wording or transfer controls before unlock, and that typing `cimbar` restores the complete transfer flow.

## 9. Test strategy

- Node unit tests for all deterministic JavaScript modules.
- ZIP interoperability check with the operating system `unzip -t`/`unzip -l` tools.
- Chrome headless smoke test for extension loading, authoring interactions, CSP, local WASM initialization, and canvas rendering.
- Manual camera round-trip against <https://re.cimbar.org/> on a second camera-enabled device/browser. This physical scan is the final decoder acceptance gate and is documented separately because it cannot be completed by a headless test alone.

## 10. Dependencies and licensing

- `libcimbar` v0.6.8 WebAssembly assets, licensed under Mozilla Public License 2.0.
- The extension includes the upstream license notice and identifies the exact source tag used for the executable form.
- No package-manager runtime dependency is required.
