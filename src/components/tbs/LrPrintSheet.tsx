"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Booking, Party } from "@/lib/tbs/types";

/** Original form background (from 384.pdf) — all lines/labels baked in */
const FORM_BG = "/brand/lr-form-blank.png";

/** PDF page size (points) → A4 mm mapping */
const PAGE_W = 595.32;
const PAGE_H = 841.92;
const COPY2_DY = 419.8;

function mmX(pt: number) {
  return Number(((pt / PAGE_W) * 210).toFixed(3));
}
function mmY(pt: number) {
  return Number(((pt / PAGE_H) * 297).toFixed(3));
}

/**
 * Dynamic field TOP-LEFT in PDF points (copy 1 only).
 * Y = same as printed labels on the form (no vertical centering tricks).
 * Freight amounts share Y with Freight Ch. labels so they sit in the same row.
 */
const F_PT: Record<string, { x: number; y: number }> = {
  lorryNo: { x: 70.8, y: 66.7 },
  bookingFrom: { x: 100.2, y: 91.3 },
  deliveryAt: { x: 316.2, y: 91.3 },
  lrNo: { x: 484.2, y: 91.3 },
  from: { x: 100.8, y: 109.7 },
  to: { x: 285.9, y: 109.7 },
  date: { x: 483.6, y: 109.7 },
  consignor: { x: 76.0, y: 131.2 },
  consignorAddr: { x: 26.4, y: 146.5 },
  consignorGst: { x: 76.0, y: 173.2 },
  consignee: { x: 352.0, y: 131.2 },
  consigneeAddr: { x: 304.0, y: 149.2 },
  consigneeGst: { x: 352.0, y: 173.2 },
  articles: { x: 25.0, y: 217.1 },
  particulars: { x: 69.9, y: 217.1 },
  invNo: { x: 268.0, y: 217.1 },
  rate: { x: 348.8, y: 217.0 },
  actWt: { x: 340.0, y: 265.1 },
  chgWt: { x: 340.0, y: 307.1 },
  // Align with Freight Ch. label baselines (PDF)
  freight: { x: 502.0, y: 216.01 },
  doorColl: { x: 502.0, y: 231.01 },
  doorDel: { x: 502.0, y: 246.01 },
  hamali: { x: 502.0, y: 261.01 },
  stChgs: { x: 502.0, y: 273.97 },
  totalAmt: { x: 502.0, y: 288.97 },
  gstAmt: { x: 502.0, y: 303.01 },
  advance: { x: 502.0, y: 316.93 },
  balance: { x: 502.0, y: 332.05 },
  // Same baseline as "Valid Date" / "Eway Bill No." labels
  eway: { x: 86.0, y: 348.97 },
  validDate: { x: 278.0, y: 348.97 },
  // Checkbox top-left (inside square)
  payTopay: { x: 28.5, y: 375.5 },
  payPaid: { x: 76.5, y: 375.5 },
  payTbb: { x: 118.5, y: 375.5 },
};

type FieldKey = keyof typeof F_PT;

export type LrCompany = {
  companyName: string;
  gstin: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  blessing?: string;
};

export const DEFAULT_LR_COMPANY: LrCompany = {
  companyName: "SHYAM LOGISTICS",
  gstin: "27AXGPL2293R1ZP",
  phone: "8459858242",
  phone2: "9057420562",
  email: "shyamlogisticscompany535@gmail.com",
  address:
    "Gate No.295/2, B/1, Near Laxmi Tekadi, Shri Mahalaxmi Petrol Pump 5 Star MIDC Kagal, Kolhapur. 416216",
  blessing: "|| Shree Ganesh Prasanna ||",
};

function partyOf(parties: Party[], name: string) {
  return parties.find(
    (p) => p.partyName.trim().toLowerCase() === name.trim().toLowerCase(),
  );
}

function dmy(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}

