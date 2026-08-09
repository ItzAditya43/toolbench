import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "audio-silence-remove",
  name: "Remove Silence",
  category: "audio",
  icon: "VolumeX",
  description: "Strip out silent gaps from an audio file using ffmpeg's silenceremove filter.",
  accepts: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4"],

  optionsSchema: [
    { key: "threshold", label: "Silence threshold (dB)", type: "text", default: "-35" },
    { key: "minDuration", label: "Min silence duration (sec)", type: "text", default: "0.5" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const threshold = options?.threshold || "-35";
    const minDuration = options?.minDuration || "0.5";

    const ext = path.extname(originalName) || ".mp3";
    const outputName = `no-silence-${path.parse(originalName).name}${ext}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    // Removes silence at start, then any interior silence longer than minDuration.
    const filter = `silenceremove=start_periods=1:start_threshold=${threshold}dB:start_silence=0.1,` +
      `silenceremove=stop_periods=-1:stop_threshold=${threshold}dB:stop_silence=${minDuration}`;

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioFilter(filter)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "audio/mpeg",
      meta: { threshold, minDuration },
    };
  },
};
