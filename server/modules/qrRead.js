import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import jsQR from "jsqr";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "qr-read",
  name: "QR Code Reader",
  category: "text",
  icon: "◈",
  description: "Decode a QR code from an uploaded image.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  async run({ filePath }) {
    if (!filePath) throw new Error("No file uploaded");

    const buf = await sharp(filePath)
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = buf;
    const code = jsQR(data, info.width, info.height);

    if (!code) {
      throw new Error("No QR code found in the image.");
    }

    // Write the decoded text to a .txt file
    const outputName = `qr-decoded-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, code.data, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { decodedText: code.data },
    };
  },
};