function Field({
  name,
  copyIndex,
  children,
  className = "",
  align = "left",
}: {
  name: FieldKey;
  copyIndex: 0 | 1;
  children: ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  const { x, y } = F_PT[name];
  const style: CSSProperties = {
    position: "absolute",
    top: `${mmY(y + copyIndex * COPY2_DY)}mm`,
    textAlign: align,
  };
  if (align === "right") {
    style.right = `${(210 - mmX(x)).toFixed(3)}mm`;
    style.left = "auto";
  } else {
    style.left = `${mmX(x)}mm`;
  }
  return (
    <div className={`lr-field ${className}`} style={style}>
      {children}
    </div>
  );
}

function Mark({
  name,
  copyIndex,
  on,
}: {
  name: FieldKey;
  copyIndex: 0 | 1;
  on: boolean;
}) {
  if (!on) return null;
  const { x, y } = F_PT[name];
  return (
    <div
      className="lr-field lr-mark"
      style={{
        position: "absolute",
        left: `${mmX(x)}mm`,
        top: `${mmY(y + copyIndex * COPY2_DY)}mm`,
      }}
      aria-hidden
    />
  );
}

function OverlayFields({
  booking,
  parties,
  copyIndex,
}: {
  booking: Booking;
  parties: Party[];
  copyIndex: 0 | 1;
}) {
  const consignor = partyOf(parties, booking.consignor);
  const consignee = partyOf(parties, booking.consignee);
  const lrType = (booking.lrType || "").toLowerCase();
  const fromStation = booking.from || booking.bookingFrom || "";
  const rateLabel = booking.rate ? String(booking.rate) : "FIX";
  const actWt = booking.actualWt ? String(booking.actualWt) : "";
  const chgWt = booking.chargedWt ? String(booking.chargedWt) : actWt;

  return (
    <>
      <Field name="lorryNo" copyIndex={copyIndex} className="lr-f-lorry">
        {booking.vehicleNo || ""}
      </Field>
      <Field name="bookingFrom" copyIndex={copyIndex}>
        {booking.bookingFrom}
      </Field>
      <Field name="deliveryAt" copyIndex={copyIndex}>
        {booking.deliveryAt || ""}
      </Field>
      <Field name="lrNo" copyIndex={copyIndex} className="lr-f-lrno">
        {booking.lrNo}
      </Field>
      <Field name="from" copyIndex={copyIndex}>
        {fromStation}
      </Field>
      <Field name="to" copyIndex={copyIndex} className="lr-f-to">
        {booking.to}
      </Field>
      <Field name="date" copyIndex={copyIndex} className="lr-f-date">
        {dmy(booking.lrDate)}
      </Field>

      <Field name="consignor" copyIndex={copyIndex} className="lr-f-party">
        {booking.consignor}
      </Field>
      <Field name="consignorAddr" copyIndex={copyIndex} className="lr-f-addr">
        {consignor?.address || ""}
      </Field>
      <Field name="consignorGst" copyIndex={copyIndex}>
        {consignor?.gstTin || ""}
      </Field>

      <Field name="consignee" copyIndex={copyIndex} className="lr-f-party">
        {booking.consignee || ""}
      </Field>
      <Field name="consigneeAddr" copyIndex={copyIndex} className="lr-f-addr">
        {consignee?.address || booking.address || ""}
      </Field>
      <Field name="consigneeGst" copyIndex={copyIndex}>
        {consignee?.gstTin || booking.gstNo || ""}
      </Field>

      <Field name="articles" copyIndex={copyIndex}>
        {booking.noOfArticles || ""}
      </Field>
      <Field name="particulars" copyIndex={copyIndex}>
        {booking.particulars || ""}
      </Field>
      <Field name="invNo" copyIndex={copyIndex} className="lr-f-inv">
        {booking.invNoDate || ""}
      </Field>
      <Field name="rate" copyIndex={copyIndex} className="lr-f-rate">
        {rateLabel}
      </Field>
      <Field name="actWt" copyIndex={copyIndex} className="lr-f-rate">
        {actWt}
      </Field>
      <Field name="chgWt" copyIndex={copyIndex} className="lr-f-rate">
        {chgWt}
      </Field>

      <Field name="freight" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="doorColl" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="doorDel" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="hamali" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="stChgs" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="totalAmt" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="gstAmt" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="advance" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>
      <Field name="balance" copyIndex={copyIndex} className="lr-f-amt" align="right">
        {""}
      </Field>

      <Field name="eway" copyIndex={copyIndex} className="lr-f-eway">
        {booking.ewayBillNo || ""}
      </Field>
      <Field name="validDate" copyIndex={copyIndex} className="lr-f-date">
        {booking.validDate ? dmy(booking.validDate) : ""}
      </Field>

      <Mark
        name="payTopay"
        copyIndex={copyIndex}
        on={lrType.includes("to pay") || lrType.includes("topay")}
      />
      <Mark name="payPaid" copyIndex={copyIndex} on={lrType === "paid"} />
      <Mark name="payTbb" copyIndex={copyIndex} on={lrType.includes("tbb")} />
    </>
  );
}

export function LrPrintSheet({
  booking,
  parties,
}: {
  booking: Booking;
  parties: Party[];
  company?: LrCompany;
  copies?: 1 | 2 | 3;
  showReferenceOverlay?: boolean;
}) {
  return (
    <div className="lr-print-root">
      <div className="lr-print-document">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${FORM_BG}?v=5`}
          alt=""
          className="lr-form-bg"
          draggable={false}
        />
        <OverlayFields booking={booking} parties={parties} copyIndex={0} />
        <OverlayFields booking={booking} parties={parties} copyIndex={1} />
      </div>
    </div>
  );
}
