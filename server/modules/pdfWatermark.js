import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-watermark",
  name: "Add Watermark",
  category: "pdf",
  icon: "Droplets",
  description: "Add text (page numbers, watermark) to every page of a PDF with configurable position and opacity.",
  accepts: ["application/pdf"],

  optionsSchema: [
    { key: "text", label: "Watermark text", type: "text", placeholder: "DRAFT — CONFIDENTIAL" },
    { key: "opacity", label: "Opacity (0.0 – 1.0)", type: "text", default: "0.3" },
    {
      key: "position",
      label: "Position",
      type: "select",
      default: "center",
      options: ["center", "top-left", "top-right", "bottom-left", "bottom-right"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const { text = "WATERMARK", opacity = "0.3", position = "center" } = options || {};

    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });

    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pages = pdf.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.max(width, height) / 12;
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x, y;
      const margin = 20;
      switch (position) {
        case "top-left":
          x = margin;
          y = height - textHeight - margin;
          break;
        case "top-right":
          x = width - textWidth - margin;
          y = height - textHeight - margin;
          break;
        case "bottom-left":
          x = margin;
          y = margin;
          break;
        case "bottom-right":
          x = width - textWidth - margin;
          y = margin;
          break;
        case "center":
        default:
          x = (width - textWidth) / 2;
          y = (height - textHeight) / 2;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: parseFloat(opacity),
      });
    }

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(originalName || "watermarked").name;
    const outputName = `${baseName}-watermarked.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { pages: pages.length, text, position, opacity },
    };
  },
};