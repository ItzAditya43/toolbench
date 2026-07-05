import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "mp4-to-mp3",
  name: "MP4 → MP3",
  category: "audio",
  icon: "♪",
  description: "Extract the audio track from a video file as an MP3.",
  accepts: ["video/mp4", "video/webm", "video/quicktime"],

  // Requires ffmpeg on PATH (apt install ffmpeg / brew install ffmpeg).
  async run({ filePath, originalName }) {
    const outputName = `${path.parse(originalName).name}.mp3`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioBitrate(192)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "audio/mpeg",
      meta: { bitrate: "192kbps" },
    };
  },
};
