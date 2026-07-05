import fs from "fs/promises";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");
import { createWriteStream } from "fs";
import path from "path";

/**
 * Create a ZIP archive containing the given file paths.
 * Preserves the basename of each file in the archive root.
 *
 * @param {string[]} filePaths - Absolute paths of files to include
 * @param {string} outputPath - Where to write the .zip
 * @returns {Promise<void>}
 */
export async function zipFiles(filePaths, outputPath) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = createWriteStream(outputPath);

    archive.on("error", reject);
    stream.on("close", resolve);

    archive.pipe(stream);

    for (const fp of filePaths) {
      archive.file(fp, { name: path.basename(fp) });
    }

    archive.finalize();
  });
}