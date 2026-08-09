import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

const SETS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

function randomChar(charset) {
  return charset[crypto.randomInt(charset.length)];
}

export default {
  id: "password-generate",
  name: "Password Generator",
  category: "utility",
  icon: "KeyRound",
  description: "Generate strong random passwords with configurable length and character sets.",
  accepts: ["text"],

  optionsSchema: [
    { key: "length", label: "Length", type: "text", default: "16" },
    { key: "count", label: "How many", type: "text", default: "1" },
    { key: "upper", label: "Include uppercase", type: "checkbox", default: true },
    { key: "digits", label: "Include digits", type: "checkbox", default: true },
    { key: "symbols", label: "Include symbols", type: "checkbox", default: true },
  ],

  async run({ options }) {
    const length = Math.max(4, Math.min(256, parseInt(options?.length || "16", 10) || 16));
    const count = Math.max(1, Math.min(100, parseInt(options?.count || "1", 10) || 1));

    let charset = SETS.lower;
    if (options?.upper !== false && options?.upper !== "false") charset += SETS.upper;
    if (options?.digits !== false && options?.digits !== "false") charset += SETS.digits;
    if (options?.symbols !== false && options?.symbols !== "false") charset += SETS.symbols;

    const passwords = Array.from({ length: count }, () =>
      Array.from({ length }, () => randomChar(charset)).join("")
    );

    const outputName = `passwords-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, passwords.join("\n"), "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { length, count },
    };
  },
};
