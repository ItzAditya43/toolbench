import path from "path";
import { OUTPUT_DIR } from "../config.js";
import { officeConvert } from "./_officeConvert.js";

export default {
  id: "pdf-to-ppt",
  name: "PDF → PowerPoint",
  category: "pdf",
  icon: "Presentation",
  description: "Convert a PDF to a PowerPoint deck (.pptx), one slide per page. Requires LibreOffice installed.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");
    const outputPath = await officeConvert({ filePath, originalName, toExt: "pptx", outputDir: OUTPUT_DIR });
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      meta: { engine: "LibreOffice" },
    };
  },
};
