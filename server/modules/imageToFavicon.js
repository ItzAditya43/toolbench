import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { zipFiles } from "./_zip.js";

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512];

export default {
  id: "image-to-favicon",
  name: "Image → Favicon / Icon Set",
  category: "image",
  icon: "◎",
  description: "Generate a full favicon/icon set (16, 32, 48, 180, 192, 512 px) from a single image, delivered as a ZIP.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");

    const baseName = path.parse(originalName || "icon").name;
    const createdFiles = [];

    for (const size of FAVICON_SIZES) {
      const ext = size <= 48 ? "png" : "png";
      const fileName = size <= 48 ? `favicon-${size}x${size}.${ext}` : `icon-${size}x${size}.${ext}`;
      const outPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${fileName}`);
      await sharp(filePath)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);
      createdFiles.push(outPath);
    }

    const zipName = `${baseName}-icons-${nanoid(4)}.zip`;
    const outputPath = path.join(OUTPUT_DIR, zipName);
    await zipFiles(createdFiles, outputPath);

    // Clean up individual icon files
    for (const fp of createdFiles) {
      fs.unlink(fp).catch(() => {});
    }

    return {
      outputPath,
      outputName: zipName,
      mimeType: "application/zip",
      meta: { sizes: FAVICON_SIZES, count: FAVICON_SIZES.length },
    };
  },
};