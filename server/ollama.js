import fetch from "node-fetch";
import { OLLAMA_HOST, OLLAMA_MODEL } from "./config.js";

/**
 * Thin wrapper around Ollama's /api/generate.
 * Ollama is optional and local — nothing here talks to an external AI provider.
 * If Ollama isn't running, callers get a clear error and can fall back to
 * non-AI behavior (see routes.js: name suggestions fail soft).
 */
export async function ollamaGenerate(prompt, { model = OLLAMA_MODEL, json = false } = {}) {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      format: json ? "json" : undefined,
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.response?.trim();
}

/** Suggests a clean output filename from context. Used after a tool run. */
export async function suggestOutputName({ toolId, originalName }) {
  const prompt =
    `You rename files after they've been processed by a tool called "${toolId}". ` +
    `Original filename: "${originalName}". ` +
    `Reply with ONLY a short, clean filename (no extension explanation, no quotes, no commentary), ` +
    `keeping the original extension.`;
  return ollamaGenerate(prompt);
}

/** Maps a free-text instruction to a registered tool id + options. */
export async function routeIntent(instruction, availableTools) {
  const toolList = availableTools.map((t) => `${t.id}: ${t.description}`).join("\n");
  const prompt =
    `Available tools:\n${toolList}\n\n` +
    `User instruction: "${instruction}"\n\n` +
    `Reply with ONLY strict JSON: {"toolId": "<id or null>", "options": {}}`;
  const raw = await ollamaGenerate(prompt, { json: true });
  try {
    return JSON.parse(raw);
  } catch {
    return { toolId: null, options: {} };
  }
}
