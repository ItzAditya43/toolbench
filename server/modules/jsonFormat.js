import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "json-format",
  name: "JSON Formatter / Validator",
  category: "text",
  icon: "Braces",
  description: "Pretty-print, minify, or validate JSON. Reports the exact error location if invalid.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "JSON input", type: "text", placeholder: "{\"key\": \"value\"}" },
    { key: "mode", label: "Mode", type: "select", default: "pretty", options: ["pretty", "minify"] },
    { key: "indent", label: "Indent size (pretty mode)", type: "text", default: "2" },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const mode = options?.mode || "pretty";
    const indent = parseInt(options?.indent || "2", 10) || 2;

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      throw new Error(`Invalid JSON: ${err.message}`);
    }

    const result = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);

    const outputName = `formatted-${nanoid(8)}.json`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "application/json",
      meta: { mode, valid: true, outputLength: result.length },
    };
  },
};
