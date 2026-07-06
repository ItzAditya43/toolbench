import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

function toSeconds(ts) {
  const parts = ts.split(":").map(Number);
  return parts.reduce((acc, val) => acc * 60 + val, 0);
}

export default {
  id: "audio-trim",
  name: "Trim Audio",
  category: "audio",
  icon: "Scissors",
  description: "Cut a clip from an audio file between a start and end timestamp.",
  accepts: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4"],

  optionsSchema: [
    { key: "start", label: "Start (HH:MM:SS)", type: "text", placeholder: "00:00:10" },
    { key: "end", label: "End (HH:MM:SS)", type: "text", placeholder: "00:00:30" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const { start = "00:00:00", end } = options || {};
    if (!end) throw new Error("Missing 'end' timestamp in options");

    const ext = path.extname(originalName) || ".mp3";
    const outputName = `trimmed-${path.parse(originalName).name}${ext}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(toSeconds(end) - toSeconds(start))
        .outputOptions(["-c", "copy"])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return { outputPath, outputName, mimeType: "audio/mpeg", meta: { start, end } };
  },
};