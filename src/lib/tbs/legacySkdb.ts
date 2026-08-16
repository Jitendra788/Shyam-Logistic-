/** Old desktop `skdb` (JJ.sql) field rules used by Booking / Part Challan / LHP. */
export function oldDash(value: string | undefined | null) {
  const s = String(value || "").trim();
  if (!s || s === "-" || s === "—" || s === "–") return "-";
  return s;
}

export function lrFreeForChallan(
  lrId: string,
  challans: { id: string; lrIds?: string[] }[],
  currentChallanId: string,
) {
  return !challans.some(
    (c) => c.id !== currentChallanId && (c.lrIds || []).includes(lrId),
  );
}

export function applyVehicleToLrs<T extends { id: string; vehicleNo?: string }>(
  bookings: T[],
  lrIds: string[],
  vehicleNo: string,
) {
  const veh = vehicleNo.trim().toUpperCase();
  if (!veh || !lrIds.length) return { bookings, changed: false };
  let changed = false;
  const next = bookings.map((b) => {
    if (!lrIds.includes(b.id) || b.vehicleNo === veh) return b;
    changed = true;
    return { ...b, vehicleNo: veh };
  });
  return { bookings: next, changed };
}
