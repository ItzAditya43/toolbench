// Client-side "instant" tools — pure logic ported from the equivalent server
// modules, run entirely in the browser (Web Crypto for hashing) so these
// never touch the network: they work offline and return results immediately.
// Mirrors server/modules/{jsonFormat,base64Convert,urlConvert,hashGenerate,
// uuidGenerate,loremIpsumGenerate,wordCounter,regexTester,passwordGenerate,
// unitConvert,bmiCalculate}.js — keep both in sync if the logic changes.

export const INSTANT_TOOL_IDS = new Set([
  "json-format",
  "base64-convert",
  "url-convert",
  "hash-generate",
  "uuid-generate",
  "lorem-ipsum-generate",
  "word-counter",
  "regex-tester",
  "password-generate",
  "unit-convert",
  "bmi-calculate",
]);

function textResult(text, outputName, meta) {
  return { text, outputName, mimeType: "text/plain", meta };
}

// --- MD5 (Web Crypto has no MD5 digest, so a small pure-JS implementation) ---
function md5(str) {
  const rl = (n, c) => (n << c) | (n >>> (32 - c));
  const K = Array.from({ length: 64 }, (_, i) => (Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32)) | 0);
  const S = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];

  const msg = unescape(encodeURIComponent(str));
  const bytes = [];
  for (let i = 0; i < msg.length; i++) bytes.push(msg.charCodeAt(i));
  const origLenBits = bytes.length * 8;
  bytes.push(0x80);
  while (bytes.length % 64 !== 56) bytes.push(0);
  for (let i = 0; i < 8; i++) bytes.push((origLenBits / Math.pow(2, i * 8)) & 0xff);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunk = 0; chunk < bytes.length; chunk += 64) {
    const M = [];
    for (let i = 0; i < 16; i++) {
      M[i] = bytes[chunk + i * 4] | (bytes[chunk + i * 4 + 1] << 8) | (bytes[chunk + i * 4 + 2] << 16) | (bytes[chunk + i * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      B = (B + rl(F, S[i])) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }

  const toHex = (n) => {
    let hex = "";
    for (let i = 0; i < 4; i++) hex += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, "0");
    return hex;
  };
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

async function shaDigest(algorithm, text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algorithm, enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// --- generators shared with server logic ---
const WORDS = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor " +
  "incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis " +
  "nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat " +
  "duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu " +
  "fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in " +
  "culpa qui officia deserunt mollit anim id est laborum").split(" ");
const randWord = () => WORDS[Math.floor(Math.random() * WORDS.length)];
const sentence = () => {
  const n = 6 + Math.floor(Math.random() * 8);
  const s = Array.from({ length: n }, randWord).join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
};
const paragraph = () => Array.from({ length: 5 }, sentence).join(" ");

const LENGTH = { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 };
const WEIGHT = { kg: 1, g: 0.001, mg: 0.000001, lb: 0.45359237, oz: 0.028349523125, ton: 1000 };
const VOLUME = { l: 1, ml: 0.001, gal: 3.785411784, qt: 0.946352946, cup: 0.2365882365, floz: 0.0295735295625 };

function convertLinear(table, value, from, to) {
  if (!(from in table) || !(to in table)) throw new Error(`Unknown unit "${!(from in table) ? from : to}"`);
  return (value * table[from]) / table[to];
}
function convertTemperature(value, from, to) {
  let c;
  if (from === "c") c = value;
  else if (from === "f") c = (value - 32) * (5 / 9);
  else if (from === "k") c = value - 273.15;
  else throw new Error(`Unknown temperature unit "${from}"`);
  if (to === "c") return c;
  if (to === "f") return c * (9 / 5) + 32;
  if (to === "k") return c + 273.15;
  throw new Error(`Unknown temperature unit "${to}"`);
}

const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.<>?" };
function randomChar(charset) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return charset[arr[0] % charset.length];
}

export async function runClientTool(id, options) {
  switch (id) {
    case "json-format": {
      const { text, mode = "pretty", indent = "2" } = options;
      if (!text) throw new Error("Missing 'text' option");
      let parsed;
      try { parsed = JSON.parse(text); } catch (err) { throw new Error(`Invalid JSON: ${err.message}`); }
      const result = mode === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, parseInt(indent, 10) || 2);
      return textResult(result, `formatted-${Date.now()}.json`, { mode, valid: true });
    }

    case "base64-convert": {
      const { text, mode = "encode" } = options;
      if (!text) throw new Error("Missing 'text' option");
      const result = mode === "encode" ? btoa(unescape(encodeURIComponent(text))) : decodeURIComponent(escape(atob(text)));
      return textResult(result, `base64-${mode}-${Date.now()}.txt`, { mode });
    }

    case "url-convert": {
      const { text, mode = "encode" } = options;
      if (!text) throw new Error("Missing 'text' option");
      const result = mode === "encode" ? encodeURIComponent(text) : decodeURIComponent(text);
      return textResult(result, `url-${mode}-${Date.now()}.txt`, { mode });
    }

    case "hash-generate": {
      const { text, algorithm = "sha256" } = options;
      if (!text) throw new Error("Missing 'text' option");
      const algoMap = { sha1: "SHA-1", sha256: "SHA-256", sha512: "SHA-512" };
      const hash = algorithm === "md5" ? md5(text) : await shaDigest(algoMap[algorithm] || "SHA-256", text);
      return textResult(hash, `${algorithm}-${Date.now()}.txt`, { algorithm, hash });
    }

    case "uuid-generate": {
      const count = Math.max(1, Math.min(1000, parseInt(options.count || "1", 10) || 1));
      const uuids = Array.from({ length: count }, () => crypto.randomUUID());
      return textResult(uuids.join("\n"), `uuids-${Date.now()}.txt`, { count, first: uuids[0] });
    }

    case "lorem-ipsum-generate": {
      const { unit = "paragraphs", count = "3" } = options;
      const n = Math.max(1, Math.min(500, parseInt(count, 10) || 3));
      let result;
      if (unit === "words") result = Array.from({ length: n }, randWord).join(" ");
      else if (unit === "sentences") result = Array.from({ length: n }, sentence).join(" ");
      else result = Array.from({ length: n }, paragraph).join("\n\n");
      return textResult(result, `lorem-ipsum-${Date.now()}.txt`, { unit, count: n });
    }

    case "word-counter": {
      const { text } = options;
      if (!text) throw new Error("Missing 'text' option");
      const words = (text.trim().match(/\S+/g) || []).length;
      const characters = text.length;
      const charactersNoSpaces = text.replace(/\s/g, "").length;
      const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
      const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
      const readingTimeMin = Math.max(1, Math.round(words / 200));
      const stats = { words, characters, charactersNoSpaces, sentences, paragraphs, readingTimeMin };
      return textResult(Object.entries(stats).map(([k, v]) => `${k}: ${v}`).join("\n"), `word-count-${Date.now()}.txt`, stats);
    }

    case "regex-tester": {
      const { text, pattern, flags = "g" } = options;
      if (!text) throw new Error("Missing 'text' option");
      if (!pattern) throw new Error("Missing 'pattern' option");
      let re;
      try { re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g"); } catch (err) { throw new Error(`Invalid regex: ${err.message}`); }
      const matches = [];
      let m;
      while ((m = re.exec(text)) !== null) {
        matches.push({ match: m[0], index: m.index, groups: m.slice(1) });
        if (m[0] === "") re.lastIndex++;
      }
      const report = matches.length
        ? matches.map((mm, i) => `#${i + 1} @${mm.index}: "${mm.match}"${mm.groups.length ? ` groups=${JSON.stringify(mm.groups)}` : ""}`).join("\n")
        : "No matches.";
      return textResult(report, `regex-matches-${Date.now()}.txt`, { pattern, flags, matchCount: matches.length });
    }

    case "password-generate": {
      const length = Math.max(4, Math.min(256, parseInt(options.length || "16", 10) || 16));
      const count = Math.max(1, Math.min(100, parseInt(options.count || "1", 10) || 1));
      let charset = SETS.lower;
      if (options.upper !== false && options.upper !== "false") charset += SETS.upper;
      if (options.digits !== false && options.digits !== "false") charset += SETS.digits;
      if (options.symbols !== false && options.symbols !== "false") charset += SETS.symbols;
      const passwords = Array.from({ length: count }, () => Array.from({ length }, () => randomChar(charset)).join(""));
      return textResult(passwords.join("\n"), `passwords-${Date.now()}.txt`, { length, count });
    }

    case "unit-convert": {
      const { category = "length", value = "1", from, to } = options;
      const v = parseFloat(value);
      const f = (from || "").trim().toLowerCase();
      const t = (to || "").trim().toLowerCase();
      if (isNaN(v)) throw new Error("Invalid 'value'");
      if (!f || !t) throw new Error("Both 'from' and 'to' units are required");
      let result;
      if (category === "length") result = convertLinear(LENGTH, v, f, t);
      else if (category === "weight") result = convertLinear(WEIGHT, v, f, t);
      else if (category === "volume") result = convertLinear(VOLUME, v, f, t);
      else if (category === "temperature") result = convertTemperature(v, f, t);
      else throw new Error(`Unknown category "${category}"`);
      const rounded = Math.round(result * 1e6) / 1e6;
      return textResult(`${v} ${f} = ${rounded} ${t}`, `unit-convert-${Date.now()}.txt`, { category, value: v, from: f, to: t, result: rounded });
    }

    case "bmi-calculate": {
      const { units = "metric", weight, height } = options;
      const w = parseFloat(weight);
      const h = parseFloat(height);
      if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) throw new Error("Provide positive numeric 'weight' and 'height'");
      let bmi = units === "metric" ? w / ((h / 100) * (h / 100)) : (w / (h * h)) * 703;
      bmi = Math.round(bmi * 10) / 10;
      const category = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obese";
      return textResult(`BMI: ${bmi}\nCategory: ${category}`, `bmi-${Date.now()}.txt`, { bmi, category, units });
    }

    default:
      throw new Error(`"${id}" is not a client-side tool`);
  }
}
