import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-to-gif",
  name: "Video → GIF",
  category: "video",
  icon: "▦",
  description: "Turn a video clip into a GIF, with a palette pass for cleaner colors.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  optionsSchema: [
    { key: "start", label: "Start (HH:MM:SS)", type: "text", default: "00:00:00" },
    { key: "duration", label: "Duration (seconds)", type: "text", default: "3" },
    { key: "fps", label: "FPS", type: "text", default: "12" },
    { key: "width", label: "Width (px)", type: "text", default: "480" },
  ],

  async run({ filePath, originalName, options }) {
    const { start = "00:00:00", duration = "3", fps = "12", width = "480" } = options || {};
    const outputName = `${path.parse(originalName).name}.gif`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    // single-pass palettegen+paletteuse filtergraph — noticeably better color quality
    // than a naive ffmpeg-to-gif conversion, still one ffmpeg invocation.
    const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse`;

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .setStartTime(start)
        .setDuration(duration)
        .complexFilter(filter)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return { outputPath, outputName, mimeType: "image/gif", meta: { fps, width, duration } };
  },
};
