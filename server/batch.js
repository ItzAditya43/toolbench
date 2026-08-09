import fs from "fs/promises";
import path from "path";
import AdmZip from "adm-zip";
import { nanoid } from "nanoid";
import { UPLOAD_DIR, OUTPUT_DIR } from "./config.js";
import { zipFiles } from "./modules/_zip.js";

/**
 * Batch mode: given a .zip of files, run a single-file tool's run() against
 * every entry inside it (sequentially, to avoid overwhelming ffmpeg/LibreOffice
 * child processes) and zip the results back up. Any single-file tool — one
 * that isn't multiFile/namedFiles/url/text-only — supports this for free,
 * since it's just calling the same run() the normal path already calls.
 */
export async function runBatch(mod, zipPath, originalZipName, options) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().filter((e) => !e.isDirectory);
  if (entries.length === 0) throw new Error("The uploaded zip has no files in it.");
  if (entries.length > 200) throw new Error("Batch mode is capped at 200 files per run.");

  const tmpDir = path.join(UPLOAD_DIR, `batch-${nanoid(8)}`);
  await fs.mkdir(tmpDir, { recursive: true });

  const outputPaths = [];
  const errors = [];

  try {
    for (const entry of entries) {
      const entryName = path.basename(entry.entryName);
      const extractedPath = path.join(tmpDir, `${nanoid(6)}-${entryName}`);
      await fs.writeFile(extractedPath, entry.getData());

      try {
        const result = await mod.run({ filePath: extractedPath, originalName: entryName, options });
        outputPaths.push(result.outputPath);
      } catch (err) {
        errors.push(`${entryName}: ${err.message}`);
      } finally {
        fs.unlink(extractedPath).catch(() => {});
      }
    }

    if (outputPaths.length === 0) {
      throw new Error(`All files in the batch failed:\n${errors.join("\n")}`);
    }

    const baseName = path.parse(originalZipName || "batch").name;
    const zipName = `${baseName}-batch-${nanoid(4)}.zip`;
    const outputPath = path.join(OUTPUT_DIR, zipName);
    await zipFiles(outputPaths, outputPath);

    // Clean up individual outputs now that they're zipped
    for (const p of outputPaths) fs.unlink(p).catch(() => {});

    return {
      outputPath,
      outputName: zipName,
      mimeType: "application/zip",
      meta: { batchSize: entries.length, succeeded: outputPaths.length, failed: errors.length, errors },
    };
  } finally {
    fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
