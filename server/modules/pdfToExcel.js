import path from "path";
import { OUTPUT_DIR } from "../config.js";
import { officeConvert } from "./_officeConvert.js";

export default {
  id: "pdf-to-excel",
  name: "PDF → Excel",
  category: "pdf",
  icon: "FileSpreadsheet",
  description: "Convert a PDF to an Excel spreadsheet (.xlsx). Requires LibreOffice installed. " +
    "Works best on PDFs that already contain tables — free-form text/layout PDFs convert poorly.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");
    const outputPath = await officeConvert({ filePath, originalName, toExt: "xlsx", outputDir: OUTPUT_DIR });
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      meta: { engine: "LibreOffice" },
    };
  },
};
