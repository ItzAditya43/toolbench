import fs from "fs/promises";
import path from "path";
import * as XLSX from "xlsx";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * PDF → Excel.
 *
 * LibreOffice's Calc component has no PDF import filter at all (PDF import in
 * LibreOffice only exists for Writer and Draw/Impress), so `soffice
 * --convert-to xlsx` on a PDF always fails with "no export filter found" —
 * this isn't a config issue, it's a real gap in LibreOffice's architecture.
 *
 * Instead, this detects tables via pdf-parse's geometry-based table extractor
 * and writes them to a real .xlsx, one sheet per page that has a table. Works
 * well on PDFs with actual ruled/gridded tables; free-form text/layout PDFs
 * won't have anything to extract (the tool says so rather than emitting an
 * empty spreadsheet).
 */
export default {
  id: "pdf-to-excel",
  name: "PDF → Excel",
  category: "pdf",
  icon: "FileSpreadsheet",
  description: "Extract tables from a PDF into an Excel spreadsheet (.xlsx), one sheet per page with a detected table. Needs ruled/gridded tables in the source — free-form text won't extract.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const { PDFParse } = await import("pdf-parse");
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    let tableResult;
    try {
      tableResult = await parser.getTable();
    } finally {
      await parser.destroy().catch(() => {});
    }

    const pagesWithTables = tableResult.pages.filter((p) => p.tables.length > 0);
    if (pagesWithTables.length === 0) {
      throw new Error(
        "No tables detected in this PDF. This tool extracts ruled/gridded tables — " +
          "for free-form text, try Extract PDF Text instead."
      );
    }

    const workbook = XLSX.utils.book_new();
    let sheetCount = 0;
    for (const page of pagesWithTables) {
      page.tables.forEach((table, i) => {
        sheetCount++;
        const sheet = XLSX.utils.aoa_to_sheet(table);
        const sheetName = `Page${page.num}${page.tables.length > 1 ? `-T${i + 1}` : ""}`.slice(0, 31);
        XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
      });
    }

    const baseName = path.parse(originalName || "document").name;
    const outputName = `${baseName}-tables.xlsx`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    await fs.writeFile(outputPath, buf);

    return {
      outputPath,
      outputName,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      meta: { engine: "pdf-parse table extraction", sheets: sheetCount, pagesWithTables: pagesWithTables.length },
    };
  },
};
