#!/usr/bin/env node
import { spawn } from "child_process";

const CHECKS = [
  { bin: "ffmpeg", args: ["-version"], used: "video/audio tools (trim, merge, convert, watermark, gif-compress, ...)" },
  { bin: "yt-dlp", used: "YouTube & Pinterest downloader", install: "pip install yt-dlp" },
  { bin: "spotdl", used: "Spotify downloader", install: "pip install spotdl" },
  { bin: "rembg", used: "Remove Background", install: "pip install rembg", optional: true },
  { bin: "pdftoppm", used: "PDF → Images, Compare PDFs", install: "apt install poppler-utils / brew install poppler", optional: true },
  { bin: "qpdf", used: "PDF unlock, PDF repair fallback", install: "apt install qpdf / brew install qpdf", optional: true },
  { bin: "soffice", used: "Word/Excel/PowerPoint ↔ PDF", install: "apt install libreoffice / brew install --cask libreoffice", optional: true },
];

function checkBin(bin, args) {
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0 || code === 1)); // some CLIs exit 1 on --version
  });
}

console.log("toolbench dependency check\n");

const results = await Promise.all(
  CHECKS.map(async (c) => ({ ...c, found: await checkBin(c.bin, c.args || ["--version"]) }))
);

let missingRequired = 0;
let missingOptional = 0;

for (const r of results) {
  const status = r.found ? "✔ found  " : r.optional ? "○ missing" : "✘ MISSING";
  console.log(`${status}  ${r.bin.padEnd(10)} — needed for: ${r.used}`);
  if (!r.found && r.install) console.log(`             install: ${r.install}`);
  if (!r.found) r.optional ? missingOptional++ : missingRequired++;
}

console.log();
if (missingRequired === 0 && missingOptional === 0) {
  console.log("All system dependencies found — every tool should work.");
} else {
  console.log(
    `${missingRequired} required and ${missingOptional} optional dependencies missing. ` +
      "Tools needing them will fail with a clear error until installed — everything else works fine."
  );
}

process.exit(missingRequired > 0 ? 1 : 0);
