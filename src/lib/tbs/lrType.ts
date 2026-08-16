/** Canonical LR payment types from the desktop booking form. */
export const LR_TYPES = ["Paid", "ToPay", "TBB", "Cancel"] as const;

export function normalizeLrType(raw: string): string {
  const compact = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!compact) return "";
  if (compact === "paid") return "Paid";
  if (compact === "topay") return "ToPay";
  if (compact === "tbb" || compact === "tobebilled") return "TBB";
  if (compact === "cancel" || compact === "cancelled" || compact === "canceled") {
    return "Cancel";
  }
  return String(raw).trim();
}

/** TBB / ToPay wait on Frm_Bill — same as `rem1='TBB' or rem1='ToPay'`. */
export function needsPartyBill(lrType: string): boolean {
  const n = normalizeLrType(lrType);
  return n === "TBB" || n === "ToPay";
}

/** Paid is already collected; Cancel is void — neither waits on Frm_Bill. */
export function lrCountsAsBilled(lrType: string, hasBill: boolean): boolean {
  if (hasBill) return true;
  const n = normalizeLrType(lrType);
  return n === "Paid" || n === "Cancel";
}
