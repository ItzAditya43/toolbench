import path from "path";
import puppeteer from "puppeteer";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * HTML → PDF: renders a URL with headless Chromium and prints it to PDF.
 * Same engine md-to-pdf already pulls in for Markdown → PDF.
 */
export default {
  id: "html-to-pdf",
  name: "HTML → PDF",
  category: "pdf",
  icon: "Code2",
  description: "Render a web page into a PDF using headless Chromium.",
  accepts: ["url"],

  optionsSchema: [
    { key: "url", label: "Page URL", type: "text", placeholder: "https://example.com" },
  ],

  async run({ options }) {
    const url = options?.url?.trim();
    if (!url) throw new Error("Missing 'url' in options");

    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0" });

      const outputName = `html-${nanoid(8)}.pdf`;
      const outputPath = path.join(OUTPUT_DIR, outputName);
      await page.pdf({ path: outputPath, format: "A4", printBackground: true });

      return {
        outputPath,
        outputName,
        mimeType: "application/pdf",
        meta: { source: url },
      };
    } finally {
      await browser.close();
    }
  },
};
