import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getParties,
  nextCode,
  saveBills,
  uid,
} from "@/lib/tbs/store";
import type { Bill } from "@/lib/tbs/types";
import { needsPartyBill } from "@/lib/tbs/lrType";

function blockedBillLrs(bookings: Awaited<ReturnType<typeof getBookings>>, lrIds: string[]) {
  return bookings.filter((b) => lrIds.includes(b.id) && !needsPartyBill(b.lrType));
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [bills, bookings, parties] = await Promise.all([
      getBills(),
      getBookings(),
      getParties(),
    ]);
    return ok({
      bills,
      bookings,
      parties,
      nextBill: nextCode(bills, "billNo", 1),
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<Bill>;
    const lrIds = body.lrIds || [];
    if (!(body.partyName || "").trim() && !lrIds.length) {
      return bad("Please Enter Billing Party");
    }
    const [bills, bookings] = await Promise.all([getBills(), getBookings()]);
    const blocked = blockedBillLrs(bookings, lrIds);
    if (blocked.length) {
      return bad(
        `Paid / Cancel LRs cannot be billed (LR ${blocked.map((b) => b.lrNo).join(", ")}). Use TBB or ToPay.`,
      );
    }
    const bill: Bill = {
      id: uid("bill"),
      billNo: body.billNo || nextCode(bills, "billNo", 1),
      billDate: body.billDate || new Date().toISOString().slice(0, 10),
      partyName: (body.partyName || "").trim(),
      totalAmount: Number(body.totalAmount) || 0,
      lrCharges: Number(body.lrCharges) || 0,
      detention: Number(body.detention) || 0,
      hamali: Number(body.hamali) || 0,
      doorDelivery: Number(body.doorDelivery) || 0,
      doorCollection: Number(body.doorCollection) || 0,
      other: Number(body.other) || 0,
      remark: body.remark || "",
      submissionDate:
        body.submissionDate || new Date().toISOString().slice(0, 10),
      lrIds,
    };
    bills.unshift(bill);
    await saveBills(bills);
    return ok(bill, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Bill;
    if (!body.id) return bad("id required");
    const [bills, bookings] = await Promise.all([getBills(), getBookings()]);
    const blocked = blockedBillLrs(bookings, body.lrIds || []);
    if (blocked.length) {
      return bad(
        `Paid / Cancel LRs cannot be billed (LR ${blocked.map((b) => b.lrNo).join(", ")}). Use TBB or ToPay.`,
      );
    }
    const idx = bills.findIndex((b) => b.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    bills[idx] = { ...bills[idx], ...body };
    await saveBills(bills);
    return ok(bills[idx]);
  } catch (e) {
    return failSave(e);
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("id required");
    const bills = await getBills();
    await saveBills(bills.filter((b) => b.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
