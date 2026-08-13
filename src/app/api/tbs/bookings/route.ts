import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBookings,
  getMasters,
  getParties,
  nextCode,
  saveBookings,
  saveMasters,
  uid,
} from "@/lib/tbs/store";
import type { Booking } from "@/lib/tbs/types";

async function rememberVehicle(vehicleNo: string) {
  const v = vehicleNo.trim().toUpperCase();
  if (!v) return;
  const masters = await getMasters();
  if (!masters.vehicles.includes(v)) {
    masters.vehicles = [v, ...masters.vehicles];
    await saveMasters(masters);
  }
}

function totals(body: Partial<Booking>) {
  const freight = Number(body.freight) || 0;
  const hamali = Number(body.hamali) || 0;
  const stCharges = Number(body.stCharges) || 0;
  const lrCharges = Number(body.lrCharges) || 0;
  const doorDelivery = Number(body.doorDelivery) || 0;
  const doorColle = Number(body.doorColle) || 0;
  const barrier = Number(body.barrier) || 0;
  const otherChrg = Number(body.otherChrg) || 0;
  const total =
    freight +
    hamali +
    stCharges +
    lrCharges +
    doorDelivery +
    doorColle +
    barrier +
    otherChrg;
  return {
    freight,
    hamali,
    stCharges,
    lrCharges,
    doorDelivery,
    doorColle,
    barrier,
    otherChrg,
    total,
  };
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [bookings, parties, masters] = await Promise.all([
      getBookings(),
      getParties(),
      getMasters(),
    ]);
    return ok({
      bookings,
      parties,
      masters,
      nextLr: nextCode(bookings, "lrNo", 388),
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<Booking>;
    const bookings = await getBookings();
    const t = totals(body);
    const booking: Booking = {
      id: uid("b"),
      bookingFrom: body.bookingFrom || "Sangli",
      lrNo: body.lrNo || nextCode(bookings, "lrNo", 388),
      lrDate: body.lrDate || new Date().toISOString().slice(0, 10),
      from: body.from || "",
      to: body.to || "",
      vehicleNo: (body.vehicleNo || "").trim().toUpperCase(),
      deliveryAt: body.deliveryAt || "",
      billingParty: body.billingParty || "",
      consignor: body.consignor || "",
      consignee: body.consignee || "",
      address: body.address || "",
      gstNo: body.gstNo || "",
      noOfArticles: body.noOfArticles || "",
      particulars: body.particulars || "",
      invNoDate: body.invNoDate || "",
      actualWt: Number(body.actualWt) || 0,
      chargedWt: Number(body.chargedWt) || 0,
      rate: Number(body.rate) || 0,
      ...t,
      grandTotal: t.total,
      gstPaidBy: body.gstPaidBy || "",
      ewayBillNo: body.ewayBillNo || "",
      validDate: body.validDate || new Date().toISOString().slice(0, 10),
      lrType: body.lrType || "",
      valueRs: Number(body.valueRs) || 0,
      delivered: Boolean(body.delivered),
    };
    bookings.unshift(booking);
    await saveBookings(bookings);
    await rememberVehicle(booking.vehicleNo);
    return ok(booking, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Booking;
    if (!body.id) return bad("id required");
    const bookings = await getBookings();
    const idx = bookings.findIndex((b) => b.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const t = totals(body);
    const vehicleNo = (body.vehicleNo || "").trim().toUpperCase();
    bookings[idx] = {
      ...bookings[idx],
      ...body,
      vehicleNo,
      ...t,
      grandTotal: t.total,
    };
    await saveBookings(bookings);
    await rememberVehicle(vehicleNo);
    return ok(bookings[idx]);
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
    const bookings = await getBookings();
    await saveBookings(bookings.filter((b) => b.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
