import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-collage",
  name: "Collage / Merge Images",
  category: "image",
  icon: "⊞",
  description: "Combine multiple images into a simple grid collage.",
  accepts: ["image/png", "image/jpeg", "image/webp"],
  multiFile: true,

  async run({ filePaths }) {
    if (!filePaths || filePaths.length === 0) {
      throw new Error("Upload at least one image.");
    }

    const count = filePaths.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    // First pass: get all metadata and resize to uniform thumbnails
    const thumbSize = 400;
    const thumbnails = [];

    for (const fp of filePaths) {
      const buf = await sharp(fp)
        .resize(thumbSize, thumbSize, { fit: "cover", position: "centre" })
        .png()
        .toBuffer();
      thumbnails.push(buf);
    }

    const canvasW = cols * thumbSize;
    const canvasH = rows * thumbSize;

    // Build composite array
    const composites = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      composites.push({
        input: thumbnails[i],
        top: row * thumbSize,
        left: col * thumbSize,
      });
    }

    const outBuf = await sharp({
      create: {
        width: canvasW,
        height: canvasH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite(composites)
      .png()
      .toBuffer();

    const outputName = `collage-${nanoid(8)}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await sharp(outBuf).toFile(outputPath);

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { images: count, cols, rows, width: canvasW, height: canvasH },
    };
  },
};