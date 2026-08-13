"use client";

/** Open print page in new tab (auto-print optional). */
export function openPrint(
  type:
    | "booking"
    | "challan"
    | "bill"
    | "mr"
    | "party"
    | "note"
    | "lhp"
    | "lhp-list"
    | "parties"
    | "bookings"
    | "challans"
    | "bills"
    | "mrs",
  id?: string,
  opts?: { auto?: boolean; noteType?: string },
) {
  const q = new URLSearchParams();
  q.set("type", type);
  if (id) q.set("id", id);
  if (opts?.noteType) q.set("noteType", opts.noteType);
  if (opts?.auto !== false) q.set("auto", "1");
  window.open(`/admin/print?${q.toString()}`, "_blank", "noopener,noreferrer");
}

export function needSelectAlert(label = "record") {
  alert(`Print ke liye pehle list se ${label} select karo, phir Print dabao.`);
}
