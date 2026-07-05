import { spawn } from "child_process";

/**
 * Minimal promise wrapper around child_process.spawn so modules can shell out
 * to CLIs (ffmpeg, rembg, yt-dlp, ghostscript, ...) without adding a dependency.
 */
export function execa(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      // ENOENT etc — command not found / not installed
      reject(err);
    });

    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}
