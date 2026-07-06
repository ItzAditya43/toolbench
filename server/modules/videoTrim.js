import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-trim",
  name: "Trim Video",
  category: "video",
  icon: "Scissors",
  description: "Cut a clip from a video between a start and end timestamp.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  optionsSchema: [
    { key: "start", label: "Start (HH:MM:SS)", type: "text", placeholder: "00:00:10" },
    { key: "end", label: "End (HH:MM:SS)", type: "text", placeholder: "00:00:30" },
  ],

  async run({ filePath, originalName, options }) {
    const { start = "00:00:00", end } = options || {};
    if (!end) throw new Error("Missing 'end' timestamp in options");

    const outputName = `trimmed-${path.parse(originalName).name}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(toSeconds(end) - toSeconds(start))
        .outputOptions(["-c", "copy"]) // stream copy: fast, no quality loss, snaps to nearest keyframe
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return { outputPath, outputName, mimeType: "video/mp4", meta: { start, end } };
  },
};

function toSeconds(ts) {
  const parts = ts.split(":").map(Number);
  return parts.reduce((acc, val) => acc * 60 + val, 0);
}
