import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.join(__dirname, "uploads");
export const OUTPUT_DIR = path.join(__dirname, "outputs");

for (const dir of [UPLOAD_DIR, OUTPUT_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";
export const PORT = process.env.PORT || 4500;

// Privacy: uploaded/generated files older than this are purged automatically.
export const FILE_TTL_MINUTES = parseInt(process.env.FILE_TTL_MINUTES || "60", 10);

// Safety: reject uploads larger than this (per file).
export const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || "500", 10);

// Basic abuse protection when self-hosting publicly (requests per window per IP).
export const RATE_LIMIT_WINDOW_MINUTES = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15", 10);
export const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "120", 10);
