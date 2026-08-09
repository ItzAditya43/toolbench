import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "word-counter",
  name: "Word / Character Counter",
  category: "text",
  icon: "Calculator",
  description: "Count words, characters, sentences, and paragraphs, plus estimated reading time.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Input text", type: "text", placeholder: "Paste text here…" },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");

    const words = (text.trim().match(/\S+/g) || []).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, "").length;
    const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const readingTimeMin = Math.max(1, Math.round(words / 200));

    const stats = { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMin };
    const report = Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join("\n");

    const outputName = `word-count-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, report, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: stats,
    };
  },
};
