import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-waveform",
  name: "Video → Audio Waveform Image",
  category: "video",
  icon: "∿",
  description: "Generate a waveform image from a video's audio track using ffmpeg's showwavespic filter.",
  accepts: ["video/mp4", "video/webm", "video/quicktime", "audio/mpeg", "audio/wav", "audio/ogg"],

  optionsSchema: [
    {
      key: "color",
      label: "Waveform color (hex)",
      type: "text",
      placeholder: "#00ff88",
      default: "#00ff88",
    },
    {
      key: "bg",
      label: "Background color (hex)",
      type: "text",
      placeholder: "#1a1a2e",
      default: "#1a1a2e",
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const color = options?.color || "#00ff88";
    const bg = options?.bg || "#1a1a2e";

    const outputName = `waveform-${path.parse(originalName).name}-${nanoid(4)}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .outputOptions([
          "-lavfi",
          `showwavespic=s=1280x200:colors=${color}|${color}|${color}:bg=${bg}`,
          "-frames:v", "1",
        ])
        .videoCodec("png")
        .audioCodec("none")
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { color, background: bg },
    };
  },
};