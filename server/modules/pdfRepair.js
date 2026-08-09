import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { execa } from "./_execa.js";

/**
 * Repair a damaged/corrupted PDF.
 *
 * Strategy: try a lenient pdf-lib load-and-resave first (this alone fixes most
 * xref/structure issues, and works with zero extra dependencies). If that fails,
 * fall back to qpdf's own repair pass (--qdf normalizes the file structure).
 */
export default {
  id: "pdf-repair",
  name: "Repair PDF",
  category: "pdf",
  icon: "Wrench",
  description: "Attempt to fix a corrupted or malformed PDF so it opens normally again.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");
    const baseName = path.parse(originalName || "document").name;
    const outputName = `${baseName}-repaired.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    let engine = "pdf-lib";
    try {
      const bytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
        updateMetadata: false,
      });
      const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      await fs.writeFile(outputPath, outBytes);
    } catch (pdfLibErr) {
      engine = "qpdf";
      try {
        await execa("qpdf", ["--qdf", "--replace-input", filePath]);
        await fs.copyFile(filePath, outputPath);
      } catch (qpdfErr) {
        throw new Error(
          `Could not repair this PDF. pdf-lib error: ${pdfLibErr.message}. ` +
            `qpdf fallback also failed (needs 'qpdf' installed — apt install qpdf / brew install qpdf): ${qpdfErr.message}`
        );
      }
    }

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { engine },
    };
  },
};
