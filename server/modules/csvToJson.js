import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "csv-to-json",
  name: "CSV → JSON",
  category: "text",
  icon: "ArrowLeftRight",
  description: "Convert a CSV file to JSON format.",
  accepts: ["text/csv", "application/vnd.ms-excel"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const csvContent = await fs.readFile(filePath, "utf-8");
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) throw new Error("CSV must have at least a header row and one data row.");

    const headers = parseCsvLine(lines[0]);
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i]);
      if (values.length === 0) continue;
      const record = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = values[j] || "";
      }
      records.push(record);
    }

    const jsonStr = JSON.stringify(records, null, 2);
    const baseName = path.parse(originalName || "data").name;
    const outputName = `${baseName}.json`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, jsonStr, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "application/json",
      meta: { records: records.length },
    };
  },
};

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}