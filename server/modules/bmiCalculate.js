import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { OUTPUT_DIR } from "../config.js";

function classify(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export default {
  id: "bmi-calculate",
  name: "BMI Calculator",
  category: "utility",
  icon: "Activity",
  description: "Calculate Body Mass Index from height and weight, in metric or imperial units.",
  accepts: ["text"],

  optionsSchema: [
    { key: "units", label: "Units", type: "select", default: "metric", options: ["metric", "imperial"] },
    { key: "weight", label: "Weight (kg or lb)", type: "text", placeholder: "70" },
    { key: "height", label: "Height (cm or inches)", type: "text", placeholder: "175" },
  ],

  async run({ options }) {
    const units = options?.units || "metric";
    const weight = parseFloat(options?.weight);
    const height = parseFloat(options?.height);
    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
      throw new Error("Provide positive numeric 'weight' and 'height'");
    }

    let bmi;
    if (units === "metric") {
      const heightM = height / 100;
      bmi = weight / (heightM * heightM);
    } else {
      bmi = (weight / (height * height)) * 703;
    }
    bmi = Math.round(bmi * 10) / 10;

    const category = classify(bmi);
    const report = `BMI: ${bmi}\nCategory: ${category}`;

    const outputName = `bmi-${nanoid(8)}.txt`;
    const outputPath = path.join(OUTPUT_DIR, outputName);
    await fs.writeFile(outputPath, report, "utf-8");

    return {
      outputPath,
      outputName,
      mimeType: "text/plain",
      meta: { bmi, category, units },
    };
  },
};
