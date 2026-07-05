import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-extract-text",
  name: "Extract PDF Text",
  category: "pdf",
  icon: "📄",
  description: "Extract selectable text from a PDF (not OCR — works only on PDFs with embedded text layers).",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    // pdf-parse v2 is a named export — PDFParse is a class
    const { PDFParse } = await import("pdf-parse");
    const dataBuffer = await fs.readFile(filePath);
    const pdf = await PDFParse.create(dataBuffer);
    const data = await pdf.getData();

    const textContent = data.text || "";
    const baseName = path.parse(originalName || "extracted").name;
    const outputName = `${baseName}-extracted-text.txt`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, textContent, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: {
        pages: data.numpages,
        charCount: textContent.length,
      },
    };
  },
};