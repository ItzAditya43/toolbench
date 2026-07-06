import path from "path";
import { mdToPdf } from "md-to-pdf";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "markdown-to-pdf",
  name: "Markdown → PDF",
  category: "text",
  icon: "FileText",
  description: "Render a Markdown file (with code blocks, tables, headings) to a clean PDF.",
  accepts: ["text/markdown", "text/plain"],

  async run({ filePath, originalName }) {
    const outputName = `${path.parse(originalName).name}.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    // md-to-pdf wraps Puppeteer under the hood — first run downloads a headless
    // Chromium if one isn't already cached, which is expected the first time.
    await mdToPdf({ path: filePath }, { dest: outputPath });

    return { outputPath, outputName, mimeType: "application/pdf", meta: {} };
  },
};
