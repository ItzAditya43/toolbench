import fs from "fs/promises";
import path from "path";
import { createTwoFilesPatch } from "diff";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "text-diff",
  name: "Diff Two Text Files",
  category: "text",
  icon: "FileDiff",
  description: "Compare two text files and produce a unified diff.",
  accepts: ["text/plain"],
  namedFiles: ["left", "right"],

  async run({ files }) {
    if (!files?.left || !files?.right) {
      throw new Error("Both 'left' and 'right' files are required.");
    }

    const leftText = await fs.readFile(files.left.path, "utf-8");
    const rightText = await fs.readFile(files.right.path, "utf-8");

    const unified = createTwoFilesPatch(
      files.left.originalname || "left",
      files.right.originalname || "right",
      leftText,
      rightText,
      undefined,
      undefined,
      { context: 3 }
    );

    const outputName = `diff-${nanoid(8)}.diff`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, unified, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: {
        leftName: files.left.originalname,
        rightName: files.right.originalname,
        changed: (unified.match(/^[+-]/gm) || []).length,
      },
    };
  },
};