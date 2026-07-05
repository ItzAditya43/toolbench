import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-thumbnail",
  name: "Extract Frame / Thumbnail",
  category: "video",
  icon: "◉",
  description: "Extract a single frame from a video at a given timestamp.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  optionsSchema: [
    { key: "timestamp", label: "Timestamp (HH:MM:SS or seconds)", type: "text", placeholder: "00:00:05" },
    {
      key: "format",
      label: "Output format",
      type: "select",
      default: "jpeg",
      options: ["jpeg", "png"],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const timestamp = options?.timestamp || "00:00:01";
    const fmt = options?.format || "jpeg";

    const ext = fmt === "png" ? "png" : "jpg";
    const outputName = `thumbnail-${path.parse(originalName).name}-${nanoid(4)}.${ext}`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .on("end", resolve)
        .on("error", reject)
        .screenshots({
          timestamps: [timestamp],
          filename: path.basename(outputPath),
          folder: OUTPUT_DIR,
          size: "?x720", // 720p height, maintain aspect ratio
        });
    });

    return {
      outputPath,
      outputName,
      mimeType: fmt === "png" ? "image/png" : "image/jpeg",
      meta: { timestamp, format: fmt },
    };
  },
};