import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

import { UPLOAD_DIR, OUTPUT_DIR, PORT } from "./config.js";
import { registerModule, getModule, listModules } from "./modules/registry.js";
import { suggestOutputName, routeIntent } from "./ollama.js";

// --- register every tool module here. Adding a new tool = one import + one line. ---
import pdfCompress from "./modules/pdfCompress.js";
import bgRemove from "./modules/bgRemove.js";
import youtubeDownload from "./modules/youtubeDownload.js";
import mp4ToMp3 from "./modules/mp4ToMp3.js";
import imageConvert from "./modules/imageConvert.js";
import videoTrim from "./modules/videoTrim.js";
import videoCompress from "./modules/videoCompress.js";
import videoToGif from "./modules/videoToGif.js";
import audioConvert from "./modules/audioConvert.js";
import ocr from "./modules/ocr.js";
import markdownToPdf from "./modules/markdownToPdf.js";

// --- new tools added in the expansion ---
import pdfMerge from "./modules/pdfMerge.js";
import pdfSplit from "./modules/pdfSplit.js";
import pdfExtractText from "./modules/pdfExtractText.js";
import pdfWatermark from "./modules/pdfWatermark.js";
import imagesToPdf from "./modules/imagesToPdf.js";
import pdfToImages from "./modules/pdfToImages.js";
import pdfProtect from "./modules/pdfProtect.js";
import docxToPdf from "./modules/docxToPdf.js";
import pdfToDocx from "./modules/pdfToDocx.js";

import imageCrop from "./modules/imageCrop.js";
import imageStripExif from "./modules/imageStripExif.js";
import imageToFavicon from "./modules/imageToFavicon.js";
import imageCollage from "./modules/imageCollage.js";
import imageUpscale from "./modules/imageUpscale.js";

import videoMerge from "./modules/videoMerge.js";
import videoThumbnail from "./modules/videoThumbnail.js";
import videoRotate from "./modules/videoRotate.js";
import videoWaveform from "./modules/videoWaveform.js";
import videoSubtitles from "./modules/videoSubtitles.js";

import audioTrim from "./modules/audioTrim.js";
import audioMerge from "./modules/audioMerge.js";
import audioNormalize from "./modules/audioNormalize.js";
import audioSpeed from "./modules/audioSpeed.js";

import csvToJson from "./modules/csvToJson.js";
import jsonToCsv from "./modules/jsonToCsv.js";
import qrGenerate from "./modules/qrGenerate.js";
import qrRead from "./modules/qrRead.js";
import textDiff from "./modules/textDiff.js";
import textCaseConvert from "./modules/textCaseConvert.js";

import pinterestDownload from "./modules/pinterestDownload.js";
import spotifyDownload from "./modules/spotifyDownload.js";

// --- iLovePDF-beating PDF tools ---
import pdfOrganize from "./modules/pdfOrganize.js";
import pdfPageNumbers from "./modules/pdfPageNumbers.js";
import pdfRepair from "./modules/pdfRepair.js";
import pdfRedact from "./modules/pdfRedact.js";
import signPdf from "./modules/signPdf.js";
import scanToPdf from "./modules/scanToPdf.js";
import excelToPdf from "./modules/excelToPdf.js";
import pptToPdf from "./modules/pptToPdf.js";
import pdfToExcel from "./modules/pdfToExcel.js";
import pdfToPpt from "./modules/pdfToPpt.js";
import pdfCompare from "./modules/pdfCompare.js";
import htmlToPdf from "./modules/htmlToPdf.js";

// --- everyday utility tools ---
import jsonFormat from "./modules/jsonFormat.js";
import base64Convert from "./modules/base64Convert.js";
import urlConvert from "./modules/urlConvert.js";
import hashGenerate from "./modules/hashGenerate.js";
import uuidGenerate from "./modules/uuidGenerate.js";
import loremIpsumGenerate from "./modules/loremIpsumGenerate.js";
import wordCounter from "./modules/wordCounter.js";
import regexTester from "./modules/regexTester.js";
import passwordGenerate from "./modules/passwordGenerate.js";
import unitConvert from "./modules/unitConvert.js";
import bmiCalculate from "./modules/bmiCalculate.js";
import barcodeGenerate from "./modules/barcodeGenerate.js";
import imageCompress from "./modules/imageCompress.js";
import memeGenerate from "./modules/memeGenerate.js";
import imageColorPalette from "./modules/imageColorPalette.js";
import imageWatermark from "./modules/imageWatermark.js";
import imageAddBorder from "./modules/imageAddBorder.js";
import audioSilenceRemove from "./modules/audioSilenceRemove.js";
import videoWatermark from "./modules/videoWatermark.js";
import gifCompress from "./modules/gifCompress.js";

registerModule(pdfCompress);
registerModule(bgRemove);
registerModule(youtubeDownload);
registerModule(mp4ToMp3);
registerModule(imageConvert);
registerModule(videoTrim);
registerModule(videoCompress);
registerModule(videoToGif);
registerModule(audioConvert);
registerModule(ocr);
registerModule(markdownToPdf);

registerModule(pdfMerge);
registerModule(pdfSplit);
registerModule(pdfExtractText);
registerModule(pdfWatermark);
registerModule(imagesToPdf);
registerModule(pdfToImages);
registerModule(pdfProtect);
registerModule(docxToPdf);
registerModule(pdfToDocx);

registerModule(imageCrop);
registerModule(imageStripExif);
registerModule(imageToFavicon);
registerModule(imageCollage);
registerModule(imageUpscale);

registerModule(videoMerge);
registerModule(videoThumbnail);
registerModule(videoRotate);
registerModule(videoWaveform);
registerModule(videoSubtitles);

