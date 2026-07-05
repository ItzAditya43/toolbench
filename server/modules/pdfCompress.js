import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-compress",
  name: "Compress PDF",
  category: "pdf",
  icon: "▤",
  description: "Shrink a PDF's file size while keeping text and layout intact.",
  accepts: ["application/pdf"],

  /**
   * pdf-lib re-serializes the PDF with object streams, which reliably shaves
   * size off PDFs that were produced by naive writers (most "print to PDF" output).
   * For heavier compression (image downsampling) swap this out for a call to
   * Ghostscript, e.g.:
   *   gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook
   *      -dNOPAUSE -dBATCH -sOutputFile=out.pdf in.pdf
   * via child_process — same module shape, just a different run().
   */
  async run({ filePath, originalName }) {
    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });

    const outBytes = await pdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    const outputName = `compressed-${path.parse(originalName).name}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: {
        originalBytes: bytes.length,
        outputBytes: outBytes.length,
        savedPercent: Math.max(
          0,
          Math.round((1 - outBytes.length / bytes.length) * 100)
        ),
      },
    };
  },
};
