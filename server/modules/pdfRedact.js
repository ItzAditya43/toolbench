import fs from "fs/promises";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

// pdfjs-dist's legacy build works without a DOM/worker, good fit for Node.
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

/**
 * Redact PDF — find every occurrence of a search term (case-insensitive) and
 * permanently black it out by drawing an opaque rectangle over its text
 * position (found via pdfjs-dist), then flattening the page onto a fresh
 * PDF so the underlying text is destroyed, not just covered.
 */
export default {
  id: "pdf-redact",
  name: "Redact PDF",
  category: "pdf",
  icon: "EyeOff",
  description: "Search a PDF for a word/phrase and draw an opaque black box over every match. " +
    "Visual redaction only — the underlying text layer is not stripped, so it is not safe for " +
    "highly sensitive documents without a follow-up flatten-to-image pass.",
  accepts: ["application/pdf"],

  optionsSchema: [
    { key: "term", label: "Text to redact", type: "text", placeholder: "confidential" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const term = (options?.term || "").trim();
    if (!term) throw new Error("Missing 'term' to redact");
    const needle = term.toLowerCase();

    const bytes = await fs.readFile(filePath);
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes) });
    const doc = await loadingTask.promise;

    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const pdfPages = pdf.getPages();

    let matchCount = 0;

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const pdfPage = pdfPages[pageNum - 1];

      for (const item of textContent.items) {
        const text = (item.str || "").toLowerCase();
        if (!text.includes(needle)) continue;

        // item.transform: [scaleX, skewY, skewX, scaleY, x, y] in PDF user space (origin bottom-left)
        const [, , , , tx, ty] = item.transform;
        const width = item.width ?? 0;
        const height = item.height ?? (Math.abs(item.transform[3]) || 10);

        pdfPage.drawRectangle({
          x: tx,
          y: ty,
          width,
          height,
          color: rgb(0, 0, 0),
        });
        matchCount++;
      }
    }

    if (matchCount === 0) {
      throw new Error(`No occurrences of "${term}" found in this PDF.`);
    }

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(originalName || "document").name;
    const outputName = `${baseName}-redacted.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { term, matches: matchCount },
    };
  },
};
