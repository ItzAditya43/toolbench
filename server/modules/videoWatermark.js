import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

const POSITIONS = {
  "top-left": "10:10",
  "top-right": "main_w-overlay_w-10:10",
  "bottom-left": "10:main_h-overlay_h-10",
  "bottom-right": "main_w-overlay_w-10:main_h-overlay_h-10",
  center: "(main_w-overlay_w)/2:(main_h-overlay_h)/2",
};

export default {
  id: "video-watermark",
  name: "Watermark Video",
  category: "video",
  icon: "ImagePlus",
  description: "Overlay a logo/image watermark onto a video at a chosen corner.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],
  namedFiles: ["video", "watermark"],

  optionsSchema: [
    {
      key: "position",
      label: "Position",
      type: "select",
      default: "bottom-right",
      options: ["top-left", "top-right", "bottom-left", "bottom-right", "center"],
    },
    { key: "scale", label: "Watermark width (px)", type: "text", default: "100" },
  ],

  async run({ files, options }) {
    if (!files?.video || !files?.watermark) {
      throw new Error("Both 'video' and 'watermark' files are required.");
    }
    const position = POSITIONS[options?.position] ? options.position : "bottom-right";
    const scale = Math.max(10, parseInt(options?.scale || "100", 10) || 100);

    const outputName = `watermarked-${path.parse(files.video.originalname).name}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(files.video.path)
        .input(files.watermark.path)
        .complexFilter([
          `[1:v]scale=${scale}:-1[wm]`,
          `[0:v][wm]overlay=${POSITIONS[position]}[out]`,
        ])
        .outputOptions(["-map", "[out]", "-map", "0:a?", "-c:a", "copy"])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "video/mp4",
      meta: { position, scale },
    };
  },
};
