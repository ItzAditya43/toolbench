import path from "path";
import { execa } from "./_execa.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

/**
 * Spotify Downloader using spotdl (https://github.com/spotDL/spotify-downloader).
 *
 * spotdl does NOT download from Spotify's CDN — Spotify streams are DRM-protected.
 * Instead, spotdl:
 *  1. Reads track/album/playlist metadata from Spotify's API
 *  2. Finds a matching track on YouTube/YouTube Music
 *  3. Downloads and tags the audio file with Spotify's metadata
 *
 * Requires:
 *  - Python 3 + pip install spotdl
 *  - ffmpeg on PATH (already a project dependency for audio/video tools)
 *  - (Optional) SPOTIPY_CLIENT_ID / SPOTIPY_CLIENT_SECRET env vars if spotdl's
 *    built-in anonymous client gets rate-limited. spotdl bundles a default client
 *    that works for light usage — most people won't need to set these.
 *
 * spotdl auto-detects whether a URL is a track, playlist, or album, so there's
 * no need for an explicit mode/type option — fewer redundant fields = better UX.
 */
export default {
  id: "spotify-download",
  name: "Spotify Downloader",
  category: "downloader",
  icon: "Music",
  description:
    "Finds and downloads the matching audio for a Spotify track or playlist, tagged with Spotify's metadata.",
  accepts: ["url"],

  optionsSchema: [
    {
      key: "url",
      label: "Spotify URL",
      type: "text",
      placeholder:
        "https://open.spotify.com/track/… or playlist/album link",
    },
  ],

  async run({ options }) {
    const { url } = options || {};
    if (!url) throw new Error("Missing 'url' in options");

    const id = nanoid(8);
    const outputTemplate = path.join(OUTPUT_DIR, `${id}-{title}.{output-ext}`);

    const args = [
      "download",
      url,
      "--output",
      outputTemplate,
    ];

    let stdout, stderr;
    try {
      const result = await execa("spotdl", args);
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err) {
      // spotdl may print progress to stderr and exit 0, but sometimes returns
      // output paths on stdout. If execa threw, check stderr for a useful message.
      throw new Error(
        "spotdl failed. Make sure it's installed (pip install spotdl) and ffmpeg is on PATH. " +
          "If you're hitting Spotify API rate limits, set SPOTIPY_CLIENT_ID / SPOTIPY_CLIENT_SECRET " +
          "environment variables. Original error: " +
          (err.message || stderr || "unknown error")
      );
    }

    // spotdl prints the output file path(s) to stdout on success, one per line.
    // Example output:
    //   /path/to/outputs/abc123-Track Name.mp3
    const files = (stdout || "")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((f) => f.trim());

    // If stdout was empty, spotdl may have written to stderr instead.
    // Fall back: try to find files matching our id prefix.
    if (files.length === 0) {
      const fs = await import("fs/promises");
      const dirContents = await fs.readdir(OUTPUT_DIR);
      const matched = dirContents
        .filter((f) => f.startsWith(id))
        .sort()
        .map((f) => path.join(OUTPUT_DIR, f));

      if (matched.length > 0) {
        const outputPath = matched[0];
        return {
          outputPath,
          outputName: path.basename(outputPath),
          mimeType: "audio/mpeg",
          meta: {
            engine: "spotdl",
            fileCount: matched.length,
            additionalFiles: matched.slice(1).map((f) => path.basename(f)),
          },
        };
      }

      throw new Error(
        "spotdl finished but reported no output file. Check the URL and try again."
      );
    }

    const outputPath = files[0];
    return {
      outputPath,
      outputName: path.basename(outputPath),
      mimeType: "audio/mpeg",
      meta: {
        engine: "spotdl",
        fileCount: files.length,
        additionalFiles: files.slice(1).map((f) => path.basename(f)),
      },
    };
  },
};