import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "text-case-convert",
  name: "Slugify / Case Converter",
  category: "text",
  icon: "Aa",
  description: "Convert pasted text between cases: lowercase, UPPERCASE, Title Case, camelCase, snake_case, kebab-case, slug, and more.",
  accepts: ["text"], // no file upload — text is provided via options

  optionsSchema: [
    { key: "text", label: "Input text", type: "text", placeholder: "Type or paste text here…" },
    {
      key: "case",
      label: "Target case",
      type: "select",
      default: "lowercase",
      options: [
        "lowercase",
        "UPPERCASE",
        "Title Case",
        "camelCase",
        "PascalCase",
        "snake_case",
        "kebab-case",
        "slug",
        "CONSTANT_CASE",
        "dot.case",
        "Sentence case",
      ],
    },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const targetCase = options?.case || "lowercase";

    const result = convertCase(text, targetCase);

    const outputName = `converted-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, result, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { inputLength: text.length, outputLength: result.length, targetCase },
    };
  },
};

function convertCase(text, targetCase) {
  switch (targetCase) {
    case "lowercase":
      return text.toLowerCase();
    case "UPPERCASE":
      return text.toUpperCase();
    case "Title Case":
      return text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
    case "camelCase":
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase());
    case "PascalCase":
      return text
        .toLowerCase()
        .replace(/(?:^|[^a-z0-9]+)(.)/g, (_, c) => c.toUpperCase());
    case "snake_case":
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    case "kebab-case":
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    case "slug":
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .replace(/-+/g, "-");
    case "CONSTANT_CASE":
      return text
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
    case "dot.case":
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.|\.$/g, "");
    case "Sentence case":
      return text
        .toLowerCase()
        .replace(/(?:^\s*|\.\s+)(.)/g, (_, c) => c.toUpperCase());
    default:
      return text;
  }
}