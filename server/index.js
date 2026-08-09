import express from "express";
import cors from "cors";
import multer from "multer";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";
import {
  UPLOAD_DIR,
  OUTPUT_DIR,
  PORT,
  MAX_UPLOAD_MB,
  RATE_LIMIT_WINDOW_MINUTES,
  RATE_LIMIT_MAX_REQUESTS,
} from "./config.js";
import { getModule, listModules } from "./modules/registry.js";
import { suggestOutputName, routeIntent } from "./ollama.js";
import { startPurgeSchedule } from "./purge.js";
import { runBatch } from "./batch.js";

// All modules are imported + registered in one shared file so the CLI can reuse it too.
import "./registerAll.js";

const app = express();
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests — please slow down and try again shortly." },
});
app.use("/api/", apiLimiter);

const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 } });

// GET /api/tools -> module metadata, drives the frontend's socket grid
app.get("/api/tools", (req, res) => {
  res.json({ tools: listModules() });
});

// POST /api/tools/:id -> run a tool. File tools use multipart, URL tools use JSON body.
// Batch mode (single-file tools only): upload a .zip, get every file inside it
// run through the same tool and zipped back up — no extra work per module.
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
    const isBatch = (req.body?.batchMode === "true" || req.body?.batchMode === true) &&
      !mod.multiFile && !mod.namedFiles && req.file;

    let result;
    if (isBatch) {
      result = await runBatch(mod, req.file.path, req.file.originalname, options);
    } else {
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

      result = await mod.run(runArgs);
    }

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

// Multer errors (e.g. file too large) land here instead of crashing with a stack trace.
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ ok: false, error: `File too large — max ${MAX_UPLOAD_MB}MB per file.` });
  }
  if (err) {
    return res.status(500).json({ ok: false, error: err.message || "Unexpected server error" });
  }
  next();
});

app.listen(PORT, () => {
  console.log(`toolbench server running at http://localhost:${PORT}`);
  console.log(`registered tools: ${listModules().map((m) => m.id).join(", ")}`);
  startPurgeSchedule();
});
