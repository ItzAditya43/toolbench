import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default {
  id: "image-watermark",
  name: "Add Text Watermark",
  category: "image",
  icon: "Droplets",
  description: "Overlay a semi-transparent text watermark onto an image.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    { key: "text", label: "Watermark text", type: "text", placeholder: "© your name" },
    { key: "opacity", label: "Opacity (0.0 - 1.0)", type: "text", default: "0.4" },
    {
      key: "position",
      label: "Position",
      type: "select",
      default: "bottom-right",
      options: ["center", "top-left", "top-right", "bottom-left", "bottom-right"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const opacity = Math.max(0, Math.min(1, parseFloat(options?.opacity ?? "0.4")));
    const position = options?.position || "bottom-right";

    const meta = await sharp(filePath).metadata();
    const { width, height } = meta;
    const fontSize = Math.round(width / 20);
    const margin = fontSize;

    let x, y, anchor;
    if (position === "center") { x = width / 2; y = height / 2; anchor = "middle"; }
    else if (position === "top-left") { x = margin; y = margin + fontSize; anchor = "start"; }
    else if (position === "top-right") { x = width - margin; y = margin + fontSize; anchor = "end"; }
    else if (position === "bottom-left") { x = margin; y = height - margin; anchor = "start"; }
    else { x = width - margin; y = height - margin; anchor = "end"; }

    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}"
        fill="white" fill-opacity="${opacity}" text-anchor="${anchor}" font-weight="bold">${escapeXml(text)}</text>
    </svg>`;

    const outputBuf = await sharp(filePath)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .toBuffer();

    const baseName = path.parse(originalName || "watermarked").name;
    const outputName = `${baseName}-watermarked${path.extname(originalName || ".png")}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    return {
      outputPath,
      outputName,
      mimeType: meta.format ? `image/${meta.format}` : "image/png",
      meta: { text, position, opacity },
    };
  },
};
