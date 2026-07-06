import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-strip-exif",
  name: "Strip EXIF / Metadata",
  category: "image",
  icon: "Eraser",
  description: "Remove all EXIF and metadata from an image — useful for privacy before sharing photos online.",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const format = path.extname(originalName).slice(1) || "jpeg";
    const safeFormat = ["jpg", "jpeg", "png", "webp", "avif", "tiff"].includes(format) ? format : "jpeg";

    const outBuf = await sharp(filePath)
      .withMetadata(false) // strip all metadata
      .toFormat(safeFormat, { quality: 90 })
      .toBuffer();

    const outputName = `stripped-${path.parse(originalName).name}.${safeFormat}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await sharp(outBuf).toFile(outputPath);

    return {
      outputPath,
      outputName,
      mimeType: `image/${safeFormat}`,
      meta: { originalBytes: (await sharp(filePath).toBuffer()).length, outputBytes: outBuf.length },
    };
  },
};