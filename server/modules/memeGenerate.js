import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function captionSvg(text, width, y, fontSize, anchor) {
  const escaped = escapeXml(text.toUpperCase());
  return `
    <text x="${width / 2}" y="${y}" font-family="Impact, Arial, sans-serif" font-size="${fontSize}"
      fill="white" stroke="black" stroke-width="${fontSize / 18}" text-anchor="${anchor}"
      font-weight="bold" paint-order="stroke">${escaped}</text>`;
}

export default {
  id: "meme-generate",
  name: "Meme Generator",
  category: "image",
  icon: "Laugh",
  description: "Overlay classic top/bottom meme caption text onto an image.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  optionsSchema: [
    { key: "topText", label: "Top text", type: "text", placeholder: "ONE DOES NOT SIMPLY" },
    { key: "bottomText", label: "Bottom text", type: "text", placeholder: "SKIP LEG DAY" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const topText = options?.topText || "";
    const bottomText = options?.bottomText || "";
    if (!topText && !bottomText) throw new Error("Provide at least one of 'topText' or 'bottomText'");

    const meta = await sharp(filePath).metadata();
    const { width, height } = meta;
    const fontSize = Math.round(width / 12);

    const svgParts = [`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`];
    if (topText) svgParts.push(captionSvg(topText, width, fontSize * 1.1, fontSize, "middle"));
    if (bottomText) svgParts.push(captionSvg(bottomText, width, height - fontSize * 0.4, fontSize, "middle"));
    svgParts.push("</svg>");
    const overlay = Buffer.from(svgParts.join(""));

    const outputBuf = await sharp(filePath)
      .composite([{ input: overlay, top: 0, left: 0 }])
      .png()
      .toBuffer();

    const baseName = path.parse(originalName || "meme").name;
    const outputName = `${baseName}-meme.png`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outputBuf);

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { topText, bottomText },
    };
  },
};
