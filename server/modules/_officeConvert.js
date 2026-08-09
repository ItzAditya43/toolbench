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
export async function officeConvert({ filePath, originalName, toExt, outputDir, infilter }) {
  const outFile = `${nanoid(8)}-${path.parse(originalName || "document").name}.${toExt}`;
  const outputPath = path.join(outputDir, outFile);

  try {
    const args = ["--headless"];
    // Converting FROM a PDF needs an explicit infilter — LibreOffice's PDF import
    // defaults to Draw, and Draw documents can't be exported through the Writer/
    // Impress filters. Without this, "pdf-to-X" conversions fail with a confusing
    // "no export filter found" error even though the target format is supported.
    if (infilter) args.push(`--infilter=${infilter}`);
    args.push("--convert-to", toExt, "--outdir", outputDir, filePath);

    await execa("soffice", args);
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
