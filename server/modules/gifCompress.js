import path from "path";
import fs from "fs/promises";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "gif-compress",
  name: "Compress GIF",
  category: "video",
  icon: "FileArchive",
  description: "Shrink a GIF's file size using an optimized palette and optional downscale/fps cap.",
  accepts: ["image/gif"],

  optionsSchema: [
    { key: "fps", label: "Max FPS", type: "text", default: "15" },
    { key: "width", label: "Max width (px, keeps aspect ratio)", type: "text", default: "480" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const fps = Math.max(1, Math.min(60, parseInt(options?.fps || "15", 10) || 15));
    const width = Math.max(16, parseInt(options?.width || "480", 10) || 480);

    const baseName = path.parse(originalName || "animation").name;
    const outputName = `${baseName}-compressed.gif`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    const originalStat = await fs.stat(filePath);

    // Palette-based two-pass gif encode — dramatically smaller than a naive re-encode.
    const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer`;

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .complexFilter(filter.split(";"))
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    const compressedStat = await fs.stat(outputPath);
    const savedPercent = Math.round((1 - compressedStat.size / originalStat.size) * 100);

    return {
      outputPath,
      outputName,
      mimeType: "image/gif",
      meta: { fps, width, originalSize: originalStat.size, compressedSize: compressedStat.size, savedPercent },
    };
  },
};
