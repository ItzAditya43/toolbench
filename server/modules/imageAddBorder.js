import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-add-border",
  name: "Add Border / Frame",
  category: "image",
  icon: "Square",
  description: "Add a solid-color border/frame around an image.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    { key: "width", label: "Border width (px)", type: "text", default: "20" },
    { key: "color", label: "Border color (hex)", type: "text", default: "#000000" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const width = Math.max(1, Math.min(500, parseInt(options?.width || "20", 10) || 20));
    const color = options?.color || "#000000";

    const outputBuf = await sharp(filePath)
      .extend({ top: width, bottom: width, left: width, right: width, background: color })
      .toBuffer();

    const baseName = path.parse(originalName || "bordered").name;
    const outputName = `${baseName}-bordered${path.extname(originalName || ".png")}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { width, color },
    };
  },
};
