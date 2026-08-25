import { partyLabel } from "@/lib/tbs/partyLabel";

/** Helvetica (WinAnsi) cannot encode ₹, Hindi, smart quotes — those throw in pdf-lib. */
export function pdfWinAnsi(value: unknown): string {
  const raw = partyLabel(value) || (typeof value === "string" ? value : "");
  let out = "";
  for (const ch of raw
    .replace(/₹/g, "Rs.")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u00a0/g, " ")) {
    const code = ch.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13) continue;
    if (code >= 32 && code <= 126) {
      out += ch;
      continue;
    }
    if (code >= 160 && code <= 255) {
      out += ch;
      continue;
    }
  }
  return out.trim();
}
