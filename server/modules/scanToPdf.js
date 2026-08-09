import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Scan → searchable PDF: OCR each uploaded image, then build a PDF where each
 * page is the original image with a transparent (opacity 0) text layer laid
 * over each recognized word at its original position — the page looks like a
 * scan but the text underneath is selectable/searchable, same trick used by
 * "OCR to PDF" tools everywhere.
 */
export default {
  id: "scan-to-pdf",
  name: "Scan → Searchable PDF",
  category: "pdf",
  icon: "ScanLine",
  description: "Turn scanned images into a searchable PDF with an invisible OCR text layer.",
  accepts: ["image/png", "image/jpeg", "image/webp"],
  multiFile: true,

  optionsSchema: [
    { key: "lang", label: "Language", type: "select", default: "eng", options: ["eng", "hin", "fra", "deu", "spa"] },
  ],

  async run({ filePaths, options }) {
    if (!filePaths || filePaths.length === 0) throw new Error("Please upload at least one image.");
    const lang = options?.lang || "eng";

    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const worker = await createWorker(lang);

    try {
      for (const fp of filePaths) {
        const meta = await sharp(fp).metadata();
        const imgBuf = await sharp(fp).png().toBuffer();
        const img = await pdf.embedPng(imgBuf);
        const page = pdf.addPage([meta.width, meta.height]);
        page.drawImage(img, { x: 0, y: 0, width: meta.width, height: meta.height });

        const { data } = await worker.recognize(fp);
        for (const word of data.words || []) {
          if (!word.text?.trim()) continue;
          const boxHeight = word.bbox.y1 - word.bbox.y0;
          const fontSize = Math.max(6, boxHeight * 0.85);
          // image-space y grows downward, PDF-space y grows upward
          const pdfY = meta.height - word.bbox.y1;
          page.drawText(word.text, {
            x: word.bbox.x0,
            y: pdfY,
            size: fontSize,
            font,
            opacity: 0, // invisible but selectable/searchable
          });
        }
      }
    } finally {
      await worker.terminate();
    }

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const outputName = `scan-${nanoid(8)}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { pages: filePaths.length, lang },
    };
  },
};
