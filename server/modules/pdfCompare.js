import fs from "fs/promises";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { nanoid } from "nanoid";
import { OUTPUT_DIR, UPLOAD_DIR } from "../config.js";
import { execa } from "./_execa.js";
import { zipFiles } from "./_zip.js";

/**
 * Compare two PDFs page-by-page: renders both with pdftoppm (poppler-utils)
 * at the same DPI, then pixel-diffs each page pair with pixelmatch, producing
 * one highlighted diff PNG per page (differences drawn in red).
 *
 * Dependency: poppler-utils (apt install poppler-utils / brew install poppler)
 */
async function renderPages(filePath, prefix) {
  try {
    await execa("pdftoppm", [filePath, prefix, "-png", "-r", "100"]);
  } catch (err) {
    throw new Error(
      "PDF Compare needs 'pdftoppm' from poppler-utils installed locally. " +
        "Install it with: apt install poppler-utils (Linux) or brew install poppler (macOS). " +
        "Original error: " + err.message
    );
  }
  const dir = path.dirname(prefix);
  const base = path.basename(prefix);
  const all = await fs.readdir(dir);
  return all.filter((f) => f.startsWith(base)).sort().map((f) => path.join(dir, f));
}

export default {
  id: "pdf-compare",
  name: "Compare PDFs",
  category: "pdf",
  icon: "GitCompare",
  description: "Visually compare two PDFs page-by-page and highlight the differences. Requires poppler-utils.",
  accepts: ["application/pdf"],
  namedFiles: ["pdfA", "pdfB"],

  async run({ files }) {
    if (!files?.pdfA || !files?.pdfB) throw new Error("Both 'pdfA' and 'pdfB' files are required.");

    const tag = nanoid(8);
    const prefixA = path.join(UPLOAD_DIR, `${tag}-a`);
    const prefixB = path.join(UPLOAD_DIR, `${tag}-b`);

    const pagesA = await renderPages(files.pdfA.path, prefixA);
    const pagesB = await renderPages(files.pdfB.path, prefixB);
    const pageCount = Math.max(pagesA.length, pagesB.length);

    const diffFiles = [];
    let totalDiffPixels = 0;

    for (let i = 0; i < pageCount; i++) {
      const bufA = pagesA[i] ? await fs.readFile(pagesA[i]) : null;
      const bufB = pagesB[i] ? await fs.readFile(pagesB[i]) : null;
      const pngA = bufA ? PNG.sync.read(bufA) : null;
      const pngB = bufB ? PNG.sync.read(bufB) : null;

      const width = Math.max(pngA?.width || 0, pngB?.width || 0);
      const height = Math.max(pngA?.height || 0, pngB?.height || 0);
      const normA = pngA && pngA.width === width && pngA.height === height ? pngA : resize(pngA, width, height);
      const normB = pngB && pngB.width === width && pngB.height === height ? pngB : resize(pngB, width, height);

      const diff = new PNG({ width, height });
      const diffPixels = pixelmatch(normA.data, normB.data, diff.data, width, height, { threshold: 0.1 });
      totalDiffPixels += diffPixels;

      const diffPath = path.join(OUTPUT_DIR, `${tag}-diff-page${i + 1}.png`);
      await fs.writeFile(diffPath, PNG.sync.write(diff));
      diffFiles.push(diffPath);
    }

    // Clean up rendered page images
    for (const fp of [...pagesA, ...pagesB]) fs.unlink(fp).catch(() => {});

    let outputPath, outputName;
    if (diffFiles.length === 1) {
      outputPath = diffFiles[0];
      outputName = path.basename(outputPath);
    } else {
      const zipName = `pdf-compare-${tag}.zip`;
      outputPath = path.join(OUTPUT_DIR, zipName);
      await zipFiles(diffFiles, outputPath);
      outputName = zipName;
      for (const fp of diffFiles) fs.unlink(fp).catch(() => {});
    }

    return {
      outputPath,
      outputName,
      mimeType: diffFiles.length === 1 ? "image/png" : "application/zip",
      meta: {
        pagesA: pagesA.length,
        pagesB: pagesB.length,
        totalDiffPixels,
        identical: totalDiffPixels === 0 && pagesA.length === pagesB.length,
      },
    };
  },
};

function resize(png, width, height) {
  const out = new PNG({ width, height });
  if (!png) return out;
  PNG.bitblt(png, out, 0, 0, Math.min(png.width, width), Math.min(png.height, height), 0, 0);
  return out;
}
