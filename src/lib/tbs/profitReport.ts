import type { Booking, Challan, NoteVoucher } from "@/lib/tbs/types";

export type ProfitRow = {
  sr: number;
  id: string;
  vehNo: string;
  date: string;
  freight: number;
  bookingAmt: number;
  difference: number;
  marginPct: number;
};

export type ProfitTotals = {
  freight: number;
  expense: number;
  bookingAmt: number;
  difference: number;
  profitPct: number;
};

function inRange(date: string, from: string, to: string) {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function bookingAmtOf(b: Booking) {
  return Number(b.grandTotal || b.total || b.freight || 0);
}

function marginOf(difference: number, bookingAmt: number) {
  return bookingAmt > 0 ? Math.round((difference / bookingAmt) * 10000) / 100 : 0;
}

/** Same as desktop Frm_ProfitReport: challans in date range, LR grandtotal by challan id. */
export function buildProfitReport(
  challans: Challan[],
  bookings: Booking[],
  notes: NoteVoucher[] = [],
  from = "",
  to = "",
): { rows: ProfitRow[]; totals: ProfitTotals } {
  const bookingById = new Map(bookings.map((b) => [b.id, b]));
  const rows: Omit<ProfitRow, "sr">[] = [];

  for (const c of challans.filter((x) => inRange(x.challanDate, from, to))) {
    const linked = (c.lrIds || [])
      .map((id) => bookingById.get(id))
      .filter((b): b is Booking => Boolean(b));
    const freight = Number(c.freight || 0);
    const bookingAmt = linked.reduce((s, b) => s + bookingAmtOf(b), 0);
    const difference = bookingAmt - freight;
    rows.push({
      id: c.id,
      vehNo: c.vehicleNo || "",
      date: c.challanDate,
      freight,
      bookingAmt,
      difference,
      marginPct: marginOf(difference, bookingAmt),
    });
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.vehNo.localeCompare(b.vehNo));
  const numbered = rows.map((r, i) => ({ sr: i + 1, ...r }));

  const freight = numbered.reduce((s, r) => s + r.freight, 0);
  const bookingAmt = numbered.reduce((s, r) => s + r.bookingAmt, 0);
  const expense = notes
    .filter((n) => n.type === "expense" && inRange(n.date, from, to))
    .reduce((s, n) => s + Number(n.amount || 0), 0);
  const difference = bookingAmt - freight - expense;

  return {
    rows: numbered,
    totals: {
      freight,
      expense,
      bookingAmt,
      difference,
      profitPct: marginOf(difference, bookingAmt),
    },
  };
}
