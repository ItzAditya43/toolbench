import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "uuid-generate",
  name: "UUID Generator",
  category: "utility",
  icon: "Hash",
  description: "Generate one or more random UUID v4 identifiers.",
  accepts: ["text"], // no primary text field — options only

  optionsSchema: [
    { key: "count", label: "How many", type: "text", default: "1" },
  ],

  async run({ options }) {
    const count = Math.max(1, Math.min(1000, parseInt(options?.count || "1", 10) || 1));
    const uuids = Array.from({ length: count }, () => crypto.randomUUID());
    const result = uuids.join("\n");

    const outputName = `uuids-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { count, first: uuids[0] },
    };
  },
};
