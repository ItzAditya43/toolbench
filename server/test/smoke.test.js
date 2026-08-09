// Smoke tests for every module with zero system dependencies (pure Node,
// pdf-lib, sharp, or Web-standard APIs). These exist because a dependency
// bump can silently change an npm package's API shape without touching our
// code — that's exactly how the archiver@8 zip bug shipped undetected.
// Not exhaustive coverage: just "does run() produce a real output file
// without throwing" for every module that doesn't need ffmpeg/LibreOffice/
// qpdf/poppler/yt-dlp/rembg to run, so `npm test` catches regressions here
// without needing those binaries installed.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

import pdfCompress from "../modules/pdfCompress.js";
import pdfMerge from "../modules/pdfMerge.js";
import pdfSplit from "../modules/pdfSplit.js";
import pdfExtractText from "../modules/pdfExtractText.js";
import pdfWatermark from "../modules/pdfWatermark.js";
import imagesToPdf from "../modules/imagesToPdf.js";
import pdfOrganize from "../modules/pdfOrganize.js";
import pdfPageNumbers from "../modules/pdfPageNumbers.js";
import pdfRepair from "../modules/pdfRepair.js";
import pdfRedact from "../modules/pdfRedact.js";
import signPdf from "../modules/signPdf.js";

import imageConvert from "../modules/imageConvert.js";
import imageCrop from "../modules/imageCrop.js";
import imageStripExif from "../modules/imageStripExif.js";
import imageToFavicon from "../modules/imageToFavicon.js";
import imageCollage from "../modules/imageCollage.js";
import imageCompress from "../modules/imageCompress.js";
import memeGenerate from "../modules/memeGenerate.js";
import imageColorPalette from "../modules/imageColorPalette.js";
import imageWatermark from "../modules/imageWatermark.js";
import imageAddBorder from "../modules/imageAddBorder.js";

import csvToJson from "../modules/csvToJson.js";
import jsonToCsv from "../modules/jsonToCsv.js";
import qrGenerate from "../modules/qrGenerate.js";
import qrRead from "../modules/qrRead.js";
import textDiff from "../modules/textDiff.js";
import textCaseConvert from "../modules/textCaseConvert.js";
import jsonFormat from "../modules/jsonFormat.js";
import base64Convert from "../modules/base64Convert.js";
import urlConvert from "../modules/urlConvert.js";
import hashGenerate from "../modules/hashGenerate.js";
import uuidGenerate from "../modules/uuidGenerate.js";
import loremIpsumGenerate from "../modules/loremIpsumGenerate.js";
import wordCounter from "../modules/wordCounter.js";
import regexTester from "../modules/regexTester.js";
import passwordGenerate from "../modules/passwordGenerate.js";
import unitConvert from "../modules/unitConvert.js";
import bmiCalculate from "../modules/bmiCalculate.js";
import barcodeGenerate from "../modules/barcodeGenerate.js";
import duplicateFinder from "../modules/duplicateFinder.js";
import pdfFormExtract from "../modules/pdfFormExtract.js";
import pdfFormFill from "../modules/pdfFormFill.js";

let tmpDir, pdfPath, pngPath, jpgPath, formPdfPath;

test.before(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "toolbench-smoke-"));

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([200, 200]);
  page.drawText("smoke test", { x: 20, y: 100, size: 12 });
  pdfPath = path.join(tmpDir, "fixture.pdf");
  await fs.writeFile(pdfPath, await pdf.save());

  pngPath = path.join(tmpDir, "fixture.png");
  await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 40, g: 120, b: 200 } } }).png().toFile(pngPath);

  jpgPath = path.join(tmpDir, "fixture.jpg");
  await sharp({ create: { width: 64, height: 64, channels: 3, background: { r: 200, g: 40, b: 40 } } }).jpeg().toFile(jpgPath);

  const formPdf = await PDFDocument.create();
  const formPage = formPdf.addPage([200, 200]);
  const form = formPdf.getForm();
  const nameField = form.createTextField("Name");
  nameField.addToPage(formPage, { x: 20, y: 100, width: 100, height: 20 });
  formPdfPath = path.join(tmpDir, "form.pdf");
  await fs.writeFile(formPdfPath, await formPdf.save());
});

