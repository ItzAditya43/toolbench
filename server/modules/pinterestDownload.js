import path from "path";
import { execa } from "./_execa.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Pinterest video/image downloader.
 *
 * yt-dlp has a generic extractor that handles Pinterest pin URLs for both
 * images and videos. This module is nearly identical to youtubeDownload.js
 * but simpler — Pinterest pins are single media items, not playlists.
 *
 * Requires yt-dlp on PATH (pip install yt-dlp / brew install yt-dlp).
 */
export default {
  id: "pinterest-download",
  name: "Pinterest Downloader",
  category: "downloader",
  icon: "📌",
  description: "Download a video or image from a Pinterest pin URL.",
  accepts: ["url"],

  optionsSchema: [
    { key: "url", label: "Pinterest pin URL", type: "text", placeholder: "https://pin.it/… or https://pinterest.com/pin/…" },
  ],

  async run({ options }) {
    const { url } = options || {};
    if (!url) throw new Error("Missing 'url' in options");

    const id = nanoid(8);
    const outputTemplate = path.join(OUTPUT_DIR, `${id}-%(title)s.%(ext)s`);

    const args = [
      "-o", outputTemplate,
      "--no-playlist",
      "--print", "after_move:filepath",
      url,
    ];

    const { stdout } = await execa("yt-dlp", args);
    const files = stdout.trim().split("\n").filter(Boolean);

    if (files.length === 0) {
      throw new Error("yt-dlp finished but reported no output file — check the URL/logs.");
    }

    const outputPath = files[0];
    const ext = path.extname(outputPath).toLowerCase();
    const imageExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    const mimeType = imageExts.includes(ext)
      ? `image/${ext.slice(1)}`
      : "video/mp4";

    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType,
      meta: { engine: "yt-dlp", url },
    };
  },
};