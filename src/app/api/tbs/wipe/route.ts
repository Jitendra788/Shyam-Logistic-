import { failSave, ok, requireAuth } from "@/lib/tbs/api";
import { wipeAllTbsData } from "@/lib/tbs/store";

/** DELETE or POST — clear all parties, bookings, bills, challans, receipts, notes. */
export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    await wipeAllTbsData();
    return ok({
      ok: true,
      message: "All admin TBS data cleared",
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function DELETE() {
  return POST();
}
