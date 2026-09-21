# Web decoder round-trip test

This is the release acceptance procedure for the camera-dependent requirement.

## Setup

1. Load `extension/` as an unpacked extension in Chrome 152 or newer.
2. On a second camera-enabled device, open <https://re.cimbar.org/> and grant camera access.
3. In the extension, create these documents:
   - `hello.txt`: `Hello from the offline CIMBAR extension. 안녕하세요.`
   - `config.xml`: `<?xml version="1.0" encoding="UTF-8"?><config enabled="true"><name>CIMBAR</name></config>`
4. Use archive name `decoder-acceptance`, mode B, 15 RPS, and 1024 px.
5. Select **Build & display CIMBAR**, acknowledge the flashing-image warning, and point the decoder camera at the full barcode.

## Pass criteria

- The web decoder reaches 100% and offers `decoder-acceptance.zip`.
- `unzip -t decoder-acceptance.zip` reports no errors.
- The archive contains exactly `hello.txt` and `config.xml`.
- Both extracted byte sequences exactly match the text above in UTF-8.

If scanning is unreliable, increase the displayed pixel width or try Bm/Bu and 10 or 5 RPS. A lower RPS improves camera exposure/read reliability; Bu trades throughput for robustness.

## Test record

- Automated archive/encoder checks: see `docs/JOBS.md`.
- Physical camera scan: pending a two-display/camera setup; record date, Chrome version, decoder device, selected settings, and result here when performed.
