import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "regex-tester",
  name: "Regex Tester",
  category: "text",
  icon: "Regex",
  description: "Test a regular expression against a block of text and list every match with its position.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Text to search", type: "text", placeholder: "Text to test the regex against" },
    { key: "pattern", label: "Regex pattern", type: "text", placeholder: "\\d+" },
    { key: "flags", label: "Flags", type: "text", default: "g" },
  ],

  async run({ options }) {
    const text = options?.text;
    const pattern = options?.pattern;
    if (!text) throw new Error("Missing 'text' option");
    if (!pattern) throw new Error("Missing 'pattern' option");
    const flags = options?.flags ?? "g";

    let re;
    try {
      re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    } catch (err) {
      throw new Error(`Invalid regex: ${err.message}`);
    }

    const matches = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
      if (m[0] === "") re.lastIndex++; // avoid infinite loop on zero-width matches
    }

    const report = matches.length
      ? matches.map((m, i) => `#${i + 1} @${m.index}: "${m.match}"${m.groups.length ? ` groups=${JSON.stringify(m.groups)}` : ""}`).join("\n")
      : "No matches.";

    const outputName = `regex-matches-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, report, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { pattern, flags, matchCount: matches.length },
    };
  },
};
