import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getChallans,
  getLhpPayments,
  getMasters,
  saveLhpPayments,
  uid,
} from "@/lib/tbs/store";
import type { LhpPayment } from "@/lib/tbs/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [payments, challans, masters] = await Promise.all([
      getLhpPayments(),
      getChallans(),
      getMasters(),
    ]);
    return ok({ payments, challans, masters });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as
      | Partial<LhpPayment>
      | { items: Partial<LhpPayment>[] };
    const payments = await getLhpPayments();
    const items: Partial<LhpPayment>[] =
      "items" in body && Array.isArray(body.items)
        ? body.items
        : [body as Partial<LhpPayment>];
    const created: LhpPayment[] = [];
    for (const item of items) {
      const outstanding = Number(item.outstanding) || 0;
      const paidAmt = Number(item.paidAmt) || 0;
      const deduction = Number(item.deduction) || 0;
      if (!paidAmt && !deduction) continue;
      const row: LhpPayment = {
        id: uid("lhp"),
        transactionDate:
          item.transactionDate || new Date().toISOString().slice(0, 10),
        challanNo: item.challanNo || "",
        date: item.date || "",
        broker: item.broker || "",
        vehNo: item.vehNo || "",
        outstanding,
        paidAmt,
        deduction,
        balance: outstanding - paidAmt - deduction,
        narration: item.narration || "",
      };
      created.push(row);
      payments.unshift(row);
    }
    await saveLhpPayments(payments);
    return ok(created, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as LhpPayment;
    if (!body.id) return bad("id required");
    const payments = await getLhpPayments();
    const idx = payments.findIndex((p) => p.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const outstanding = Number(body.outstanding) || 0;
    const paidAmt = Number(body.paidAmt) || 0;
    const deduction = Number(body.deduction) || 0;
    payments[idx] = {
      ...payments[idx],
      ...body,
      balance: outstanding - paidAmt - deduction,
    };
    await saveLhpPayments(payments);
    return ok(payments[idx]);
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
    const payments = await getLhpPayments();
    await saveLhpPayments(payments.filter((p) => p.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
