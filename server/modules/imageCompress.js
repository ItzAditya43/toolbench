import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-compress",
  name: "Compress Image",
  category: "image",
  icon: "FileArchive",
  description: "Shrink an image's file size with adjustable quality, keeping its original format.",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],

  optionsSchema: [
    { key: "quality", label: "Quality (1-100)", type: "text", default: "75" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const quality = Math.max(1, Math.min(100, parseInt(options?.quality || "75", 10) || 75));

    const meta = await sharp(filePath).metadata();
    const format = meta.format === "jpg" ? "jpeg" : meta.format;
    const supported = ["jpeg", "png", "webp", "avif", "tiff"];
    const fmt = supported.includes(format) ? format : "jpeg";

    const originalStat = await fs.stat(filePath);
    const outputBuf = await sharp(filePath).toFormat(fmt, { quality }).toBuffer();

    const baseName = path.parse(originalName || "image").name;
    const outputName = `${baseName}-compressed.${fmt === "jpeg" ? "jpg" : fmt}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    const savedPercent = Math.round((1 - outputBuf.length / originalStat.size) * 100);

    return {
      outputPath,
      outputName,
      mimeType: `image/${fmt}`,
      meta: { quality, originalSize: originalStat.size, compressedSize: outputBuf.length, savedPercent },
    };
  },
};
