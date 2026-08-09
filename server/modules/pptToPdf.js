import path from "path";
import { OUTPUT_DIR } from "../config.js";
import { officeConvert } from "./_officeConvert.js";

export default {
  id: "ppt-to-pdf",
  name: "PowerPoint → PDF",
  category: "pdf",
  icon: "Presentation",
  description: "Convert a PowerPoint deck (.pptx/.ppt) to PDF. Requires LibreOffice installed.",
  accepts: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");
    const outputPath = await officeConvert({ filePath, originalName, toExt: "pdf", outputDir: OUTPUT_DIR });
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/pdf",
      meta: { engine: "LibreOffice" },
    };
  },
};
