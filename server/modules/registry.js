/**
 * Module registry.
 *
 * Every tool in Toolbench is a "module": a small object with metadata + a run() function.
 * Drop a new file in /modules, export a module object, add ONE line in index.js to register it.
 * Nothing else in the app needs to change — routes, uploads, and the frontend socket grid
 * all read from this registry.
 *
 * Shape of a module:
 * {
 *   id: 'pdf-compress',        // used in the API route: POST /api/tools/:id
 *   name: 'Compress PDF',
 *   category: 'pdf',
 *   description: 'Shrinks a PDF while keeping layout and text intact.',
 *   accepts: ['application/pdf'],
 *   run: async ({ filePath, originalName, options }) => {
 *     // do the work, return a result descriptor
 *     return { outputPath, outputName, mimeType, meta };
 *   }
 * }
 */

const modules = new Map();

export function registerModule(mod) {
  if (!mod.id) throw new Error("Module is missing an id");
  if (modules.has(mod.id)) {
    throw new Error(`Module id "${mod.id}" is already registered`);
  }
  modules.set(mod.id, mod);
}

export function getModule(id) {
  return modules.get(id);
}

export function listModules() {
  return Array.from(modules.values()).map(({ run, ...meta }) => meta);
}
