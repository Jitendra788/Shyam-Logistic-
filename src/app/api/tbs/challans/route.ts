import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBookings,
  getChallans,
  getMasters,
  nextCode,
  saveChallans,
  saveMasters,
  uid,
} from "@/lib/tbs/store";
import type { Challan } from "@/lib/tbs/types";

async function rememberBroker(brokerOwner: string) {
  const name = brokerOwner.trim();
  if (!name) return;
  const masters = await getMasters();
  const exists = masters.brokers.some(
    (x) => x.toLowerCase() === name.toLowerCase(),
  );
  if (!exists) {
    const rest = masters.brokers.filter((x) => x !== "All");
    masters.brokers = ["All", name, ...rest];
    await saveMasters(masters);
  }
}

async function rememberVehicle(vehicleNo: string) {
  const v = vehicleNo.trim().toUpperCase();
  if (!v) return;
  const masters = await getMasters();
  if (!masters.vehicles.includes(v)) {
    masters.vehicles = [v, ...masters.vehicles];
    await saveMasters(masters);
  }
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
      challans,
      bookings,
      masters,
      nextChallan: nextCode(challans, "challanNo", 1),
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
    const challans = await getChallans();
    const freight = Number(body.freight) || 0;
    const advance = Number(body.advance) || 0;
    const transfer = Number(body.transfer) || 0;
    const cash = Number(body.cash) || 0;
    const fuel = Number(body.fuel) || 0;
    const challan: Challan = {
      id: uid("c"),
      challanNo: body.challanNo || nextCode(challans, "challanNo", 1),
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
      balance: freight - advance - transfer - cash - fuel,
      driverName: body.driverName || "",
      licenceNo: body.licenceNo || "",
      engine: body.engine || "",
      chessy: body.chessy || "",
      insuNo: body.insuNo || "",
      owner: body.owner || "",
      panNo: body.panNo || "",
      lrIds: body.lrIds || [],
    };
    challans.unshift(challan);
    await saveChallans(challans);
    await rememberVehicle(challan.vehicleNo);
    await rememberBroker(challan.brokerOwner);
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
    const challans = await getChallans();
    const idx = challans.findIndex((c) => c.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const freight = Number(body.freight) || 0;
    const advance = Number(body.advance) || 0;
    const transfer = Number(body.transfer) || 0;
    const cash = Number(body.cash) || 0;
    const fuel = Number(body.fuel) || 0;
    challans[idx] = {
      ...challans[idx],
      ...body,
      vehicleNo: (body.vehicleNo || "").trim().toUpperCase(),
      balance: freight - advance - transfer - cash - fuel,
    };
    await saveChallans(challans);
    await rememberVehicle(challans[idx].vehicleNo);
    await rememberBroker(challans[idx].brokerOwner);
    return ok(challans[idx]);
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
    await saveChallans(challans.filter((c) => c.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
