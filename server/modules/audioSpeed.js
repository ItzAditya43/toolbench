import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "audio-speed",
  name: "Change Speed / Pitch",
  category: "audio",
  icon: "Gauge",
  description: "Change playback speed (without pitch shift) or pitch (without speed change) of an audio file.",
  accepts: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/aac"],

  optionsSchema: [
    {
      key: "mode",
      label: "Mode",
      type: "select",
      default: "speed",
      options: ["speed", "pitch"],
    },
    {
      key: "factor",
      label: "Factor (0.5 – 2.0)",
      type: "text",
      placeholder: "1.5",
      default: "1.5",
    },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const mode = options?.mode || "speed";
    const factor = parseFloat(options?.factor || "1.5");
    if (factor < 0.5 || factor > 2.0) {
      throw new Error("Factor must be between 0.5 and 2.0");
    }

    const ext = path.extname(originalName) || ".mp3";
    const suffix = mode === "speed" ? `speed-${factor}x` : `pitch-${factor}x`;
    const outputName = `${suffix}-${path.parse(originalName).name}${ext}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      let cmd = ffmpeg(filePath);

      if (mode === "speed") {
        // atempo changes speed without pitch shift; chain two for >2x
        const filter = factor <= 2.0
          ? `atempo=${factor}`
          : `atempo=2.0,atempo=${factor / 2.0}`;
        cmd = cmd.audioFilter(filter);
      } else {
        // asetrate changes sample rate (pitch shift), aresample corrects playback rate
        cmd = cmd.audioFilter(`asetrate=44100*${factor},aresample=44100`);
      }

      cmd
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return {
      outputPath,
      outputName,
      mimeType: "audio/mpeg",
      meta: { mode, factor },
    };
  },
};