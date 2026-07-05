import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "image-crop",
  name: "Crop Image",
  category: "image",
  icon: "⊞",
  description: "Crop an image by pixel coordinates or choose an aspect-ratio preset.",
  accepts: ["image/png", "image/jpeg", "image/webp", "image/avif", "image/tiff"],

  optionsSchema: [
    { key: "x", label: "X offset (px)", type: "text", placeholder: "0" },
    { key: "y", label: "Y offset (px)", type: "text", placeholder: "0" },
    { key: "width", label: "Width (px)", type: "text", placeholder: "800" },
    { key: "height", label: "Height (px)", type: "text", placeholder: "600" },
    {
      key: "aspectRatio",
      label: "Aspect-ratio preset (overrides w/h if set)",
      type: "select",
      default: "none",
      options: ["none", "square", "4:5", "16:9", "9:16"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const { x, y, width, height, aspectRatio = "none" } = options || {};

    const meta = await sharp(filePath).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    let cropW = width ? parseInt(width, 10) : imgW;
    let cropH = height ? parseInt(height, 10) : imgH;

    // Compute dimensions from aspect ratio if a preset is chosen
    if (aspectRatio !== "none") {
      const [aw, ah] = aspectRatio.split(":").map(Number);
      const target = Math.min(imgW, imgH);
      if (aw > ah) {
        cropH = Math.round(target * (ah / aw));
        cropW = target;
      } else {
        cropW = Math.round(target * (aw / ah));
        cropH = target;
      }
    }

    const cropX = x ? parseInt(x, 10) : Math.round((imgW - cropW) / 2);
    const cropY = y ? parseInt(y, 10) : Math.round((imgH - cropH) / 2);

    const format = path.extname(originalName).slice(1) || "png";
    const safeFormat = ["jpg", "jpeg", "png", "webp", "avif", "tiff"].includes(format) ? format : "png";

    const outBuf = await sharp(filePath)
      .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
      .toFormat(safeFormat, { quality: 90 })
      .toBuffer();

    const outputName = `cropped-${path.parse(originalName).name}.${safeFormat}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await sharp(outBuf).toFile(outputPath);

    return {
      outputPath,
      outputName,
      mimeType: `image/${safeFormat}`,
      meta: { width: cropW, height: cropH, x: cropX, y: cropY },
    };
  },
};