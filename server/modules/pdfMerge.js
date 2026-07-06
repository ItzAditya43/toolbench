import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-merge",
  name: "Merge PDFs",
  category: "pdf",
  icon: "Layers",
  description: "Combine multiple PDF files into one document, preserving page order.",
  accepts: ["application/pdf"],
  multiFile: true,

  async run({ filePaths, originalNames }) {
    if (!filePaths || filePaths.length < 2) {
      throw new Error("Please upload at least two PDF files to merge.");
    }

    const mergedPdf = await PDFDocument.create();

    for (const fp of filePaths) {
      const bytes = await fs.readFile(fp);
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      const indices = pdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(pdf, indices);
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    const outBytes = await mergedPdf.save({ useObjectStreams: true, addDefaultPage: false });
    const outputName = `merged-${nanoid(8)}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { pages: mergedPdf.getPageCount(), sourceFiles: filePaths.length },
    };
  },
};