/** Next sequential document number from existing rows (max + 1). */
function toDocNum(v: unknown): number {
  const s = String(v ?? "").trim();
  const m = s.match(/(\d+)\s*$/);
  const n = m ? Number(m[1]) : Number(s);
  return Number.isFinite(n) && n > 0 ? n : NaN;
}

export function nextCode(
  items: Record<string, unknown>[],
  key: string,
  start = 1,
) {
  const nums = items.map((i) => toDocNum(i[key])).filter((n) => Number.isFinite(n) && n > 0);
  const max = nums.length ? Math.max(...nums) : start - 1;
  return String(max + 1);
}

function usedNumbers(items: Record<string, unknown>[], key: string) {
  return new Set(
    items.map((i) => toDocNum(i[key])).filter((n) => Number.isFinite(n) && n > 0),
  );
}

/** First free number (reuses a deleted challan / bill no). */
export function nextAvailableCode(
  items: Record<string, unknown>[],
  key: string,
  start = 1,
) {
  const used = usedNumbers(items, key);
  let n = start;
  while (used.has(n)) n += 1;
  return String(n);
}

/** Keep the number shown on the form if it is still free. */
export function unusedOrNext(
  items: Record<string, unknown>[],
  key: string,
  requested: string | undefined,
  start = 1,
) {
  const n = Number(requested);
  const used = usedNumbers(items, key);
  if (Number.isFinite(n) && n > 0 && !used.has(n)) return String(n);
  return nextAvailableCode(items, key, start);
}

export function sameDocNo(a: unknown, b: unknown) {
  const x = String(a ?? "").trim();
  const y = String(b ?? "").trim();
  if (!x || !y) return false;
  if (x.toLowerCase() === y.toLowerCase()) return true;
  const nx = toDocNum(x);
  const ny = toDocNum(y);
  return Number.isFinite(nx) && Number.isFinite(ny) && nx === ny;
}

export function findDupByNo<T extends { id?: string }>(
  items: T[],
  key: keyof T,
  value: string,
  exceptId?: string,
) {
  const v = String(value || "").trim();
  if (!v) return undefined;
  return items.find((row) => row.id !== exceptId && sameDocNo(row[key], v));
}

export function duplicateDocMessage(label: string, value: string) {
  return `${label} ${value} already saved hai. Same ${label} se duplicate save nahi ho sakta. Please unique / naya ${label} enter karein, phir Save dabao.`;
}
