import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

const WORDS = (
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis " +
  "nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat " +
  "duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu " +
  "fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in " +
  "culpa qui officia deserunt mollit anim id est laborum"
).split(" ");

function randWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function sentence(minWords = 6, maxWords = 14) {
  const n = minWords + Math.floor(Math.random() * (maxWords - minWords));
  const words = Array.from({ length: n }, randWord);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

function paragraph(sentences = 5) {
  return Array.from({ length: sentences }, () => sentence()).join(" ");
}

export default {
  id: "lorem-ipsum-generate",
  name: "Lorem Ipsum Generator",
  category: "utility",
  icon: "Type",
  description: "Generate placeholder Lorem Ipsum text — by paragraph, sentence, or word.",
  accepts: ["text"],

  optionsSchema: [
    { key: "unit", label: "Unit", type: "select", default: "paragraphs", options: ["paragraphs", "sentences", "words"] },
    { key: "count", label: "Count", type: "text", default: "3" },
  ],

  async run({ options }) {
    const unit = options?.unit || "paragraphs";
    const count = Math.max(1, Math.min(500, parseInt(options?.count || "3", 10) || 3));

    let result;
    if (unit === "words") {
      result = Array.from({ length: count }, randWord).join(" ");
    } else if (unit === "sentences") {
      result = Array.from({ length: count }, () => sentence()).join(" ");
    } else {
      result = Array.from({ length: count }, () => paragraph()).join("\n\n");
    }

    const outputName = `lorem-ipsum-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { unit, count },
    };
  },
};
