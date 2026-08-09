import path from "path";
import { OUTPUT_DIR } from "../config.js";
import { officeConvert } from "./_officeConvert.js";

export default {
  id: "excel-to-pdf",
  name: "Excel → PDF",
  category: "pdf",
  icon: "FileSpreadsheet",
  description: "Convert an Excel spreadsheet (.xlsx/.xls) to PDF. Requires LibreOffice installed.",
  accepts: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
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
