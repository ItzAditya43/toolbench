import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "url-convert",
  name: "URL Encode / Decode",
  category: "text",
  icon: "Link",
  description: "Percent-encode text for use in a URL, or decode a percent-encoded string.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Input", type: "text", placeholder: "Text or encoded URL" },
    { key: "mode", label: "Mode", type: "select", default: "encode", options: ["encode", "decode"] },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const mode = options?.mode || "encode";

    let result;
    try {
      result = mode === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
    } catch (err) {
      throw new Error(`Could not ${mode} input: ${err.message}`);
    }

    const outputName = `url-${mode}-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { mode },
    };
  },
};
