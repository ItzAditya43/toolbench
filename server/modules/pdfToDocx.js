import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { execa } from "./_execa.js";

/**
 * Convert a PDF to Word (.docx) using LibreOffice headless.
 *
 * LibreOffice provides the most faithful PDF → DOCX conversion available for free.
 * However, it requires a full LibreOffice installation on the server.
 *
 * Dependency: LibreOffice (apt install libreoffice / brew install --cask libreoffice)
 */
export default {
  id: "pdf-to-docx",
  name: "PDF → Word",
  category: "pdf",
  icon: "FileOutput",
  description: "Convert a PDF to a Word document (.docx). Requires LibreOffice installed.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const outputDir = OUTPUT_DIR;
    const outFile = `${nanoid(8)}-${path.parse(originalName || "document").name}.docx`;
    const outputPath = path.join(outputDir, outFile);

    try {
      await execa("soffice", [
        "--headless",
        "--convert-to", "docx",
        "--outdir", outputDir,
        filePath,
      ]);
    } catch (err) {
      throw new Error(
        "PDF → DOCX needs LibreOffice (soffice) installed locally. " +
          "This is the heaviest dependency in the toolset — a full office suite. " +
          "Install it with: apt install libreoffice (Linux) or brew install --cask libreoffice (macOS). " +
          "Original error: " + err.message
      );
    }

    // LibreOffice writes the output with the same base name in the output dir
    const baseName = path.parse(path.basename(filePath)).name;
    const loFile = path.join(outputDir, `${baseName}.docx`);

    // Rename to our unique name
    await fs.rename(loFile, outputPath);

    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      meta: { engine: "LibreOffice" },
    };
  },
};