# Toolbench

A self-hosted, all-in-one utility dashboard. Every tool is a small backend "module"
plugged into a registry; the frontend renders whatever's registered, so adding a
new tool never touches the UI code.

```
toolbench/
  server/            Express API
    modules/          one file per tool — the plugin system
      registry.js      registration + lookup, no tool-specific code here
      pdfCompress.js
      bgRemove.js
      mp4ToMp3.js
      _execa.js         tiny child_process wrapper used by CLI-backed tools
      _zip.js           zip helper used by multi-output tools and batch mode
    registerAll.js     every module import + registerModule() call, shared by the
                       server and the CLI so there's one source of truth
    batch.js           zip-in/zip-out batch runner for single-file tools
    purge.js           auto-deletes old uploads/outputs on a timer
    bin/
      cli.js            `toolbench` command — run any tool from the terminal
      check-deps.js     reports which optional system binaries are installed
    test/
      smoke.test.js     run()-level smoke tests for every zero-system-dep module
    config.js          paths + env
    ollama.js           local AI helper (rename suggestions, NL routing)
    index.js            routes: /api/tools, /api/tools/:id, /api/assist, /api/download/:file
    Dockerfile
  client/             React + Vite frontend
    src/
      components/
        BackgroundScene.jsx   three.js ambient background
        Hero.jsx               anime.js entrance animation
        ToolGrid.jsx            fetches /api/tools, renders the socket grid
        RunPanel.jsx             upload/run/download modal for a selected tool
        AssistBar.jsx            natural-language router, calls Ollama
      lib/
        clientTools.js  pure-JS ports of the "instant" tools — run in the browser
      App.jsx
    Dockerfile
  docker-compose.yml
```

## Running it

You'll need Node 22+ (pdfjs-dist 6.x, used by Redact PDF and Compare PDFs, requires it).

### Required system dependencies (for most tools)

- `ffmpeg` on PATH — video/audio processing (trim, merge, convert, normalize, etc.)
- `yt-dlp` on PATH — YouTube & Pinterest downloader (`pip install yt-dlp`)
- `spotdl` on PATH — Spotify downloader (`pip install spotdl`)

### Optional system dependencies (only for specific tools)

- `rembg` on PATH — Remove Background (`pip install rembg`)
- `pdftoppm` (poppler-utils) — PDF → Images, Compare PDFs (`apt install poppler-utils` / `brew install poppler`)
- `qpdf` — PDF unlock, PDF Repair fallback (`apt install qpdf` / `brew install qpdf`)
- `soffice` (LibreOffice) — Word/Excel/PowerPoint ↔ PDF (`apt install libreoffice` / `brew install --cask libreoffice`)

`pdf-lib`, `pdfjs-dist`, `pixelmatch`/`pngjs`, and `puppeteer` are plain npm deps — no
system install needed for Organize/Page Numbers/Repair/Redact/Sign/Scan-to-PDF/Compare/HTML→PDF
beyond `npm install` (Puppeteer downloads its own headless Chromium on install).

### AI assist (optional)

