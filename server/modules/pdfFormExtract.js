import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-form-extract",
  name: "Extract PDF Form Fields",
  category: "pdf",
  icon: "ListChecks",
  description: "List every fillable field in a PDF form (name, type, current value) as JSON.",
  accepts: ["application/pdf"],

  async run({ filePath, originalName }) {
    if (!filePath) throw new Error("No file uploaded");
    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const form = pdf.getForm();
    const fields = form.getFields().map((f) => {
      const type = f.constructor.name;
      let value;
      try {
        if (typeof f.getText === "function") value = f.getText();
        else if (typeof f.isChecked === "function") value = f.isChecked();
        else if (typeof f.getSelected === "function") value = f.getSelected();
      } catch {
        value = null;
      }
      return { name: f.getName(), type, value: value ?? null };
    });

    if (fields.length === 0) throw new Error("This PDF has no fillable form fields.");

    const outputName = `${path.parse(originalName || "form").name}-fields.json`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, JSON.stringify(fields, null, 2), "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "application/json",
      meta: { fieldCount: fields.length },
    };
  },
};
