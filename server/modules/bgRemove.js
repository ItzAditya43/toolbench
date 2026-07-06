import path from "path";
import { execa } from "./_execa.js";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "bg-remove",
  name: "Remove Background",
  category: "image",
  icon: "ImageMinus",
  description: "Isolate the subject of an image and drop the background to transparent.",
  accepts: ["image/png", "image/jpeg", "image/webp"],

  /**
   * Real background removal needs a model, not just image math — this shells out
   * to `rembg` (pip install rembg), which runs entirely on your machine (CPU or GPU).
   * If rembg isn't installed, this throws a clear setup error instead of pretending
   * to work. Swap the command below for any other local model/CLI with the same shape.
   */
  async run({ filePath, originalName }) {
    const outputName = `nobg-${path.parse(originalName).name}.png`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

    try {
      await execa("rembg", ["i", filePath, outputPath]);
    } catch (err) {
      throw new Error(
        "Background removal needs the 'rembg' CLI installed locally " +
          "(pip install rembg). Original error: " +
          err.message
      );
    }

    return {
      outputPath,
      outputName,
      mimeType: "image/png",
      meta: { engine: "rembg (local)" },
    };
  },
};
