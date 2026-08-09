import fs from "fs/promises";
import path from "path";
import { PDFDocument, degrees } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Organize PDF pages: reorder, delete, and/or rotate in one pass.
 *
 * The "layout" option is a compact page spec, e.g. "3,1,2r90,5r180" —
 * comma-separated 1-based page numbers, in the order they should appear
 * in the output, each optionally suffixed with r90/r180/r270 to rotate.
 * Pages omitted from the spec are dropped from the output (delete-by-omission).
 */
function parseLayout(spec, pageCount) {
  const tokens = spec.split(",").map((s) => s.trim()).filter(Boolean);
  if (tokens.length === 0) throw new Error("Layout is empty — nothing to keep");

  return tokens.map((tok) => {
    const m = /^(\d+)(?:r(90|180|270))?$/i.exec(tok);
    if (!m) throw new Error(`Invalid layout token "${tok}" — expected e.g. "3" or "3r90"`);
    const pageNum = parseInt(m[1], 10);
    if (pageNum < 1 || pageNum > pageCount) {
      throw new Error(`Page ${pageNum} is out of range (document has ${pageCount} pages)`);
    }
    return { index: pageNum - 1, rotate: m[2] ? parseInt(m[2], 10) : 0 };
  });
}

export default {
  id: "pdf-organize",
  name: "Organize / Rotate PDF Pages",
  category: "pdf",
  icon: "LayoutGrid",
  description: "Reorder, delete, and rotate pages in a single pass using a page layout spec.",
  accepts: ["application/pdf"],

  optionsSchema: [
    {
      key: "layout",
      label: "Page layout (e.g. 3,1,2r90 — order kept, omit to delete, rNN to rotate)",
      type: "text",
      placeholder: "1,2,3",
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const bytes = await fs.readFile(filePath);
    const src = await PDFDocument.load(bytes, { updateMetadata: false });
    const pageCount = src.getPageCount();

    const layoutSpec = options?.layout?.trim() || Array.from({ length: pageCount }, (_, i) => i + 1).join(",");
    const layout = parseLayout(layoutSpec, pageCount);

    const out = await PDFDocument.create();
    const copied = await out.copyPages(src, layout.map((l) => l.index));
    copied.forEach((page, i) => {
      const { rotate } = layout[i];
      if (rotate) {
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotate) % 360));
      }
      out.addPage(page);
    });

    const outBytes = await out.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(originalName || "document").name;
    const outputName = `${baseName}-organized.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { inputPages: pageCount, outputPages: copied.length },
    };
  },
};
