import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

async function sha256File(filePath) {
  const buf = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

export default {
  id: "duplicate-finder",
  name: "Duplicate File Finder",
  category: "utility",
  icon: "Copy",
  description: "Upload multiple files and find exact byte-for-byte duplicates by hash.",
  multiFile: true,

  async run({ filePaths, originalNames }) {
    if (!filePaths || filePaths.length < 2) {
      throw new Error("Upload at least two files to compare.");
    }

    const groups = new Map(); // hash -> [names]
    for (let i = 0; i < filePaths.length; i++) {
      const hash = await sha256File(filePaths[i]);
      const name = originalNames?.[i] || path.basename(filePaths[i]);
      if (!groups.has(hash)) groups.set(hash, []);
      groups.get(hash).push(name);
    }

    const duplicateGroups = Array.from(groups.entries())
      .filter(([, names]) => names.length > 1)
      .map(([hash, names]) => ({ hash, names }));

    const lines = [];
    if (duplicateGroups.length === 0) {
      lines.push("No duplicates found — every file is unique.");
    } else {
      lines.push(`Found ${duplicateGroups.length} group(s) of duplicates:\n`);
      duplicateGroups.forEach((g, i) => {
        lines.push(`Group ${i + 1} (sha256: ${g.hash.slice(0, 12)}…):`);
        g.names.forEach((n) => lines.push(`  - ${n}`));
        lines.push("");
      });
    }

    const outputName = `duplicate-report-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, lines.join("\n"), "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: {
        filesChecked: filePaths.length,
        duplicateGroups: duplicateGroups.length,
        duplicateFiles: duplicateGroups.reduce((sum, g) => sum + g.names.length, 0),
      },
    };
  },
};
