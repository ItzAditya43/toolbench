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
      videoDownload.js
      mp4ToMp3.js
      _execa.js         tiny child_process wrapper used by CLI-backed tools
    config.js          paths + env
    ollama.js           local AI helper (rename suggestions, NL routing)
    index.js            routes: /api/tools, /api/tools/:id, /api/assist, /api/download/:file
  client/             React + Vite frontend
    src/
      components/
        BackgroundScene.jsx   three.js ambient background
        Hero.jsx               anime.js entrance animation
        ToolGrid.jsx            fetches /api/tools, renders the socket grid
        RunPanel.jsx             upload/run/download modal for a selected tool
        AssistBar.jsx            natural-language router, calls Ollama
      App.jsx
```

## Running it

You'll need Node 18+.

### Required system dependencies (for most tools)

- `ffmpeg` on PATH — video/audio processing (trim, merge, convert, normalize, etc.)
- `yt-dlp` on PATH — YouTube & Pinterest downloader (`pip install yt-dlp`)
- `spotdl` on PATH — Spotify downloader (`pip install spotdl`)

### Optional system dependencies (only for specific tools)

- `rembg` on PATH — Remove Background (`pip install rembg`)
- `pdftoppm` (poppler-utils) — PDF → Images (`apt install poppler-utils` / `brew install poppler`)
- `qpdf` — PDF unlock (`apt install qpdf` / `brew install qpdf`)
- `soffice` (LibreOffice) — Word ↔ PDF (`apt install libreoffice` / `brew install --cask libreoffice`)

### AI assist (optional)

- [Ollama](https://ollama.com) running locally if you want the AI-assist features —
  `ollama pull llama3.2:1b` (or whatever small model you prefer, set via `OLLAMA_MODEL`)

### Zero-dependency tools (pure Node, work out of the box)

Compress PDF, Merge PDFs, Split PDF, Extract PDF Text, Add Watermark, Images → PDF,
Resize/Convert Image, Crop Image, Strip EXIF, Image → Favicon, Collage, Upscale (sharp),
CSV ↔ JSON, QR Code Generator/Reader, Text Diff, Case Converter, OCR, Markdown → PDF —
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
| MP4 → MP3 | `mp4-to-mp3` | audio |
| Convert Audio | `audio-convert` | audio |
| Trim Audio | `audio-trim` | audio |
| Merge Audio Tracks | `audio-merge` | audio |
| Normalize Volume | `audio-normalize` | audio |
| Change Speed / Pitch | `audio-speed` | audio |
| Image → Text (OCR) | `ocr` | text |
| Markdown → PDF | `markdown-to-pdf` | text |
| CSV → JSON | `csv-to-json` | text |
| JSON → CSV | `json-to-csv` | text |
| QR Code Generator | `qr-generate` | text |
| QR Code Reader | `qr-read` | text |
| Diff Two Text Files | `text-diff` | text |
| Slugify / Case Converter | `text-case-convert` | text |

## Frontend routing

The frontend uses `react-router-dom` v6 with two routes:

- `/` — landing page with category grid, hero, assist bar, and architecture section
- `/category/:slug` — category page showing all tools in a specific category (e.g. `/category/video`)

`BackgroundScene` and `<nav>` are rendered once outside `<Routes>` so they persist across navigation without re-initializing the three.js canvas.

## Adding a new tool

1. Create `server/modules/yourTool.js` exporting an object shaped like the existing
   modules (`id`, `name`, `category`, `icon`, `description`, `accepts`, `async run(...)`).
   If the tool needs extra input beyond a file (quality picker, timestamps, format
   choice), add an `optionsSchema` array — the frontend's `RunPanel` renders fields
   from it automatically (`text`, `select`, `checkbox` types supported). See
   `youtubeDownload.js` or `videoTrim.js` for examples.
2. In `server/index.js`, import it and add one line: `registerModule(yourTool);`
3. That's it — it shows up in the socket grid, gets a working upload/run/download
   flow with the right input fields, and is available to the Ollama-based
   natural-language router.

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
