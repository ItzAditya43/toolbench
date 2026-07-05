import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";
import { execa } from "./_execa.js";

/**
 * PDF Protect / Unlock
 *
 * - Protect: encrypt a PDF with a user password using pdf-lib (pure Node).
 * - Unlock: remove password protection using qpdf (external binary).
 *   pdf-lib can't decrypt password-protected PDFs, so qpdf is required for unlock.
 *
 * Dependency for unlock: qpdf (apt install qpdf / brew install qpdf)
 */
export default {
  id: "pdf-protect",
  name: "Protect / Unlock PDF",
  category: "pdf",
  icon: "🔒",
  description: "Add a password to a PDF (protect) or remove password protection (unlock, needs qpdf).",
  accepts: ["application/pdf"],

  optionsSchema: [
    {
      key: "mode",
      label: "Mode",
      type: "select",
      default: "protect",
      options: ["protect", "unlock"],
    },
    { key: "password", label: "Password", type: "text", placeholder: "Enter password" },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    const { mode = "protect", password } = options || {};
    if (!password) throw new Error("Missing 'password' option");

    const baseName = path.parse(originalName || "document").name;

    if (mode === "protect") {
      const bytes = await fs.readFile(filePath);
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      const outBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        userPassword: password,
        ownerPassword: password,
      });

      const outputName = `${baseName}-protected.pdf`;
      const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
      await fs.writeFile(outputPath, outBytes);

      return {
        outputPath,
        outputName,
        mimeType: "application/pdf",
        meta: { mode: "protect" },
      };
    } else {
      // Unlock mode — needs qpdf
      const outputName = `${baseName}-unlocked.pdf`;
      const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);

      try {
        await execa("qpdf", [
          "--password=" + password,
          "--decrypt",
          filePath,
          outputPath,
        ]);
      } catch (err) {
        throw new Error(
          "PDF unlock needs 'qpdf' installed locally. " +
            "Install it with: apt install qpdf (Linux) or brew install qpdf (macOS). " +
            "If qpdf is installed, the password may be wrong. " +
            "Original error: " + err.message
        );
      }

      return {
        outputPath,
        outputName,
        mimeType: "application/pdf",
        meta: { mode: "unlock" },
      };
    }
  },
};