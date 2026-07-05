import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-rotate",
  name: "Rotate / Flip Video",
  category: "video",
  icon: "↻",
  description: "Rotate (90°, 180°, 270°) or flip (horizontal/vertical) a video.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  optionsSchema: [
    {
      key: "transform",
      label: "Transform",
      type: "select",
      default: "rotate-90",
      options: [
        "rotate-90",
        "rotate-180",
        "rotate-270",
        "flip-horizontal",
        "flip-vertical",
      ],
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const transform = options?.transform || "rotate-90";

    const filterMap = {
      "rotate-90": "transpose=1",
      "rotate-180": "transpose=1,transpose=1",
      "rotate-270": "transpose=2",
      "flip-horizontal": "hflip",
      "flip-vertical": "vflip",
    };

    const filter = filterMap[transform];
    if (!filter) throw new Error(`Unknown transform: "${transform}"`);

    const outputName = `${transform}-${path.parse(originalName).name}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .videoFilter(filter)
        .outputOptions(["-c:a", "copy"])
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "video/mp4",
      meta: { transform },
    };
  },
};