test.after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function assertProducesFile(result) {
  assert.ok(result.outputPath, "run() must return an outputPath");
  const stat = await fs.stat(result.outputPath);
  assert.ok(stat.size > 0, "output file must be non-empty");
  await fs.unlink(result.outputPath).catch(() => {});
}

// --- PDF (pdf-lib only) ---
test("pdf-compress", async () => assertProducesFile(await pdfCompress.run({ filePath: pdfPath, originalName: "f.pdf", options: {} })));
test("pdf-merge", async () => assertProducesFile(await pdfMerge.run({ filePaths: [pdfPath, pdfPath], originalNames: ["a.pdf", "b.pdf"], options: {} })));
test("pdf-split", async () => assertProducesFile(await pdfSplit.run({ filePath: pdfPath, originalName: "f.pdf", options: { mode: "page-ranges", ranges: "1-1" } })));
test("pdf-extract-text", async () => assertProducesFile(await pdfExtractText.run({ filePath: pdfPath, originalName: "f.pdf", options: {} })));
test("pdf-watermark", async () => assertProducesFile(await pdfWatermark.run({ filePath: pdfPath, originalName: "f.pdf", options: { text: "DRAFT" } })));
test("images-to-pdf", async () => assertProducesFile(await imagesToPdf.run({ filePaths: [pngPath], originalNames: ["f.png"] })));
test("pdf-organize", async () => assertProducesFile(await pdfOrganize.run({ filePath: pdfPath, originalName: "f.pdf", options: { layout: "1" } })));
test("pdf-page-numbers", async () => assertProducesFile(await pdfPageNumbers.run({ filePath: pdfPath, originalName: "f.pdf", options: {} })));
test("pdf-repair", async () => assertProducesFile(await pdfRepair.run({ filePath: pdfPath, originalName: "f.pdf" })));
test("pdf-redact", async () => assertProducesFile(await pdfRedact.run({ filePath: pdfPath, originalName: "f.pdf", options: { term: "smoke" } })));
test("sign-pdf", async () => assertProducesFile(await signPdf.run({
  files: { pdf: { path: pdfPath, originalname: "f.pdf" }, signature: { path: pngPath, originalname: "sig.png" } },
  options: {},
})));

// --- Image (sharp only) ---
test("image-convert", async () => assertProducesFile(await imageConvert.run({ filePath: pngPath, originalName: "f.png", options: { format: "webp" } })));
test("image-crop", async () => assertProducesFile(await imageCrop.run({ filePath: pngPath, originalName: "f.png", options: { x: "0", y: "0", width: "10", height: "10" } })));
test("image-strip-exif", async () => assertProducesFile(await imageStripExif.run({ filePath: jpgPath, originalName: "f.jpg" })));
test("image-to-favicon", async () => assertProducesFile(await imageToFavicon.run({ filePath: pngPath, originalName: "f.png" })));
test("image-collage", async () => assertProducesFile(await imageCollage.run({ filePaths: [pngPath, jpgPath], originalNames: ["a.png", "b.jpg"] })));
test("image-compress", async () => assertProducesFile(await imageCompress.run({ filePath: jpgPath, originalName: "f.jpg", options: { quality: "60" } })));
test("meme-generate", async () => assertProducesFile(await memeGenerate.run({ filePath: pngPath, originalName: "f.png", options: { topText: "top", bottomText: "bottom" } })));
test("image-color-palette", async () => assertProducesFile(await imageColorPalette.run({ filePath: pngPath, originalName: "f.png", options: { count: "3" } })));
test("image-watermark", async () => assertProducesFile(await imageWatermark.run({ filePath: pngPath, originalName: "f.png", options: { text: "wm" } })));
test("image-add-border", async () => assertProducesFile(await imageAddBorder.run({ filePath: pngPath, originalName: "f.png", options: { width: "5", color: "#000000" } })));

