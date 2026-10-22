import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBookings,
  getChallans,
  getMasters,
  nudgeMasters,
  saveSlice,
  uid,
} from "@/lib/tbs/store";
import type { Challan } from "@/lib/tbs/types";
import { challanHireBalance } from "@/lib/tbs/challanHire";
import { applyVehicleToLrs } from "@/lib/tbs/legacySkdb";
import {
  duplicateDocMessage,
  findDupByNo,
  nextAvailableCode,
} from "@/lib/tbs/nextCode";

function challanLrClash(
  challans: Challan[],
  lrIds: string[],
  exceptId?: string,
) {
  const used = new Map<string, string>();
  for (const c of challans) {
    if (c.id === exceptId) continue;
    for (const id of c.lrIds || []) used.set(id, c.challanNo);
  }
  return lrIds.filter((id) => used.has(id));
}

function challanMasterHints(row: Partial<Challan>) {
  return {
    vehicles: [row.vehicleNo || ""],
    brokers: [row.brokerOwner || ""],
    stations: [row.fromStation || "", row.toStation || ""],
  };
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [challans, bookings, masters] = await Promise.all([
      getChallans(),
      getBookings(),
      getMasters(),
    ]);
    return ok({
      challans: challans.map((c) => ({
        ...c,
        balance: challanHireBalance(c),
      })),
      bookings,
      masters,
      nextChallan: nextAvailableCode(challans, "challanNo", 1),
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<Challan>;
    const [challans, bookings, masters] = await Promise.all([
      getChallans(),
      getBookings(),
      getMasters(),
    ]);
    const challanNo =
      String(body.challanNo || "").trim() ||
      nextAvailableCode(challans, "challanNo", 1);
    if (findDupByNo(challans, "challanNo", challanNo)) {
      return bad(duplicateDocMessage("Challan No", challanNo));
    }
    const lrIds = body.lrIds || [];
    const clash = challanLrClash(challans, lrIds);
    if (clash.length) {
      return bad(
        `Selected LR already dusre challan pe hai. Same LR se duplicate challan nahi banega. Unique LR select karein, phir Save dabao.`,
      );
    }
    const freight = Number(body.freight) || 0;
    const advance = Number(body.advance) || 0;
    const transfer = Number(body.transfer) || 0;
    const cash = Number(body.cash) || 0;
    const fuel = Number(body.fuel) || 0;
    const challan: Challan = {
      id: uid("c"),
      challanNo,
      challanDate: body.challanDate || new Date().toISOString().slice(0, 10),
      vehicleNo: (body.vehicleNo || "").trim().toUpperCase(),
      brokerOwner: body.brokerOwner || "",
      brokerPan: body.brokerPan || "",
      fromStation: body.fromStation || "",
      toStation: body.toStation || "",
      freight,
      advance,
      transfer,
      cash,
      fuel,
      balance: challanHireBalance({ freight, advance, transfer, cash, fuel }),
      driverName: body.driverName || "",
      licenceNo: body.licenceNo || "",
      engine: body.engine || "",
      chessy: body.chessy || "",
      insuNo: body.insuNo || "",
      owner: body.owner || "",
      panNo: body.panNo || "",
      lrIds,
    };
    const nextBookings = applyVehicleToLrs(bookings, challan.lrIds, challan.vehicleNo);
    await saveSlice({
      challans: [challan, ...challans],
      masters: nudgeMasters(masters, challanMasterHints(challan)),
      ...(nextBookings.changed ? { bookings: nextBookings.bookings } : {}),
    });
    return ok(challan, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Challan;
    if (!body.id) return bad("id required");
    const [challans, bookings, masters] = await Promise.all([
      getChallans(),
      getBookings(),
      getMasters(),
    ]);
    const idx = challans.findIndex((c) => c.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const challanNo = String(body.challanNo || challans[idx].challanNo).trim();
    if (findDupByNo(challans, "challanNo", challanNo, body.id)) {
      return bad(duplicateDocMessage("Challan No", challanNo));
    }
    const clash = challanLrClash(challans, body.lrIds || [], body.id);
    if (clash.length) {
      return bad(
        `Selected LR already dusre challan pe hai. Same LR se duplicate challan nahi banega. Unique LR select karein, phir Save dabao.`,
      );
    }
    const freight = Number(body.freight) || 0;
    const advance = Number(body.advance) || 0;
    const transfer = Number(body.transfer) || 0;
    const cash = Number(body.cash) || 0;
    const fuel = Number(body.fuel) || 0;
    const next = [...challans];
    next[idx] = {
      ...challans[idx],
      ...body,
      challanNo,
      vehicleNo: (body.vehicleNo || "").trim().toUpperCase(),
      balance: challanHireBalance({ freight, advance, transfer, cash, fuel }),
    };
    const nextBookings = applyVehicleToLrs(
      bookings,
      next[idx].lrIds,
      next[idx].vehicleNo,
    );
    await saveSlice({
      challans: next,
      masters: nudgeMasters(masters, challanMasterHints(next[idx])),
      ...(nextBookings.changed ? { bookings: nextBookings.bookings } : {}),
    });
    return ok(next[idx]);
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
    const challans = await getChallans();
    await saveSlice({ challans: challans.filter((c) => c.id !== id) });
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
