import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-compress",
  name: "Compress PDF",
  category: "pdf",
  icon: "FileDown",
  description: "Shrink a PDF's file size while keeping text and layout intact.",
  accepts: ["application/pdf"],

  async run({ filePath, options }) {
    const ext = "pdf";
    const id = nanoid(8);
    const outName = `${id}.${ext}`;
    const outPath = path.join(OUTPUT_DIR, outName);

    const bytes = await fs.readFile(filePath);
    const doc = await PDFDocument.load(bytes);
    const saved = await doc.save({ useObjectStreams: true });
    await fs.writeFile(outPath, saved);

    const originalSize = bytes.length;
    const savedSize = saved.length;
    const pct = originalSize > 0 ? Math.round((1 - savedSize / originalSize) * 100) : 0;

    return {
      outputPath: outPath,
      outputName: outName,
      mimeType: "application/pdf",
      meta: { savedPercent: pct },
    };
  },
};