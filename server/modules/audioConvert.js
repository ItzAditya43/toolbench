import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

const CODECS = {
  mp3: "libmp3lame",
  wav: "pcm_s16le",
  flac: "flac",
  ogg: "libvorbis",
  aac: "aac",
};

export default {
  id: "audio-convert",
  name: "Convert Audio",
  category: "audio",
  icon: "◈",
  description: "Convert between audio formats — MP3, WAV, FLAC, OGG, AAC.",
  accepts: ["audio/mpeg", "audio/wav", "audio/flac", "audio/ogg", "audio/aac", "audio/x-m4a"],

  optionsSchema: [
    { key: "format", label: "Output format", type: "select", default: "mp3", options: Object.keys(CODECS) },
  ],

  async run({ filePath, originalName, options }) {
    const format = options?.format || "mp3";
    const codec = CODECS[format];
    if (!codec) throw new Error(`Unsupported format "${format}"`);

    const outputName = `${path.parse(originalName).name}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .audioCodec(codec)
        .on("end", resolve)
        .on("error", reject)
        .save(outputPath);
    });

    return { outputPath, outputName, mimeType: `audio/${format}`, meta: { format } };
  },
};
