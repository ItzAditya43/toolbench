import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "video-subtitles",
  name: "Add Subtitles",
  category: "video",
  icon: "⊡",
  description: "Burn or embed subtitles from an .srt file into a video.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],
  namedFiles: ["video", "subtitles"],

  optionsSchema: [
    {
      key: "mode",
      label: "Subtitle mode",
      type: "select",
      default: "burn",
      options: ["burn-in", "soft-embed"],
    },
  ],

  async run({ files, options }) {
    if (!files?.video || !files?.subtitles) {
      throw new Error("Both 'video' and 'subtitles' files are required.");
    }

    const mode = options?.mode || "burn-in";
    const subPath = files.subtitles.path;
    // Escape subtitle path for ffmpeg filter (needs backslashes before special chars on Windows, but we're on Linux)
    const escapedSubPath = subPath.replace(/\\/g, "\\\\").replace(/:/g, "\\:");

    const outputName = `subtitled-${path.parse(files.video.originalname).name}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(files.video.path);

      if (mode === "burn-in") {
        cmd = cmd
          .outputOptions([`-vf`, `subtitles=${escapedSubPath}`])
          .outputOptions(["-c:a", "copy"]);
      } else {
        // Soft embed: copy video/audio and add subtitle stream
        cmd = cmd
          .input(subPath)
          .outputOptions(["-c", "copy", "-c:s", "mov_text"])
          .outputOptions(["-metadata:s:s:0", `language=eng`]);
      }

      cmd
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "video/mp4",
      meta: { mode, subtitleFile: files.subtitles.originalname },
    };
  },
};