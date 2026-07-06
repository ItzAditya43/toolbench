import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-merge",
  name: "Merge / Concatenate Videos",
  category: "video",
  icon: "Combine",
  description: "Concatenate multiple video files into one. All files should have the same codec/format.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],
  multiFile: true,

  async run({ filePaths }) {
    if (!filePaths || filePaths.length < 2) {
      throw new Error("Please upload at least two video files to merge.");
    }

    // Create a concat list file for ffmpeg
    const listContent = filePaths.map((fp) => `file '${fp.replace(/'/g, "'\\''")}'`).join("\n");
    const listPath = path.join(OUTPUT_DIR, `concat-${nanoid(8)}.txt`);
    await fs.writeFile(listPath, listContent, "utf-8");

    const outputName = `merged-${nanoid(8)}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await new Promise((resolve, reject) => {
      ffmpeg(listPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    // Clean up the concat list
    await fs.unlink(listPath).catch(() => {});

    return {
      outputPath,
      outputName,
      mimeType: "video/mp4",
      meta: { sourceFiles: filePaths.length },
    };
  },
};