import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { execa } from "./_execa.js";

/**
 * Convert a Word (.docx) file to PDF using LibreOffice headless.
 *
 * LibreOffice provides the most faithful DOCX → PDF conversion available for free,
 * handling complex layouts, fonts, tables, and images. However, it requires a
 * full LibreOffice installation on the server (soffice binary on PATH).
 *
 * Dependency: LibreOffice (apt install libreoffice / brew install --cask libreoffice)
 */
export default {
  id: "docx-to-pdf",
  name: "Word → PDF",
  category: "pdf",
  icon: "FileInput",
  description: "Convert a Word document (.docx) to PDF. Requires LibreOffice installed.",
  accepts: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const outputDir = OUTPUT_DIR;
    const outFile = `${nanoid(8)}-${path.parse(originalName || "document").name}.pdf`;
    const outputPath = path.join(outputDir, outFile);

    try {
      await execa("soffice", [
        "--headless",
        "--convert-to", "pdf",
        "--outdir", outputDir,
        filePath,
      ]);
    } catch (err) {
      throw new Error(
        "DOCX → PDF needs LibreOffice (soffice) installed locally. " +
          "This is the heaviest dependency in the toolset — a full office suite. " +
          "Install it with: apt install libreoffice (Linux) or brew install --cask libreoffice (macOS). " +
          "Original error: " + err.message
      );
    }

    // LibreOffice writes the output with the same base name in the output dir
    const baseName = path.parse(path.basename(filePath)).name;
    const loFile = path.join(outputDir, `${baseName}.pdf`);

    // Rename to our unique name
    await fs.rename(loFile, outputPath);

    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/pdf",
      meta: { engine: "LibreOffice" },
    };
  },
};