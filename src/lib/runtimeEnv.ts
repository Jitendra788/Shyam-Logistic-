import { readFileSync } from "node:fs";

function strip(value: string) {
  const v = value.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

let procMap: Record<string, string> | undefined;

/** Real process env on Linux (Vercel). Next/Turbopack cannot inline this. */
function fromProc(name: string): string {
  if (!procMap) {
    procMap = {};
    try {
      const raw = readFileSync("/proc/self/environ", "utf8");
      for (const part of raw.split("\0")) {
        if (!part) continue;
        const i = part.indexOf("=");
        if (i < 1) continue;
        procMap[part.slice(0, i)] = part.slice(i + 1);
      }
    } catch {
      procMap = {};
    }
  }
  return strip(procMap[name] || "");
}

/** Env that Next may rewrite; used locally and as fallback. */
function fromProcess(name: string): string {
  try {
    const a = globalThis.process?.env?.[name];
    if (typeof a === "string" && strip(a)) return strip(a);
  } catch {
    /* ignore */
  }
  try {
    const b = process.env[name];
    if (typeof b === "string" && strip(b)) return strip(b);
  } catch {
    /* ignore */
  }
  return "";
}

export function runtimeEnv(name: string): string {
  return fromProc(name) || fromProcess(name);
}
