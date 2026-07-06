import path from "path";
import { execa } from "./_execa.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "youtube-download",
  name: "YouTube Downloader",
  category: "downloader",
  icon: "Youtube",
  description: "Download a YouTube video or playlist, pick quality, or pull audio only.",
  accepts: ["url"],

  // Drives the dynamic option fields in the frontend's RunPanel.
  optionsSchema: [
    { key: "url", label: "YouTube URL", type: "text", placeholder: "https://youtube.com/watch?v=…" },
    {
      key: "quality",
      label: "Quality",
      type: "select",
      default: "1080",
      options: ["2160", "1440", "1080", "720", "480", "audio-only"],
    },
    { key: "playlist", label: "Download entire playlist", type: "checkbox", default: false },
  ],

  /**
   * Requires yt-dlp on PATH (pip install yt-dlp / brew install yt-dlp).
   * yt-dlp natively handles quality selection, playlists, and audio extraction —
   * we just build the right flags rather than reimplementing any of that.
   */
  async run({ options }) {
    const { url, quality = "1080", playlist = false } = options || {};
    if (!url) throw new Error("Missing 'url' in options");

    const id = nanoid(8);
    const isPlaylist = playlist === true || playlist === "true";
    const audioOnly = quality === "audio-only";

    const outputTemplate = isPlaylist
      ? path.join(OUTPUT_DIR, `${id}-%(playlist_index)s-%(title)s.%(ext)s`)
      : path.join(OUTPUT_DIR, `${id}-%(title)s.%(ext)s`);

    const args = [
      "-o", outputTemplate,
      isPlaylist ? "--yes-playlist" : "--no-playlist",
    ];

    if (audioOnly) {
      args.push("-x", "--audio-format", "mp3");
    } else {
      // cap to the requested height, fall back gracefully if that exact height isn't available
      args.push("-f", `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`);
      args.push("--merge-output-format", "mp4");
    }

    // --print gives us the resolved final filename(s) instead of guessing from the template
    args.push("--print", "after_move:filepath");
    args.push(url);

    const { stdout } = await execa("yt-dlp", args);
    const files = stdout.trim().split("\n").filter(Boolean);

    if (files.length === 0) {
      throw new Error("yt-dlp finished but reported no output file — check the URL/logs.");
    }

    // Single-file result for the standard run() contract. For playlists, all files
    // land in OUTPUT_DIR with a shared id prefix — a future "batch download" zip
    // step could tar/zip everything matching `${id}-*` here.
    const outputPath = files[0];
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: audioOnly ? "audio/mpeg" : "video/mp4",
      meta: {
        engine: "yt-dlp",
        quality,
        playlist: isPlaylist,
        fileCount: files.length,
        additionalFiles: files.slice(1).map((f) => path.basename(f)),
      },
    };
  },
};