// --- Text / dev / generators (pure JS) ---
test("csv-to-json", async () => {
  const p = path.join(tmpDir, "fixture.csv");
  await fs.writeFile(p, "a,b\n1,2\n");
  return assertProducesFile(await csvToJson.run({ filePath: p, originalName: "f.csv", options: {} }));
});
test("json-to-csv", async () => {
  const p = path.join(tmpDir, "fixture.json");
  await fs.writeFile(p, JSON.stringify([{ a: 1, b: 2 }]));
  return assertProducesFile(await jsonToCsv.run({ filePath: p, originalName: "f.json", options: {} }));
});
test("qr-generate", async () => assertProducesFile(await qrGenerate.run({ options: { text: "https://example.com" } })));
test("qr-read", async () => {
  const qrResult = await qrGenerate.run({ options: { text: "smoke-test-value" } });
  const result = await qrRead.run({ filePath: qrResult.outputPath, originalName: "qr.png" });
  await fs.unlink(qrResult.outputPath).catch(() => {});
  return assertProducesFile(result);
});
test("text-diff", async () => {
  const p1 = path.join(tmpDir, "d1.txt"), p2 = path.join(tmpDir, "d2.txt");
  await fs.writeFile(p1, "hello world");
  await fs.writeFile(p2, "hello there");
  return assertProducesFile(await textDiff.run({ files: { left: { path: p1, originalname: "d1.txt" }, right: { path: p2, originalname: "d2.txt" } } }));
});
test("text-case-convert", async () => assertProducesFile(await textCaseConvert.run({ options: { text: "hello world", case: "UPPERCASE" } })));
test("json-format", async () => assertProducesFile(await jsonFormat.run({ options: { text: '{"a":1}', mode: "pretty" } })));
test("base64-convert", async () => assertProducesFile(await base64Convert.run({ options: { text: "hello", mode: "encode" } })));
test("url-convert", async () => assertProducesFile(await urlConvert.run({ options: { text: "a b", mode: "encode" } })));
test("hash-generate", async () => assertProducesFile(await hashGenerate.run({ options: { text: "hello", algorithm: "sha256" } })));
test("uuid-generate", async () => assertProducesFile(await uuidGenerate.run({ options: { count: "2" } })));
test("lorem-ipsum-generate", async () => assertProducesFile(await loremIpsumGenerate.run({ options: { unit: "words", count: "5" } })));
test("word-counter", async () => assertProducesFile(await wordCounter.run({ options: { text: "hello world" } })));
test("regex-tester", async () => assertProducesFile(await regexTester.run({ options: { text: "a1 b2", pattern: "\\d", flags: "g" } })));
test("password-generate", async () => assertProducesFile(await passwordGenerate.run({ options: { length: "10", count: "1" } })));
test("unit-convert", async () => assertProducesFile(await unitConvert.run({ options: { category: "length", value: "10", from: "km", to: "mi" } })));
test("bmi-calculate", async () => assertProducesFile(await bmiCalculate.run({ options: { units: "metric", weight: "70", height: "175" } })));
test("barcode-generate", async () => assertProducesFile(await barcodeGenerate.run({ options: { text: "123456789012", type: "code128" } })));

test("duplicate-finder", async () => {
  const p1 = path.join(tmpDir, "dup1.txt"), p2 = path.join(tmpDir, "dup2.txt");
  await fs.writeFile(p1, "same content");
  await fs.writeFile(p2, "same content");
  return assertProducesFile(await duplicateFinder.run({ filePaths: [p1, p2], originalNames: ["dup1.txt", "dup2.txt"] }));
});
test("pdf-form-extract", async () => assertProducesFile(await pdfFormExtract.run({ filePath: formPdfPath, originalName: "form.pdf" })));
test("pdf-form-fill", async () => assertProducesFile(await pdfFormFill.run({ filePath: formPdfPath, originalName: "form.pdf", options: { values: '{"Name":"Jane"}' } })));
