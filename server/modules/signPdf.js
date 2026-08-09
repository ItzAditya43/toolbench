import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Sign PDF — stamp a signature image (drawn/uploaded as PNG with transparency,
 * or any raster format) onto a chosen page at a chosen position/size.
 */
export default {
  id: "sign-pdf",
  name: "Sign PDF",
  category: "pdf",
  icon: "Signature",
  description: "Place a signature image onto a PDF page at a chosen position and size.",
  accepts: ["application/pdf"],
  namedFiles: ["pdf", "signature"],

  optionsSchema: [
    { key: "page", label: "Page number (1-based, or 'last')", type: "text", default: "last" },
    { key: "x", label: "X position (from left, in % of page width)", type: "text", default: "60" },
    { key: "y", label: "Y position (from bottom, in % of page height)", type: "text", default: "10" },
    { key: "width", label: "Width (% of page width)", type: "text", default: "25" },
  ],

  async run({ files, options }) {
    if (!files?.pdf || !files?.signature) {
      throw new Error("Both a 'pdf' and a 'signature' image file are required.");
    }

    const bytes = await fs.readFile(files.pdf.path);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const pages = pdf.getPages();

    const pageOpt = (options?.page || "last").trim();
    const pageIndex = pageOpt === "last" ? pages.length - 1 : Math.max(0, Math.min(pages.length - 1, parseInt(pageOpt, 10) - 1));
    const page = pages[pageIndex];
    const { width: pw, height: ph } = page.getSize();

    const pngBuf = await sharp(files.signature.path).png().toBuffer();
    const sigImage = await pdf.embedPng(pngBuf);

    const widthPct = parseFloat(options?.width || "25") / 100;
    const drawWidth = pw * widthPct;
    const drawHeight = drawWidth * (sigImage.height / sigImage.width);

    const xPct = parseFloat(options?.x || "60") / 100;
    const yPct = parseFloat(options?.y || "10") / 100;
    const x = pw * xPct;
    const y = ph * yPct;

    page.drawImage(sigImage, { x, y, width: drawWidth, height: drawHeight });

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(files.pdf.originalname || "document").name;
    const outputName = `${baseName}-signed.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { page: pageIndex + 1 },
    };
  },
};