- [Ollama](https://ollama.com) running locally if you want the AI-assist features —
  `ollama pull llama3.2:1b` (or whatever small model you prefer, set via `OLLAMA_MODEL`)

### Zero-dependency tools (pure Node, work out of the box)

Compress PDF, Merge PDFs, Split PDF, Extract PDF Text, Add Watermark, Images → PDF,
Organize/Rotate Pages, Add Page Numbers, Repair PDF, Redact PDF, Sign PDF,
Resize/Convert Image, Crop Image, Strip EXIF, Image → Favicon, Collage, Upscale, Compress Image,
Meme Generator, Color Palette Extractor, Image Watermark, Add Border (sharp),
CSV ↔ JSON, QR Code Generator/Reader, Text Diff, Case Converter, OCR, Scan → Searchable PDF,
Markdown → PDF, HTML → PDF, JSON Formatter, Base64/URL Encode-Decode, Hash Generator,
Word Counter, Regex Tester, UUID Generator, Lorem Ipsum Generator, Password Generator,
Unit Converter, BMI Calculator, Barcode Generator, Duplicate File Finder,
Extract/Fill PDF Form Fields —
all work with no extra system installs beyond Node and `npm install`.

Note: `md-to-pdf` runs on Puppeteer, so its first run downloads a headless Chromium.

```bash
# terminal 1
cd server
npm install
npm run dev        # http://localhost:4500

# terminal 2
cd client
npm install
npm run dev         # http://localhost:5432, proxies /api to :4500
```

## Current tools

| Tool | id | Category |
|---|---|---|
| Compress PDF | `pdf-compress` | pdf |
| Merge PDFs | `pdf-merge` | pdf |
| Split PDF | `pdf-split` | pdf |
| Extract PDF Text | `pdf-extract-text` | pdf |
| Add Watermark | `pdf-watermark` | pdf |
| Images → PDF | `images-to-pdf` | pdf |
| PDF → Images | `pdf-to-images` | pdf |
| Protect / Unlock PDF | `pdf-protect` | pdf |
| Word → PDF | `docx-to-pdf` | pdf |
| PDF → Word | `pdf-to-docx` | pdf |
| Excel → PDF | `excel-to-pdf` | pdf |
| PowerPoint → PDF | `ppt-to-pdf` | pdf |
| PDF → Excel | `pdf-to-excel` | pdf |
| PDF → PowerPoint | `pdf-to-ppt` | pdf |
| Organize / Rotate Pages | `pdf-organize` | pdf |
| Add Page Numbers | `pdf-page-numbers` | pdf |
| Repair PDF | `pdf-repair` | pdf |
| Redact PDF | `pdf-redact` | pdf |
| Sign PDF | `sign-pdf` | pdf |
| Scan → Searchable PDF | `scan-to-pdf` | pdf |
| Compare PDFs | `pdf-compare` | pdf |
| HTML → PDF | `html-to-pdf` | pdf |
| Remove Background | `bg-remove` | image |
| Resize / Convert Image | `image-convert` | image |
| Crop Image | `image-crop` | image |
| Strip EXIF / Metadata | `image-strip-exif` | image |
| Image → Favicon / Icon Set | `image-to-favicon` | image |
| Collage / Merge Images | `image-collage` | image |
| Upscale Image | `image-upscale` | image |
| YouTube Downloader | `youtube-download` | downloader |
| Pinterest Downloader | `pinterest-download` | downloader |
| Spotify Downloader | `spotify-download` | downloader |
| Trim Video | `video-trim` | video |
| Compress Video | `video-compress` | video |
| Video → GIF | `video-to-gif` | video |
| Merge / Concatenate Videos | `video-merge` | video |
| Extract Frame / Thumbnail | `video-thumbnail` | video |
| Rotate / Flip Video | `video-rotate` | video |
| Video → Audio Waveform | `video-waveform` | video |
| Add Subtitles | `video-subtitles` | video |
| Watermark Video | `video-watermark` | video |
| Compress GIF | `gif-compress` | video |
| MP4 → MP3 | `mp4-to-mp3` | audio |
| Convert Audio | `audio-convert` | audio |
| Trim Audio | `audio-trim` | audio |
| Merge Audio Tracks | `audio-merge` | audio |
| Normalize Volume | `audio-normalize` | audio |
| Change Speed / Pitch | `audio-speed` | audio |
| Remove Silence | `audio-silence-remove` | audio |
| Compress Image | `image-compress` | image |
| Meme Generator | `meme-generate` | image |
| Color Palette Extractor | `image-color-palette` | image |
| Add Text Watermark | `image-watermark` | image |
| Add Border / Frame | `image-add-border` | image |
| Image → Text (OCR) | `ocr` | text |
| Markdown → PDF | `markdown-to-pdf` | text |
| CSV → JSON | `csv-to-json` | text |
| JSON → CSV | `json-to-csv` | text |
| QR Code Generator | `qr-generate` | text |
| QR Code Reader | `qr-read` | text |
| Diff Two Text Files | `text-diff` | text |
| Slugify / Case Converter | `text-case-convert` | text |
| JSON Formatter / Validator | `json-format` | text |
| Base64 Encode / Decode | `base64-convert` | text |
| URL Encode / Decode | `url-convert` | text |
| Hash Generator | `hash-generate` | text |
| Word / Character Counter | `word-counter` | text |
| Regex Tester | `regex-tester` | text |
| UUID Generator | `uuid-generate` | utility |
| Lorem Ipsum Generator | `lorem-ipsum-generate` | utility |
| Password Generator | `password-generate` | utility |
| Unit Converter | `unit-convert` | utility |
| BMI Calculator | `bmi-calculate` | utility |
| Barcode Generator | `barcode-generate` | utility |
| Duplicate File Finder | `duplicate-finder` | utility |
| Extract PDF Form Fields | `pdf-form-extract` | pdf |
| Fill PDF Form | `pdf-form-fill` | pdf |

78 tools total. `⚡` marks the 11 that run **entirely client-side, offline** (see below).

## Batch mode

Any single-file tool (not multi-file, not URL/text-only) can process a whole
folder at once: check "Batch mode" in the run panel, upload a `.zip` of files
instead of one file, and get a `.zip` of results back — same options applied
to every file, up to 200 files per run. This works for free for every
existing and future single-file tool; there's no per-tool batch code to write.

## Instant client-side tools

Eleven pure-logic tools — JSON Formatter, Base64/URL Encode-Decode, Hash
Generator, UUID Generator, Lorem Ipsum Generator, Word Counter, Regex Tester,
Password Generator, Unit Converter, BMI Calculator — run **entirely in your
browser** (marked with an "⚡ instant" badge in the UI). No upload, no network
round trip, works with the server offline. See `client/src/lib/clientTools.js`.

## CLI

Every tool is also available from the terminal, no server required:

```bash
cd server
npm link                                   # or: npx . <tool-id> ...
toolbench list                             # see every tool id
toolbench pdf-compress report.pdf -o small.pdf
toolbench image-compress photo.jpg --quality 60
toolbench password-generate --length 24 --count 5
toolbench <tool-id> --help                 # see that tool's options
```

## Docker

`docker compose up --build` starts both services — the server image bundles
ffmpeg, poppler, qpdf, LibreOffice, yt-dlp, spotdl, and rembg, so every tool
works out of the box with no manual dependency hunting. Client on `:8080`,
API on `:4500`. Expect a large first build (~2GB image, LibreOffice is the
biggest chunk) — that's the tradeoff for "it just works."

```bash
docker compose up --build
```

Configure via env vars in `docker-compose.yml`: `FILE_TTL_MINUTES`, `MAX_UPLOAD_MB`, `OLLAMA_HOST`.

## Privacy & safety defaults

- **Auto-purge**: uploaded/generated files older than `FILE_TTL_MINUTES` (default 60)
  are deleted automatically, on top of the normal per-request cleanup.
- **Upload size limit**: `MAX_UPLOAD_MB` (default 500) rejects oversized files with a clean error.
- **Rate limiting**: `RATE_LIMIT_MAX_REQUESTS` per `RATE_LIMIT_WINDOW_MINUTES` per IP (default 120 / 15 min) —
  relevant if you expose this beyond localhost.

## Dependency doctor

```bash
cd server
npm run check-deps
```

Reports exactly which optional system binaries (ffmpeg, yt-dlp, spotdl, rembg,
pdftoppm, qpdf, soffice) are installed and which tools each one unlocks —
instead of finding out mid-conversion.

## Tests

```bash
cd server
npm test
```

Runs smoke tests (Node's built-in test runner) against every module with zero
system dependencies — catches the kind of silent breakage that happens when a
dependency's API shape changes underneath you (this caught two real bugs
during development: an `archiver` v8 API change and a `pdf-parse`/`pdfjs-dist`
version mismatch).

## Frontend routing

The frontend uses `react-router-dom` v6 with two routes:

- `/` — landing page with category grid, hero, assist bar, and architecture section
- `/category/:slug` — category page showing all tools in a specific category (e.g. `/category/video`)

`BackgroundScene` and `<nav>` are rendered once outside `<Routes>` so they persist across navigation without re-initializing the three.js canvas.

## Adding a new tool

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Short version:
write a module in `server/modules/yourTool.js`, register it with one line in
`server/registerAll.js`, and it shows up in the UI, the CLI, batch mode, and
the Ollama-based natural-language router automatically — no other code to touch.

## Where AI (Ollama) fits in

Ollama is a sidecar, not a dependency — every tool works with it turned off.
Two integration points exist already:

- **`suggestOutputName`** — after a tool runs, optionally ask a small local model
  to propose a cleaner filename (toggle in the run panel).
- **`routeIntent`** — the "ai layer" search bar on the landing page sends free text
  like *"shrink this pdf under 2mb"* to Ollama, which maps it to a registered tool id.

Both live in `server/ollama.js` and fail soft: if Ollama isn't running, the rest of
the app keeps working normally.

## Notes / honesty about stubs

- **Remove Background** shells out to the `rembg` CLI — it's a real model doing real
  work, but you need it installed locally (`pip install rembg`). No fake output.
- **YouTube Downloader** shells out to `yt-dlp` and uses `--print after_move:filepath`
  to get the exact resolved output path(s) rather than guessing from a template —
  this works correctly for both single videos and playlists.
- **Compress PDF** uses `pdf-lib`'s object-stream re-save, which helps most on PDFs
  from naive writers. For real image-heavy PDFs, swap in a Ghostscript call
  (`gs -dPDFSETTINGS=/ebook ...`) — same module shape, noted inline in the file.
- **OCR** uses `tesseract.js` (WASM, bundled) so there's no system Tesseract
  install needed, but it's slower than native Tesseract on large images/batches.
- **Markdown → PDF** uses `md-to-pdf`, which runs on Puppeteer under the hood —
  expect a one-time headless Chromium download on first run.
