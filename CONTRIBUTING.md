# Contributing to Toolbench

Toolbench's whole design is built around making new tools cheap to add. If
you can write a `run()` function, you can add a tool — no routing code, no
frontend changes, no registry boilerplate beyond one import + one line.

## Adding a new tool

1. **Create a module** in `server/modules/yourTool.js`:

   ```js
   import fs from "fs/promises";
   import path from "path";
   import { nanoid } from "nanoid";
   import { OUTPUT_DIR } from "../config.js";

   export default {
     id: "your-tool",              // used in the API route: POST /api/tools/your-tool
     name: "Your Tool",            // shown in the UI
     category: "text",             // pdf | image | video | audio | text | utility | downloader
                                    // (or a new category slug — the frontend picks it up automatically)
     icon: "Wand2",                // any icon name from lucide-react
     description: "One sentence describing what it does and any caveats.",
     accepts: ["text/plain"],      // MIME types, or ["url"], or ["text"] for a no-file tool

     optionsSchema: [              // drives the auto-generated options form — optional
       { key: "mode", label: "Mode", type: "select", default: "a", options: ["a", "b"] },
     ],

     async run({ filePath, originalName, options }) {
       // do the work
       const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-output.txt`);
       await fs.writeFile(outputPath, "result");
       return { outputPath, outputName: "output.txt", mimeType: "text/plain", meta: {} };
     },
   };
   ```

2. **Register it** in `server/registerAll.js` — one import, one `registerModule(...)` call.
   That's it. The route, the upload handling, the frontend tool grid, the CLI,
   and the batch-mode wrapper all pick it up automatically.

3. **Verify it**: `node bin/cli.js your-tool <input-file>` runs it standalone,
   no server needed. Add a case to `test/smoke.test.js` if it has zero system
   dependencies (pure Node / pdf-lib / sharp) — see existing tests for the pattern.

## The `run()` contract

- **Single file**: `run({ filePath, originalName, options })`
- **Multiple files** (set `multiFile: true`): `run({ filePaths, originalNames, options })`
- **Named files** (set `namedFiles: ["a", "b"]`, e.g. two PDFs to compare): `run({ files: { a: {path, originalname}, b: {...} }, options })`
- **No file input** (`accepts: ["url"]` or `["text"]`, e.g. a generator): `run({ options })`

Always return `{ outputPath, outputName, mimeType, meta }`. `meta` is freeform
— shown to the user in the result panel (e.g. `savedPercent`, `pages`, `matches`).

## What makes a good tool for this project

- **Prefer zero new system dependencies.** pdf-lib, sharp, and pure JS cover
  a lot of ground — those tools work for every user with just `npm install`.
- **If it needs a system binary** (ffmpeg, LibreOffice, poppler, qpdf), follow
  the existing pattern: wrap the `execa()` call in a try/catch that explains
  exactly what to install and how (see `docxToPdf.js` or `pdfToImages.js`).
- **Fail loud with a specific message.** `throw new Error("Missing 'x' option")`
  beats a generic 500 — it's what the user sees in the UI.
- **Don't add UI-only field types.** `RunPanel.jsx` currently renders `text`,
  `select`, and `checkbox` option fields. If your tool needs something else,
  either work within those or extend `RunPanel.jsx` in the same PR.

## Good first tools to add

If you want a starting point rather than picking your own:

- PDF: page rotation presets, PDF metadata editor, PDF/A conversion
- Image: HEIC support (if your `sharp` build has libheif), sprite-sheet
  splitter, image dominant-color-based auto-crop
- Text/utility: cron expression explainer, JWT decoder, timestamp converter
- Audio/video: loop/crossfade audio, video-to-sprite-sheet

## Client-side "instant" tools

Pure-logic tools (no file upload, deterministic, fast) can also run entirely
in the browser — see `client/src/lib/clientTools.js`. If you add a
server-side tool that's a good fit (pure computation on text input), consider
porting the logic there too and adding the id to `INSTANT_TOOL_IDS` — it
means the tool works offline and never touches the server. Keep the two
implementations in sync; there's no shared source of truth between them by
design (the server module has zero browser-API dependencies, and the client
version has zero Node-API dependencies).

## Running tests

```bash
cd server
npm test              # smoke tests for every zero-system-dep module
npm run check-deps    # reports which optional system binaries are installed
```

## Pull requests

Keep them scoped to one tool or one fix. Include a quick note on how you
tested it (a `node bin/cli.js <tool> <file>` run is usually enough evidence).
