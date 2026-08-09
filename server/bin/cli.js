#!/usr/bin/env node
import path from "path";
import fs from "fs";
import "../registerAll.js";
import { getModule, listModules } from "../modules/registry.js";

function printUsage() {
  console.log(`toolbench CLI — run any tool straight from the terminal, no server required.

Usage:
  toolbench <tool-id> <input-file> [--option value ...] [-o <output-path>]
  toolbench list                     list every available tool id
  toolbench <tool-id> --help         show options for one tool

Examples:
  toolbench pdf-compress report.pdf -o report-small.pdf
  toolbench image-compress photo.jpg --quality 60
  toolbench password-generate --length 24 --count 5
`);
}

function parseArgs(argv) {
  const args = { _: [], options: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-o" || a === "--output") {
      args.output = argv[++i];
    } else if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args.options[key] = true;
      } else {
        args.options[key] = next;
        i++;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    printUsage();
    return;
  }

  if (argv[0] === "list") {
    for (const m of listModules()) console.log(`${m.id.padEnd(24)} ${m.category.padEnd(10)} ${m.description || ""}`);
    return;
  }

  const toolId = argv[0];
  const mod = getModule(toolId);
  if (!mod) {
    console.error(`Unknown tool "${toolId}". Run "toolbench list" to see every available tool id.`);
    process.exit(1);
  }

  if (argv[1] === "--help" || argv[1] === "-h") {
    console.log(`${mod.name} (${mod.id})\n${mod.description}\n`);
    if (mod.optionsSchema?.length) {
      console.log("Options:");
      for (const f of mod.optionsSchema) {
        console.log(`  --${f.key.padEnd(16)} ${f.label}${f.default !== undefined ? ` (default: ${f.default})` : ""}`);
      }
    }
    if (mod.namedFiles) console.log(`Named file inputs: ${mod.namedFiles.join(", ")} (pass as positional args, in order)`);
    if (mod.multiFile) console.log("Accepts multiple input files (pass them all as positional args).");
    return;
  }

  const { _: positional, options, output } = parseArgs(argv.slice(1));

  try {
    let result;

    if (mod.multiFile) {
      const filePaths = positional;
      if (filePaths.length === 0) throw new Error(`${mod.id} needs at least one input file`);
      for (const p of filePaths) assertExists(p);
      result = await mod.run({ filePaths, originalNames: filePaths.map((p) => path.basename(p)), options });
    } else if (mod.namedFiles) {
      if (positional.length < mod.namedFiles.length) {
        throw new Error(`${mod.id} needs ${mod.namedFiles.length} input files, in this order: ${mod.namedFiles.join(", ")}`);
      }
      const files = {};
      mod.namedFiles.forEach((name, i) => {
        assertExists(positional[i]);
        files[name] = { path: positional[i], originalname: path.basename(positional[i]) };
      });
      result = await mod.run({ files, options });
    } else if (mod.accepts?.includes("url") || mod.accepts?.includes("text")) {
      result = await mod.run({ options });
    } else {
      const filePath = positional[0];
      if (!filePath) throw new Error(`${mod.id} needs an input file`);
      assertExists(filePath);
      result = await mod.run({ filePath, originalName: path.basename(filePath), options });
    }

    const dest = output || path.join(process.cwd(), result.outputName);
    fs.copyFileSync(result.outputPath, dest);
    console.log(`✔ ${dest}`);
    if (result.meta) console.log(JSON.stringify(result.meta, null, 2));
  } catch (err) {
    console.error(`✘ ${err.message}`);
    process.exit(1);
  }
}

function assertExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Input file not found: ${filePath}`);
  }
}

main();
