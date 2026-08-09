import path from "path";
import { OUTPUT_DIR } from "../config.js";
import { officeConvert } from "./_officeConvert.js";

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
    // LibreOffice's PDF import defaults to Draw — force the Writer-compatible
    // import path so the docx export filter is actually available.
    const outputPath = await officeConvert({ filePath, originalName, toExt: "docx", outputDir: OUTPUT_DIR, infilter: "writer_pdf_import" });
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      meta: { engine: "LibreOffice" },
    };
  },
};