registerModule(audioTrim);
registerModule(audioMerge);
registerModule(audioNormalize);
registerModule(audioSpeed);

registerModule(csvToJson);
registerModule(jsonToCsv);
registerModule(qrGenerate);
registerModule(qrRead);
registerModule(textDiff);
registerModule(textCaseConvert);

registerModule(pinterestDownload);
registerModule(spotifyDownload);

registerModule(pdfOrganize);
registerModule(pdfPageNumbers);
registerModule(pdfRepair);
registerModule(pdfRedact);
registerModule(signPdf);
registerModule(scanToPdf);
registerModule(excelToPdf);
registerModule(pptToPdf);
registerModule(pdfToExcel);
registerModule(pdfToPpt);
registerModule(pdfCompare);
registerModule(htmlToPdf);

registerModule(jsonFormat);
registerModule(base64Convert);
registerModule(urlConvert);
registerModule(hashGenerate);
registerModule(uuidGenerate);
registerModule(loremIpsumGenerate);
registerModule(wordCounter);
registerModule(regexTester);
registerModule(passwordGenerate);
registerModule(unitConvert);
registerModule(bmiCalculate);
registerModule(barcodeGenerate);
registerModule(imageCompress);
registerModule(memeGenerate);
registerModule(imageColorPalette);
registerModule(imageWatermark);
registerModule(imageAddBorder);
registerModule(audioSilenceRemove);
registerModule(videoWatermark);
registerModule(gifCompress);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: UPLOAD_DIR });

// GET /api/tools -> module metadata, drives the frontend's socket grid
app.get("/api/tools", (req, res) => {
  res.json({ tools: listModules() });
});

// POST /api/tools/:id -> run a tool. File tools use multipart, URL tools use JSON body.
app.post("/api/tools/:id", (req, res, next) => {
  const mod = getModule(req.params.id);
  if (!mod) return res.status(404).json({ error: `Unknown tool "${req.params.id}"` });
  // Choose upload middleware based on module metadata
  if (mod.multiFile) {
    upload.array("files")(req, res, next);
  } else if (mod.namedFiles) {
    const fields = mod.namedFiles.map((name) => ({ name }));
    upload.fields(fields)(req, res, next);
  } else {
    upload.single("file")(req, res, next);
  }
}, async (req, res) => {
  const mod = getModule(req.params.id);
  if (!mod) return; // already handled above but keep TS happy

  try {
    let options = {};
    if (req.body?.options) {
      options = typeof req.body.options === "string" ? JSON.parse(req.body.options) : req.body.options;
    }

    const runArgs = { options };

    if (mod.multiFile) {
      runArgs.filePaths = (req.files || []).map((f) => f.path);
      runArgs.originalNames = (req.files || []).map((f) => f.originalname);
    } else if (mod.namedFiles) {
      // namedFiles: { [fieldName]: { path, originalname, ... } }
      const files = {};
      for (const name of mod.namedFiles) {
        const f = req.files?.[name]?.[0];
        if (f) {
          files[name] = { path: f.path, originalname: f.originalname };
        }
      }
      runArgs.files = files;
    } else {
      runArgs.filePath = req.file?.path;
      runArgs.originalName = req.file?.originalname;
    }

    const result = await mod.run(runArgs);

    // optional AI assist: suggest a nicer output name if Ollama is up and the client asked for it
    let suggestedName = null;
    const origName = runArgs.originalName || (runArgs.files && Object.values(runArgs.files)[0]?.originalname) || result.outputName;
    if (req.body?.aiRename === "true" || req.body?.aiRename === true) {
      try {
        suggestedName = await suggestOutputName({ toolId: mod.id, originalName: origName });
      } catch {
        suggestedName = null; // fail soft — Ollama not running shouldn't break the tool
      }
    }

    res.json({
      ok: true,
      downloadUrl: `/api/download/${path.basename(result.outputPath)}`,
      outputName: suggestedName || result.outputName,
      meta: result.meta,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  } finally {
    // Clean up all uploaded files
    const allFiles = [];
    if (req.file?.path) allFiles.push(req.file.path);
    if (req.files) {
      if (Array.isArray(req.files)) {
        for (const f of req.files) allFiles.push(f.path);
      } else {
        for (const arr of Object.values(req.files)) {
          for (const f of arr) allFiles.push(f.path);
        }
      }
    }
    for (const p of allFiles) {
      fs.unlink(p, () => {});
    }
  }
});

// GET /api/download/:file -> serves a processed output
app.get("/api/download/:file", (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.file);
  res.download(filePath);
});

// POST /api/assist -> natural-language router: "shrink this pdf" -> { toolId, options }
app.post("/api/assist", async (req, res) => {
  try {
    const { instruction } = req.body;
    const routed = await routeIntent(instruction, listModules());
    res.json(routed);
  } catch (err) {
    // Distinguish network-level failures from parse/logic failures
    if (err.cause?.code === "ECONNREFUSED" || err.message?.includes("ECONNREFUSED")) {
      res.status(503).json({
        error: "Ollama isn't reachable — is it running on localhost:11434?",
        detail: err.message,
      });
    } else if (err.message?.includes("toolId")) {
      res.status(422).json({
        error: "Ollama responded, but couldn't map that to a tool — try rephrasing.",
        detail: err.message,
      });
    } else {
      res.status(503).json({
        error: "Ollama request failed: " + err.message,
        detail: err.message,
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`toolbench server running at http://localhost:${PORT}`);
  console.log(`registered tools: ${listModules().map((m) => m.id).join(", ")}`);
});
