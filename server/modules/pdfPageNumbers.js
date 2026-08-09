import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-page-numbers",
  name: "Add Page Numbers",
  category: "pdf",
  icon: "Hash",
  description: "Stamp sequential page numbers onto every page of a PDF.",
  accepts: ["application/pdf"],

  optionsSchema: [
    { key: "start", label: "Start at", type: "text", default: "1" },
    {
      key: "position",
      label: "Position",
      type: "select",
      default: "bottom-center",
      options: ["bottom-center", "bottom-left", "bottom-right", "top-center", "top-left", "top-right"],
    },
    { key: "format", label: "Format ({n} = number, {total} = page count)", type: "text", default: "{n}" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const start = parseInt(options?.start || "1", 10) || 1;
    const position = options?.position || "bottom-center";
    const format = options?.format || "{n}";

    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const total = pages.length;

    pages.forEach((page, i) => {
      const label = format.replace("{n}", String(start + i)).replace("{total}", String(total));
      const { width } = page.getSize();
      const fontSize = 10;
      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const margin = 24;

      let x, y;
      if (position.includes("left")) x = margin;
      else if (position.includes("right")) x = width - textWidth - margin;
      else x = (width - textWidth) / 2;

      y = position.startsWith("top") ? page.getSize().height - margin : margin;

      page.drawText(label, { x, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
    });

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(originalName || "document").name;
    const outputName = `${baseName}-numbered.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { pages: total, start, position },
    };
  },
};
