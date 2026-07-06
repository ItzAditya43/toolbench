import path from "path";
import fs from "fs/promises";
import { createWorker } from "tesseract.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "ocr",
  name: "Image → Text (OCR)",
  category: "text",
  icon: "ScanText",
  description: "Extract text from a scanned image or photo of text.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    { key: "lang", label: "Language", type: "select", default: "eng", options: ["eng", "hin", "fra", "deu", "spa"] },
  ],

  // tesseract.js ships its own WASM engine — no system `tesseract` binary required.
  async run({ filePath, originalName, options }) {
    const lang = options?.lang || "eng";
    const worker = await createWorker(lang);
    try {
      const { data } = await worker.recognize(filePath);
      const outputName = `${path.parse(originalName).name}.txt`;
      const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
      await fs.writeFile(outputPath, data.text, "utf-8");

      return {
        outputPath,
        outputName,
        mimeType: "text/plain",
        meta: { confidence: Math.round(data.confidence), lang, charCount: data.text.length },
      };
    } finally {
      await worker.terminate();
    }
  },
};
