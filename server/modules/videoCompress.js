import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-compress",
  name: "Compress Video",
  category: "video",
  icon: "VideoOff",
  description: "Shrink a video's file size with a quality/size tradeoff slider.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  optionsSchema: [
    {
      key: "preset",
      label: "Target",
      type: "select",
      default: "balanced",
      options: ["smallest (crf 32)", "balanced (crf 26)", "high quality (crf 20)"],
    },
  ],

  async run({ filePath, originalName, options }) {
    const presetMap = {
      "smallest (crf 32)": 32,
      "balanced (crf 26)": 26,
      "high quality (crf 20)": 20,
    };
    const crf = presetMap[options?.preset] ?? 26;

    const outputName = `compressed-${path.parse(originalName).name}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .videoCodec("libx264")
        .outputOptions([`-crf ${crf}`, "-preset", "medium"])
        .audioCodec("aac")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return { outputPath, outputName, mimeType: "video/mp4", meta: { crf } };
  },
};
