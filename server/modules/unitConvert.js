import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

// Conversion factors to a base unit per dimension.
const LENGTH = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 };
const WEIGHT = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, ton: 1000 };
const VOLUME = { l: 1, ml: 0.001, gal: 3.785411784, qt: 0.946352946, cup: 0.2365882365, floz: 0.0295735295625 };

function convertLinear(table, value, from, to) {
  if (!(from in table) || !(to in table)) throw new Error(`Unknown unit "${!(from in table) ? from : to}"`);
  return (value * table[from]) / table[to];
}

function convertTemperature(value, from, to) {
  let celsius;
  if (from === "c") celsius = value;
  else if (from === "f") celsius = (value - 32) * (5 / 9);
  else if (from === "k") celsius = value - 273.15;
  else throw new Error(`Unknown temperature unit "${from}"`);

  if (to === "c") return celsius;
  if (to === "f") return celsius * (9 / 5) + 32;
  if (to === "k") return celsius + 273.15;
  throw new Error(`Unknown temperature unit "${to}"`);
}

export default {
  id: "unit-convert",
  name: "Unit Converter",
  category: "utility",
  icon: "ArrowLeftRight",
  description: "Convert between units of length, weight, volume, and temperature.",
  accepts: ["text"],

  optionsSchema: [
    { key: "category", label: "Category", type: "select", default: "length", options: ["length", "weight", "volume", "temperature"] },
    { key: "value", label: "Value", type: "text", default: "1" },
    { key: "from", label: "From unit", type: "text", placeholder: "m, km, kg, lb, c, f…" },
    { key: "to", label: "To unit", type: "text", placeholder: "ft, mi, g, oz, k…" },
  ],

  async run({ options }) {
    const category = options?.category || "length";
    const value = parseFloat(options?.value ?? "1");
    const from = (options?.from || "").trim().toLowerCase();
    const to = (options?.to || "").trim().toLowerCase();
    if (isNaN(value)) throw new Error("Invalid 'value'");
    if (!from || !to) throw new Error("Both 'from' and 'to' units are required");

    let result;
    if (category === "length") result = convertLinear(LENGTH, value, from, to);
    else if (category === "weight") result = convertLinear(WEIGHT, value, from, to);
    else if (category === "volume") result = convertLinear(VOLUME, value, from, to);
    else if (category === "temperature") result = convertTemperature(value, from, to);
    else throw new Error(`Unknown category "${category}"`);

    const rounded = Math.round(result * 1e6) / 1e6;
    const report = `${value} ${from} = ${rounded} ${to}`;

    const outputName = `unit-convert-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, report, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { category, value, from, to, result: rounded },
    };
  },
};
