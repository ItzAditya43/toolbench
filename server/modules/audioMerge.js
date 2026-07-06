import fs from "fs/promises";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "audio-merge",
  name: "Merge Audio Tracks",
  category: "audio",
  icon: "Combine",
  description: "Concatenate multiple audio files into one.",
  accepts: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"],
  multiFile: true,

  async run({ filePaths }) {
    if (!filePaths || filePaths.length < 2) {
      throw new Error("Please upload at least two audio files to merge.");
    }

    // Create concat list
    const listContent = filePaths.map((fp) => `file '${fp.replace(/'/g, "'\\''")}'`).join("\n");
    const listPath = path.join(OUTPUT_DIR, `concat-${nanoid(8)}.txt`);
    await fs.writeFile(listPath, listContent, "utf-8");

    const outputName = `merged-${nanoid(8)}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await new Promise((resolve, reject) => {
      ffmpeg(listPath)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions(["-c", "copy"])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    await fs.unlink(listPath).catch(() => {});

    return {
      outputPath,
      outputName,
      mimeType: "audio/mpeg",
      meta: { sourceFiles: filePaths.length },
    };
  },
};