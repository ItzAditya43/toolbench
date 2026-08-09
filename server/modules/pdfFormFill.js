import fs from "fs/promises";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

export default {
  id: "pdf-form-fill",
  name: "Fill PDF Form",
  category: "pdf",
  icon: "FileEdit",
  description: "Fill a PDF form's fields from JSON (run Extract PDF Form Fields first to see field names).",
  accepts: ["application/pdf"],

  optionsSchema: [
    { key: "values", label: 'Field values as JSON, e.g. {"Name": "Jane Doe", "Agree": true}', type: "text", placeholder: '{"field1": "value"}' },
    { key: "flatten", label: "Flatten (make fields non-editable)", type: "checkbox", default: false },
  ],

  async run({ filePath, originalName, options }) {
    if (!filePath) throw new Error("No file uploaded");
    if (!options?.values) throw new Error("Missing 'values' option");

    let values;
    try {
      values = JSON.parse(options.values);
    } catch (err) {
      throw new Error(`Invalid JSON in 'values': ${err.message}`);
    }

    const bytes = await fs.readFile(filePath);
    const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
    const form = pdf.getForm();

    const applied = [];
    const skipped = [];
    for (const [name, value] of Object.entries(values)) {
      try {
        const field = form.getField(name);
        if (typeof field.setText === "function") field.setText(String(value));
        else if (typeof field.check === "function") value ? field.check() : field.uncheck();
        else if (typeof field.select === "function") field.select(String(value));
        else skipped.push(name);
        if (!skipped.includes(name)) applied.push(name);
      } catch {
        skipped.push(name);
      }
    }

    const flatten = options?.flatten === true || options?.flatten === "true";
    if (flatten) form.flatten();

    const outBytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    const baseName = path.parse(originalName || "form").name;
    const outputName = `${baseName}-filled.pdf`;
    const outputPath = path.join(OUTPUT_DIR, `${nanoid(8)}-${outputName}`);
    await fs.writeFile(outputPath, outBytes);

    return {
      outputPath,
      outputName,
      mimeType: "application/pdf",
      meta: { applied, skipped, flattened: flatten },
    };
  },
};
