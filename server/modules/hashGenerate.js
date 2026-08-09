import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "hash-generate",
  name: "Hash Generator",
  category: "text",
  icon: "Fingerprint",
  description: "Compute MD5, SHA-1, SHA-256, or SHA-512 hashes of text.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Input text", type: "text", placeholder: "Text to hash" },
    { key: "algorithm", label: "Algorithm", type: "select", default: "sha256", options: ["md5", "sha1", "sha256", "sha512"] },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const algorithm = options?.algorithm || "sha256";

    const hash = crypto.createHash(algorithm).update(text, "utf-8").digest("hex");

    const outputName = `${algorithm}-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, hash, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { algorithm, hash },
    };
  },
};
