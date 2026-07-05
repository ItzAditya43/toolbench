import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Single-pass loudness normalization using ffmpeg's loudnorm filter.
 *
 * Two-pass EBU R128 is more accurate (measures first, applies second) but
 * single-pass is a pragmatic tradeoff — good enough for most use cases and
 * avoids the complexity of a two-pass workflow. If you need broadcast-grade
 * loudness, swap to a two-pass approach: run loudnorm with printFormat for
 * measured values, then re-run with those values as input parameters.
 */
export default {
  id: "audio-normalize",
  name: "Normalize Volume",
  category: "audio",
  icon: "≡",
  description: "Normalize audio loudness to a target level using EBU R128 (single-pass loudnorm).",
  accepts: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4"],

  optionsSchema: [
    {
      key: "lufs",
      label: "Target loudness (LUFS)",
      type: "text",
      placeholder: "-14",
      default: "-14",
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const lufs = options?.lufs || "-14";

    const ext = path.extname(originalName) || ".mp3";
    const outputName = `normalized-${path.parse(originalName).name}${ext}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioFilter(`loudnorm=I=${lufs}:LRA=7:TP=-1.5`)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "audio/mpeg",
      meta: { targetLUFS: parseFloat(lufs) },
    };
  },
};