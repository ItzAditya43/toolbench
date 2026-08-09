import path from "path";
import bwipjs from "bwip-js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "barcode-generate",
  name: "Barcode Generator",
  category: "utility",
  icon: "Barcode",
  description: "Generate a barcode (Code 128, EAN-13, UPC-A, and more) as a PNG.",
  accepts: ["text"],

  optionsSchema: [
    { key: "text", label: "Data to encode", type: "text", placeholder: "0123456789" },
    {
      key: "type",
      label: "Barcode type",
      type: "select",
      default: "code128",
      options: ["code128", "ean13", "upca", "code39", "qrcode"],
    },
  ],

  async run({ options }) {
    const text = options?.text;
    if (!text) throw new Error("Missing 'text' option");
    const bcid = options?.type || "code128";

    const outputName = `barcode-${nanoid(8)}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    const png = await bwipjs.toBuffer({
      bcid,
      text,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: "center",
    });

    const fs = await import("fs/promises");
    await fs.writeFile(outputPath, png);

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { type: bcid, text },
    };
  },
};
