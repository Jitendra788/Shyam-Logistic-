import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getLhpPayments,
  getMasters,
  getMoneyReceipts,
  getNotes,
  getParties,
  saveBills,
  saveBookings,
  saveChallans,
  saveLhpPayments,
  saveMasters,
  saveMoneyReceipts,
  saveNotes,
  saveParties,
  defaultMasters,
} from "@/lib/tbs/store";
import type {
  Bill,
  Booking,
  Challan,
  LhpPayment,
  Masters,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";

function mergeRows<T extends { id: string }>(current: T[], incoming: T[]) {
  if (!incoming.length) return current;
  const map = new Map(current.map((row) => [row.id, row]));
  for (const row of incoming) {
    if (!row?.id) continue;
    if (!map.has(row.id)) map.set(row.id, row);
  }
  return [...map.values()];
}

function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const imported: string[] = [];

    const partiesIn = asRows<Party>(body.parties);
    if (partiesIn.length) {
      await saveParties(mergeRows(await getParties(), partiesIn));
      imported.push("parties");
    }
    const bookingsIn = asRows<Booking>(body.bookings);
    if (bookingsIn.length) {
      await saveBookings(mergeRows(await getBookings(), bookingsIn));
      imported.push("bookings");
    }
    const billsIn = asRows<Bill>(body.bills);
    if (billsIn.length) {
      await saveBills(mergeRows(await getBills(), billsIn));
      imported.push("bills");
    }
    const challansIn = asRows<Challan>(body.challans);
    if (challansIn.length) {
      await saveChallans(mergeRows(await getChallans(), challansIn));
      imported.push("challans");
    }
    const paymentsIn = asRows<LhpPayment>(body.payments);
    if (paymentsIn.length) {
      await saveLhpPayments(mergeRows(await getLhpPayments(), paymentsIn));
      imported.push("payments");
    }
    const receiptsIn = asRows<MoneyReceipt>(body.receipts);
    if (receiptsIn.length) {
      await saveMoneyReceipts(mergeRows(await getMoneyReceipts(), receiptsIn));
      imported.push("receipts");
    }
    const notesIn = asRows<NoteVoucher>(body.notes);
    if (notesIn.length) {
      await saveNotes(mergeRows(await getNotes(), notesIn));
      imported.push("notes");
    }
    if (body.masters && typeof body.masters === "object" && !Array.isArray(body.masters)) {
      const cur = await getMasters();
      const next = { ...defaultMasters, ...cur, ...(body.masters as Masters) };
      await saveMasters(next);
      imported.push("masters");
    }

    return ok({ ok: true, imported });
  } catch (e) {
    if (e instanceof SyntaxError) return bad("Invalid JSON");
    return failSave(e);
  }
}
