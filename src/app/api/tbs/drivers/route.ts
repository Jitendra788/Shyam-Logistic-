import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getDrivers,
  getMasters,
  saveDrivers,
  uid,
} from "@/lib/tbs/store";
import type { DriverRegister } from "@/lib/tbs/types";
import { duplicateDocMessage, findDupByNo } from "@/lib/tbs/nextCode";

function driverDup(drivers: DriverRegister[], row: DriverRegister, exceptId?: string) {
  if (row.lrNo && findDupByNo(drivers, "lrNo", row.lrNo, exceptId)) {
    return duplicateDocMessage("LR No", row.lrNo);
  }
  if (row.challanNo && findDupByNo(drivers, "challanNo", row.challanNo, exceptId)) {
    return duplicateDocMessage("Challan No", row.challanNo);
  }
  return "";
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function moneyLinesFrom(body: Partial<DriverRegister>) {
  const raw = Array.isArray(body.moneyLines) ? body.moneyLines : [];
  const lines = (raw.length ? raw : [{ advance: body.advance, balance: body.balance, expense: body.expense }]).map(
    (l) => ({
      advance: num(l?.advance),
      balance: num(l?.balance),
      expense: num(l?.expense),
    }),
  );
  return lines.length ? lines : [{ advance: 0, balance: 0, expense: 0 }];
}

function rowFrom(body: Partial<DriverRegister>, id: string): DriverRegister {
  const moneyLines = moneyLinesFrom(body);
  const advance = moneyLines.reduce((s, l) => s + l.advance, 0);
  const balance = moneyLines.reduce((s, l) => s + l.balance, 0);
  const expense = moneyLines.reduce((s, l) => s + l.expense, 0);
  return {
    id,
    date: String(body.date || "").trim() || new Date().toISOString().slice(0, 10),
    driverName: String(body.driverName || "").trim(),
    brokerName: String(body.brokerName || "").trim(),
    lrNo: String(body.lrNo || "").trim(),
    lorryNo: String(body.lorryNo || "").trim(),
    mobileNo: String(body.mobileNo || "").trim(),
    moneyLines,
    advance,
    balance,
    expense,
    totalBalance: advance + balance + expense,
    challanNo: String(body.challanNo || "").trim(),
  };
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [drivers, masters] = await Promise.all([getDrivers(), getMasters()]);
    const brokerSet = new Set<string>();
    for (const b of masters.brokers || []) if (b && b !== "All") brokerSet.add(b);
    for (const d of drivers) if (d.brokerName) brokerSet.add(d.brokerName);
    const driverSet = new Set<string>();
    for (const d of drivers) if (d.driverName) driverSet.add(d.driverName);
    return ok({
      drivers,
      brokers: [...brokerSet],
      driverNames: [...driverSet],
      vehicles: masters.vehicles || [],
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<DriverRegister>;
    if (!String(body.lorryNo || "").trim() && !String(body.lrNo || "").trim()) {
      return bad("Lorry No ya LR No likho");
    }
    const drivers = await getDrivers();
    const row = rowFrom(body, uid("drv"));
    const dup = driverDup(drivers, row);
    if (dup) return bad(dup);
    drivers.unshift(row);
    await saveDrivers(drivers);
    return ok(row, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as DriverRegister;
    if (!body.id) return bad("id required");
    if (!String(body.lorryNo || "").trim() && !String(body.lrNo || "").trim()) {
      return bad("Lorry No ya LR No likho");
    }
    const drivers = await getDrivers();
    const idx = drivers.findIndex((d) => d.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const row = rowFrom(body, body.id);
    const dup = driverDup(drivers, row, body.id);
    if (dup) return bad(dup);
    drivers[idx] = row;
    await saveDrivers(drivers);
    return ok(drivers[idx]);
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
    const drivers = await getDrivers();
    await saveDrivers(drivers.filter((d) => d.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
