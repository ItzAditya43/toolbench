# Toolbench Expansion Checklist — ✅ COMPLETE

## Infrastructure
- [x] Install npm deps: archiver, pdf-parse, qrcode, jsqr, diff, papaparse, sharp (all in package.json)
- [x] Create `server/modules/_zip.js` helper (archiver wrapper)
- [x] Update `server/index.js` for multi-file/named-files upload support (multiFile, namedFiles, default single-file)

## Tier 1 — Pure-Node, zero new system deps
- [x] `pdf-merge` (multi-file, pdf-lib)
- [x] `pdf-split` (pdf-lib + zip)
- [x] `pdf-extract-text` (pdf-parse)
- [x] `pdf-watermark` (pdf-lib)
- [x] `images-to-pdf` (multi-file, pdf-lib)
- [x] `image-crop` (sharp)
- [x] `image-strip-exif` (sharp)
- [x] `image-to-favicon` (sharp + zip)
- [x] `image-collage` (multi-file, sharp)
- [x] `image-upscale` (sharp Lanczos fallback)
- [x] `csv-to-json` (hand-rolled CSV parser)
- [x] `json-to-csv` (JSON.stringify)
- [x] `qr-generate` (qrcode)
- [x] `qr-read` (jsqr + sharp)
- [x] `text-diff` (diff, two-file input)
- [x] `text-case-convert` (pure JS, text input)

## Tier 2 — ffmpeg-only (already a dependency)
- [x] `video-merge` (multi-file, ffmpeg concat)
- [x] `video-thumbnail` (ffmpeg)
- [x] `video-rotate` (ffmpeg)
- [x] `video-waveform` (ffmpeg showwavespic)
- [x] `video-subtitles` (two-file namedFiles, ffmpeg)
- [x] `audio-trim` (ffmpeg)
- [x] `audio-merge` (multi-file, ffmpeg)
- [x] `audio-normalize` (ffmpeg loudnorm)
- [x] `audio-speed` (ffmpeg atempo/asetrate)

## Tier 3 — yt-dlp only (already a dependency)
- [x] `pinterest-download` (yt-dlp, downloader category)

## Tier 4 — New system dependency, document clearly
- [x] `pdf-to-images` (poppler-utils via pdftoppm)
- [x] `pdf-protect` (pdf-lib for encrypt, qpdf for decrypt)
- [x] `docx-to-pdf` (LibreOffice headless)
- [x] `pdf-to-docx` (LibreOffice headless)

## Integration
- [x] Register all 40 modules in `server/index.js`
- [x] Update `README.md` (full tool table + dependency section)

## Frontend
- [x] `RunPanel.jsx` already supports multi-file and named-files dropzones (no changes needed)

## Verification
- [x] Server starts with all 40 tools: `node index.js` → "registered tools: pdf-compress, bg-remove, ... pinterest-download"
- [x] All 11 existing tools have unchanged ids
- [x] Category listing matches requirements (pdf=10, image=7, video=9, audio=6, text=8, downloader=2)