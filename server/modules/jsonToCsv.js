import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "json-to-csv",
  name: "JSON → CSV",
  category: "text",
  icon: "ArrowRightLeft",
  description: "Convert a JSON file (array of objects) to CSV format.",
  accepts: ["application/json"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const raw = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("JSON must be a non-empty array of objects.");
    }

    const headers = Object.keys(data[0]);
    const lines = [headers.map(escapeCsvField).join(",")];

    for (const row of data) {
      const values = headers.map((h) => {
        const val = row[h] !== undefined ? String(row[h]) : "";
        return escapeCsvField(val);
      });
      lines.push(values.join(","));
    }

    const csvContent = lines.join("\n") + "\n";
    const baseName = path.parse(originalName || "data").name;
    const outputName = `${baseName}.csv`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, csvContent, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/csv",
      meta: { records: data.length, columns: headers.length },
    };
  },
};

function escapeCsvField(val) {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}