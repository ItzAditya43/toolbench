import path from "path";
import fs from "fs/promises";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { execa } from "./_execa.js";
import { zipFiles } from "./_zip.js";

/**
 * Render each page of a PDF to a PNG image using pdftoppm (poppler-utils).
 *
 * Pure-Node PDF rasterization is weak — pdf-lib can't render pages to images.
 * pdftoppm is the standard tool for this and is widely available on Linux/macOS.
 *
 * Dependency: poppler-utils (apt install poppler-utils / brew install poppler)
 */
export default {
  id: "pdf-to-images",
  name: "PDF → Images",
  category: "pdf",
  icon: "Image",
  description: "Render each page of a PDF to a PNG image. Requires poppler-utils (pdftoppm).",
  accepts: ["application/pdf"],

  optionsSchema: [
    {
      key: "format",
      label: "Output format",
      type: "select",
      default: "png",
      options: ["png", "jpeg"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const fmt = options?.format || "png";
    const baseName = path.parse(originalName || "document").name;
    const outPrefix = path.join(OUTPUT_DIR, `${nanoid(8)}-${baseName}-page`);

    try {
      await execa("pdftoppm", [
        filePath,
        outPrefix,
        fmt === "jpeg" ? "-jpeg" : "-png",
        "-r", "150", // 150 DPI — good balance of quality/size
      ]);
    } catch (err) {
      throw new Error(
        "PDF → Images needs 'pdftoppm' from poppler-utils installed locally. " +
          "Install it with: apt install poppler-utils (Linux) or brew install poppler (macOS). " +
          "Original error: " + err.message
      );
    }

    // Collect all generated page files
    const dir = OUTPUT_DIR;
    const allFiles = await fs.readdir(dir);
    const prefix = path.basename(outPrefix);
    const pageFiles = allFiles
      .filter((f) => f.startsWith(prefix))
      .sort()
      .map((f) => path.join(dir, f));

    if (pageFiles.length === 0) {
      throw new Error("pdftoppm produced no output — check the PDF is valid.");
    }

    let outputPath, outputName;
    if (pageFiles.length === 1) {
      outputPath = pageFiles[0];
      outputName = path.basename(outputPath);
    } else {
      const zipName = `${baseName}-pages-${nanoid(4)}.zip`;
      outputPath = path.join(OUTPUT_DIR, zipName);
      await zipFiles(pageFiles, outputPath);
      outputName = zipName;
      // Clean up individual page files
      for (const fp of pageFiles) {
        fs.unlink(fp).catch(() => {});
      }
    }

    return {
      outputPath,
      outputName,
      mimeType: pageFiles.length === 1 ? `image/${fmt}` : "application/zip",
      meta: { pages: pageFiles.length, format: fmt },
    };
  },
};