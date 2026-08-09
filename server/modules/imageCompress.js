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
  description: "Shrink an image's file size — pick a quality level, or give a target size in KB and let it search for the highest quality that fits.",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],

  optionsSchema: [
    { key: "quality", label: "Quality (1-100, ignored if target size is set)", type: "text", default: "75" },
    { key: "targetSizeKB", label: "Target size in KB (optional — overrides quality)", type: "text", placeholder: "200" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");

    const meta = await sharp(filePath).metadata();
    const format = meta.format === "jpg" ? "jpeg" : meta.format;
    const supported = ["jpeg", "png", "webp", "avif", "tiff"];
    const fmt = supported.includes(format) ? format : "jpeg";

    const originalStat = await fs.stat(filePath);
    const targetSizeKB = options?.targetSizeKB ? parseFloat(options.targetSizeKB) : null;

    let outputBuf, quality;

    if (targetSizeKB && targetSizeKB > 0) {
      const targetBytes = targetSizeKB * 1024;
      // Binary search quality (1-100) for the highest quality that fits the target size.
      let lo = 1, hi = 100, best = null;
      for (let i = 0; i < 8; i++) {
        quality = Math.round((lo + hi) / 2);
        const buf = await sharp(filePath).toFormat(fmt, { quality }).toBuffer();
        if (buf.length <= targetBytes) {
          best = buf;
          lo = quality + 1; // try higher quality, still under target
        } else {
          hi = quality - 1;
        }
        if (lo > hi) break;
      }
      outputBuf = best || await sharp(filePath).toFormat(fmt, { quality: 1 }).toBuffer();
      quality = best ? quality : 1;
    } else {
      quality = Math.max(1, Math.min(100, parseInt(options?.quality || "75", 10) || 75));
      outputBuf = await sharp(filePath).toFormat(fmt, { quality }).toBuffer();
    }

    const baseName = path.parse(originalName || "image").name;
    const outputName = `${baseName}-compressed.${fmt === "jpeg" ? "jpg" : fmt}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    const savedPercent = Math.round((1 - outputBuf.length / originalStat.size) * 100);
    const metResult = targetSizeKB ? outputBuf.length <= targetSizeKB * 1024 : null;

    return {
      outputPath,
      outputName,
      mimeType: `image/${fmt}`,
      meta: {
        quality,
        originalSize: originalStat.size,
        compressedSize: outputBuf.length,
        savedPercent,
        ...(targetSizeKB ? { targetSizeKB, metTarget: metResult } : {}),
      },
    };
  },
};
