import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Image upscale using sharp's Lanczos resampling.
 *
 * For higher-quality upscaling (Real-ESRGAN, waifu2x, etc.) swap this module's
 * `run()` body for a shell-out to realesrgan-ncnn-vulkan (or similar) via _execa.
 * That approach needs the binary on PATH and benefits from GPU support.
 *
 * The sharp Lanczos approach is zero-extra-dependency and works well for 2× upscales.
 */
export default {
  id: "image-upscale",
  name: "Upscale Image",
  category: "image",
  icon: "ZoomIn",
  description: "Upscale an image 2× / 4× using Lanczos resampling (sharp). For higher quality, swap to Real-ESRGAN — see docs.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    {
      key: "scale",
      label: "Scale factor",
      type: "select",
      default: "2",
      options: ["2", "4"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const scale = parseInt(options?.scale || "2", 10);

    const meta = await sharp(filePath).metadata();
    const newW = Math.round((meta.width || 100) * scale);
    const newH = Math.round((meta.height || 100) * scale);

    const format = path.extname(originalName).slice(1) || "png";
    const safeFormat = ["jpg", "jpeg", "png", "webp", "avif"].includes(format) ? format : "png";

    const outBuf = await sharp(filePath)
      .resize(newW, newH, { fit: "fill", kernel: "lanczos3" })
      .toFormat(safeFormat, { quality: 90 })
      .toBuffer();

    const outputName = `upscaled-${scale}x-${path.parse(originalName).name}.${safeFormat}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await sharp(outBuf).toFile(outputPath);

    return {
      outputPath,
      outputName,
      mimeType: `image/${safeFormat}`,
      meta: { width: newW, height: newH, scale },
    };
  },
};