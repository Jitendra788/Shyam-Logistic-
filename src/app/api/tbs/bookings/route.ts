import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getMasters,
  getParties,
  nextCode,
  saveBookings,
  saveMasters,
  uid,
} from "@/lib/tbs/store";
import type { Booking } from "@/lib/tbs/types";
import { normalizeLrType } from "@/lib/tbs/lrType";

async function rememberVehicle(vehicleNo: string) {
  const v = vehicleNo.trim().toUpperCase();
  if (!v) return;
  const masters = await getMasters();
  if (!masters.vehicles.includes(v)) {
    masters.vehicles = [v, ...masters.vehicles];
    await saveMasters(masters);
  }
}

async function rememberParticular(particulars: string) {
  const p = particulars.trim();
  if (!p) return;
  const masters = await getMasters();
  const exists = masters.particulars.some(
    (x) => x.toLowerCase() === p.toLowerCase(),
  );
  if (!exists) {
    masters.particulars = [p, ...masters.particulars];
    await saveMasters(masters);
  }
}

async function rememberStation(...stations: string[]) {
  const masters = await getMasters();
  let changed = false;
  for (const raw of stations) {
    const s = raw.trim();
    if (!s) continue;
    if (!masters.stations.some((x) => x.toLowerCase() === s.toLowerCase())) {
      masters.stations = [s, ...masters.stations];
      changed = true;
    }
  }
  if (changed) await saveMasters(masters);
}

async function rememberListValue(
  key: "gstPaidBy" | "lrTypes" | "gstLabels",
  value: string,
) {
  const v = value.trim();
  if (!v) return;
  const masters = await getMasters();
  const list = [...(masters[key] || [])];
  if (!list.some((x) => x.toLowerCase() === v.toLowerCase())) {
    masters[key] = [v, ...list];
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
    const [bookings, parties, masters, bills, challans] = await Promise.all([
      getBookings(),
      getParties(),
      getMasters(),
      getBills(),
      getChallans(),
    ]);
    const billNoByLr: Record<string, string> = {};
    for (const bill of bills) {
      for (const id of bill.lrIds || []) {
        if (!billNoByLr[id]) billNoByLr[id] = bill.billNo;
      }
    }
    const challanNoByLr: Record<string, string> = {};
    for (const c of challans) {
      for (const id of c.lrIds || []) {
        if (!challanNoByLr[id]) challanNoByLr[id] = c.challanNo;
      }
    }
    return ok({
      bookings,
      parties,
      masters,
      bills,
      challans,
      billNoByLr,
      challanNoByLr,
      nextLr: nextCode(bookings, "lrNo", 1),
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
      lrNo: body.lrNo || nextCode(bookings, "lrNo", 1),
      lrDate: body.lrDate || new Date().toISOString().slice(0, 10),
      from: body.from || "",
      to: body.to || "",
      vehicleNo: (body.vehicleNo || "").trim().toUpperCase(),
      deliveryAt: body.deliveryAt || "DOOR",
      expectedDelivery: body.expectedDelivery || "",
      payMode: body.payMode || "",
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
      grandTotal: t.total + (Number(body.gstAmt) || 0),
      gstLabel: body.gstLabel || "GST @ 0%",
      gstAmt: Number(body.gstAmt) || 0,
      gstPaidBy: body.gstPaidBy || "",
      ewayBillNo: body.ewayBillNo || "",
      validDate: body.validDate || new Date().toISOString().slice(0, 10),
      lrType: normalizeLrType(body.lrType || "") || body.lrType || "",
      valueRs: Number(body.valueRs) || 0,
      delivered: Boolean(body.delivered),
    };
    bookings.unshift(booking);
    await saveBookings(bookings);
    await rememberVehicle(booking.vehicleNo);
    await rememberParticular(booking.particulars);
    await rememberStation(booking.bookingFrom, booking.from, booking.to);
    await rememberListValue("gstPaidBy", booking.gstPaidBy);
    await rememberListValue("lrTypes", booking.lrType);
    await rememberListValue("gstLabels", booking.gstLabel || "");
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
    let idx = bookings.findIndex((b) => b.id === body.id);
    if (idx < 0 && body.lrNo) {
      idx = bookings.findIndex((b) => b.lrNo === String(body.lrNo));
    }
    const t = totals(body);
    const vehicleNo = (body.vehicleNo || "").trim().toUpperCase();
    const gstAmt = Number(body.gstAmt) || 0;
    const merged: Booking = {
      ...(idx >= 0 ? bookings[idx] : { id: body.id }),
      ...body,
      id: idx >= 0 ? bookings[idx].id : body.id || uid("b"),
      vehicleNo,
      ...t,
      gstAmt,
      gstLabel: body.gstLabel || (idx >= 0 ? bookings[idx].gstLabel : "") || "GST @ 0%",
      grandTotal: t.total + gstAmt,
      lrType: normalizeLrType(body.lrType || "") || body.lrType || "",
    };
    if (idx < 0) bookings.unshift(merged);
    else bookings[idx] = merged;
    await saveBookings(bookings);
    await rememberVehicle(vehicleNo);
    await rememberParticular(body.particulars);
    await rememberStation(body.bookingFrom, body.from, body.to);
    await rememberListValue("gstPaidBy", body.gstPaidBy);
    await rememberListValue("lrTypes", body.lrType);
    await rememberListValue("gstLabels", body.gstLabel || "");
    return ok(idx < 0 ? bookings[0] : bookings[idx]);
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
