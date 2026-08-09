import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

function toHex(n) {
  return n.toString(16).padStart(2, "0");
}

export default {
  id: "image-color-palette",
  name: "Color Palette Extractor",
  category: "image",
  icon: "Palette",
  description: "Extract the dominant colors from an image as a swatch strip PNG plus hex codes.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    { key: "count", label: "Number of colors", type: "text", default: "6" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const count = Math.max(2, Math.min(16, parseInt(options?.count || "6", 10) || 6));

    // Downscale for speed, then bucket-quantize pixels to find dominant colors.
    const { data, info } = await sharp(filePath)
      .resize(100, 100, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buckets = new Map();
    const step = 24; // quantization bucket size per channel
    for (let i = 0; i < data.length; i += info.channels) {
      const r = Math.round(data[i] / step) * step;
      const g = Math.round(data[i + 1] / step) * step;
      const b = Math.round(data[i + 2] / step) * step;
      const key = `${r},${g},${b}`;
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }

    const sorted = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]).slice(0, count);
    const colors = sorted.map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return { r: Math.min(255, r), g: Math.min(255, g), b: Math.min(255, b) };
    });
    const hexes = colors.map((c) => `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`);

    // Render a swatch strip.
    const swatchSize = 100;
    const svg = `<svg width="${swatchSize * colors.length}" height="${swatchSize}" xmlns="http://www.w3.org/2000/svg">
      ${colors.map((c, i) => `<rect x="${i * swatchSize}" y="0" width="${swatchSize}" height="${swatchSize}" fill="rgb(${c.r},${c.g},${c.b})" />`).join("")}
    </svg>`;

    const outputBuf = await sharp(Buffer.from(svg)).png().toBuffer();
    const baseName = path.parse(originalName || "palette").name;
    const outputName = `${baseName}-palette.png`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { colors: hexes },
    };
  },
};
