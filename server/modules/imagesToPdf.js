import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "images-to-pdf",
  name: "Images → PDF",
  category: "pdf",
  icon: "Images",
  description: "Combine multiple images into a single PDF, one image per page.",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],
  multiFile: true,

  async run({ filePaths }) {
    if (!filePaths || filePaths.length === 0) {
      throw new Error("Please upload at least one image.");
    }

    const pdf = await PDFDocument.create();

    for (const fp of filePaths) {
      const imgBuf = await sharp(fp).png().toBuffer();
      const img = await pdf.embedPng(imgBuf);
      const page = pdf.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const outputName = `images-${nanoid(8)}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { pages: filePaths.length },
    };
  },
};