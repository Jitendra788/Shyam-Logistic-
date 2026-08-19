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
