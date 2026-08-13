import { bad, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBills,
  getMoneyReceipts,
  getParties,
  nextCode,
  saveMoneyReceipts,
  uid,
} from "@/lib/tbs/store";
import type { MoneyReceipt } from "@/lib/tbs/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  const [receipts, bills, parties] = await Promise.all([
    getMoneyReceipts(),
    getBills(),
    getParties(),
  ]);
  return ok({
    receipts,
    bills,
    parties,
    nextMr: nextCode(receipts, "mrNo", 1),
  });
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = (await req.json()) as
    | Partial<MoneyReceipt>
    | { items: Partial<MoneyReceipt>[] };
  const receipts = await getMoneyReceipts();
  const items: Partial<MoneyReceipt>[] =
    "items" in body && Array.isArray(body.items)
      ? body.items
      : [body as Partial<MoneyReceipt>];
  const created: MoneyReceipt[] = [];
  let mrSeq = Number(nextCode(receipts, "mrNo", 1));
  for (const item of items) {
    const outstanding = Number(item.outstanding) || 0;
    const paidAmt = Number(item.paidAmt) || 0;
    const deduction = Number(item.deduction) || 0;
    if (!paidAmt && !deduction) continue;
    const row: MoneyReceipt = {
      id: uid("mr"),
      transactionDate: item.transactionDate || new Date().toISOString().slice(0, 10),
      billNo: item.billNo || "",
      date: item.date || "",
      partyName: item.partyName || "",
      outstanding,
      mrNo: item.mrNo || String(mrSeq++),
      paidAmt,
      deduction,
      balance: outstanding - paidAmt - deduction,
      narration: item.narration || "",
    };
    created.push(row);
    receipts.unshift(row);
  }
  await saveMoneyReceipts(receipts);
  return ok(created, 201);
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = (await req.json()) as MoneyReceipt;
  if (!body.id) return bad("id required");
  const receipts = await getMoneyReceipts();
  const idx = receipts.findIndex((r) => r.id === body.id);
  if (idx < 0) return bad("Not found", 404);
  const outstanding = Number(body.outstanding) || 0;
  const paidAmt = Number(body.paidAmt) || 0;
  const deduction = Number(body.deduction) || 0;
  receipts[idx] = {
    ...receipts[idx],
    ...body,
    balance: outstanding - paidAmt - deduction,
  };
  await saveMoneyReceipts(receipts);
  return ok(receipts[idx]);
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("id required");
  const receipts = await getMoneyReceipts();
  await saveMoneyReceipts(receipts.filter((r) => r.id !== id));
  return ok({ ok: true });
}
