import path from "path";
import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "qr-generate",
  name: "QR Code Generator",
  category: "text",
  icon: "QrCode",
  description: "Generate a QR code PNG from any text, URL, or input.",
  accepts: ["url"], // uses text field, not a file

  optionsSchema: [
    { key: "text", label: "Text or URL to encode", type: "text", placeholder: "https://example.com" },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");

    const outputName = `qrcode-${nanoid(8)}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await QRCode.toFile(outputPath, text, { type: "png", width: 512, margin: 2 });

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { text },
    };
  },
};