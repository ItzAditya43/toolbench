import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "base64-convert",
  name: "Base64 Encode / Decode",
  category: "text",
  icon: "Binary",
  description: "Encode text to Base64 or decode a Base64 string back to text.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Input", type: "text", placeholder: "Text or Base64 string" },
    { key: "mode", label: "Mode", type: "select", default: "encode", options: ["encode", "decode"] },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const mode = options?.mode || "encode";

    let result;
    if (mode === "encode") {
      result = Buffer.from(text, "utf-8").toString("base64");
    } else {
      try {
        result = Buffer.from(text, "base64").toString("utf-8");
      } catch (err) {
        throw new Error(`Invalid Base64 input: ${err.message}`);
      }
    }

    const outputName = `base64-${mode}-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { mode, outputLength: result.length },
    };
  },
};
