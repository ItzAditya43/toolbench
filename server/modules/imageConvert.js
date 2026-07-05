import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-convert",
  name: "Resize / Convert Image",
  category: "image",
  icon: "▧",
  description: "Resize an image and/or convert it to a different format (JPG, PNG, WebP, AVIF).",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],

  optionsSchema: [
    { key: "width", label: "Width (px, blank = auto)", type: "text", placeholder: "1920" },
    { key: "height", label: "Height (px, blank = auto)", type: "text", placeholder: "1080" },
    { key: "format", label: "Output format", type: "select", default: "webp", options: ["jpeg", "png", "webp", "avif"] },
    { key: "quality", label: "Quality (1-100)", type: "text", default: "80" },
  ],

  async run({ filePath, originalName, options }) {
    const { width, height, format = "webp", quality = "80" } = options || {};

    let pipeline = sharp(filePath);
    if (width || height) {
      pipeline = pipeline.resize({
        width: width ? parseInt(width, 10) : null,
        height: height ? parseInt(height, 10) : null,
        fit: "inside",
        withoutEnlargement: true,
      });
    }
    pipeline = pipeline.toFormat(format, { quality: parseInt(quality, 10) || 80 });

    const outputName = `${path.parse(originalName).name}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    const info = await pipeline.toFile(outputPath);

    return {
      outputPath,
      outputName,
      mimeType: `image/${format}`,
      meta: { width: info.width, height: info.height, outputBytes: info.size },
    };
  },
};
