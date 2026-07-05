import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { zipFiles } from "./_zip.js";

function parseRanges(rangeStr, maxPage) {
  // "1-3,5,7-9" => [[1,3], [5,5], [7,9]]
  const ranges = [];
  const parts = rangeStr.split(",").map((s) => s.trim());
  for (const part of parts) {
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      if (isNaN(a) || isNaN(b)) throw new Error(`Invalid range: "${part}"`);
      ranges.push([Math.max(1, a), Math.min(maxPage, b)]);
    } else {
      const n = Number(part);
      if (isNaN(n)) throw new Error(`Invalid page number: "${part}"`);
      ranges.push([Math.max(1, n), Math.min(maxPage, n)]);
    }
  }
  return ranges.filter(([lo, hi]) => lo <= hi && lo <= maxPage);
}

export default {
  id: "pdf-split",
  name: "Split PDF",
  category: "pdf",
  icon: "⊧",
  description: "Split a PDF into separate files by page ranges or every N pages.",
  accepts: ["application/pdf"],

  optionsSchema: [
    {
      key: "mode",
      label: "Split mode",
      type: "select",
      default: "ranges",
      options: ["page-ranges", "every-n-pages"],
    },
    {
      key: "ranges",
      label: "Page ranges (e.g. 1-3,5,7-9)",
      type: "text",
      placeholder: "1-3,5,7-9",
    },
    {
      key: "n",
      label: "Every N pages",
      type: "text",
      placeholder: "2",
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const totalPages = pdf.getPageCount();
    const mode = options?.mode || "page-ranges";

    let ranges;
    if (mode === "every-n-pages") {
      const n = parseInt(options?.n || "2", 10);
      if (isNaN(n) || n < 1) throw new Error("Invalid N value");
      ranges = [];
      for (let i = 1; i <= totalPages; i += n) {
        ranges.push([i, Math.min(i + n - 1, totalPages)]);
      }
    } else {
      if (!options?.ranges) throw new Error("Missing 'ranges' option");
      ranges = parseRanges(options.ranges, totalPages);
    }

    if (ranges.length === 0) throw new Error("No valid page ranges specified");

    const createdFiles = [];
    const baseName = path.parse(originalName || "split").name;

    for (let idx = 0; idx < ranges.length; idx++) {
      const [lo, hi] = ranges[idx];
      const newPdf = await PDFDocument.create();
      const pageIndices = [];
      for (let p = lo; p <= hi; p++) {
        pageIndices.push(p - 1);
      }
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      for (const page of copiedPages) {
        newPdf.addPage(page);
      }
      const outBytes = await newPdf.save({ useObjectStreams: true, addDefaultPage: false });
      const sliceName = `split-${baseName}-p${lo}to${hi}.pdf`;
      const slicePath = path.join(OUTPUT_DIR, `${nanoid(8)}-${sliceName}`);
      await fs.writeFile(slicePath, outBytes);
      createdFiles.push(slicePath);
    }

    let outputPath, outputName;
    if (createdFiles.length === 1) {
      outputPath = createdFiles[0];
      outputName = path.basename(outputPath);
    } else {
      const zipName = `${baseName}-split-${nanoid(4)}.zip`;
      outputPath = path.join(OUTPUT_DIR, zipName);
      await zipFiles(createdFiles, outputPath);
      outputName = zipName;
      // Clean up the individual PDFs after zipping
      for (const fp of createdFiles) {
        fs.unlink(fp).catch(() => {});
      }
    }

    return {
      outputPath,
      outputName,
      mimeType: createdFiles.length === 1 ? "application/pdf" : "application/zip",
      meta: { totalPages, outputCount: createdFiles.length, ranges },
    };
  },
};