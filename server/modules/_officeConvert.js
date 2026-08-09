import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { execa } from "./_execa.js";

/**
 * Shared LibreOffice headless conversion helper — used by every office<->pdf
 * module (docxToPdf, pdfToDocx, excelToPdf, pdfToExcel, pptToPdf, pdfToPpt).
 *
 * Dependency: LibreOffice (apt install libreoffice / brew install --cask libreoffice)
 */
export async function officeConvert({ filePath, originalName, toExt, outputDir }) {
  const outFile = `${nanoid(8)}-${path.parse(originalName || "document").name}.${toExt}`;
  const outputPath = path.join(outputDir, outFile);

  try {
    await execa("soffice", [
      "--headless",
      "--convert-to", toExt,
      "--outdir", outputDir,
      filePath,
    ]);
  } catch (err) {
    throw new Error(
      `Conversion to .${toExt} needs LibreOffice (soffice) installed locally. ` +
        "This is the heaviest dependency in the toolset — a full office suite. " +
        "Install it with: apt install libreoffice (Linux) or brew install --cask libreoffice (macOS). " +
        "Original error: " + err.message
    );
  }

  const baseName = path.parse(path.basename(filePath)).name;
  const loFile = path.join(outputDir, `${baseName}.${toExt}`);
  await fs.rename(loFile, outputPath);

  return outputPath;
}
