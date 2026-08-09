import fs from "fs/promises";
import path from "path";
import { UPLOAD_DIR, OUTPUT_DIR, FILE_TTL_MINUTES } from "./config.js";

/**
 * Privacy sweep: deletes any file in uploads/ or outputs/ older than
 * FILE_TTL_MINUTES. Uploads are normally cleaned up right after a tool runs
 * (see index.js), but this catches anything left behind by a crashed
 * request, an abandoned download, or a killed process.
 */
async function purgeDir(dir, maxAgeMs) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return 0;
  }

  let purged = 0;
  const now = Date.now();
  for (const name of entries) {
    if (name === ".gitkeep") continue;
    const filePath = path.join(dir, name);
    try {
      const stat = await fs.stat(filePath);
      if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(filePath);
        purged++;
      }
    } catch {
      // file vanished between readdir and stat/unlink — fine, ignore
    }
  }
  return purged;
}

export async function purgeOnce() {
  const maxAgeMs = FILE_TTL_MINUTES * 60 * 1000;
  const uploadsPurged = await purgeDir(UPLOAD_DIR, maxAgeMs);
  const outputsPurged = await purgeDir(OUTPUT_DIR, maxAgeMs);
  const total = uploadsPurged + outputsPurged;
  if (total > 0) {
    console.log(`[purge] removed ${total} file(s) older than ${FILE_TTL_MINUTES}m (${uploadsPurged} uploads, ${outputsPurged} outputs)`);
  }
  return total;
}

export function startPurgeSchedule() {
  // Run once at boot, then every 10 minutes.
  purgeOnce().catch((err) => console.error("[purge] failed:", err.message));
  const interval = setInterval(() => {
    purgeOnce().catch((err) => console.error("[purge] failed:", err.message));
  }, 10 * 60 * 1000);
  interval.unref(); // don't keep the process alive just for this timer
  return interval;
}
