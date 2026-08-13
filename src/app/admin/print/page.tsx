"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import {
  BillPrint,
  BookingBillPrint,
  ChallanPrint,
  LhpPrint,
  MrPrint,
  NotePrint,
  PartiesListPrint,
  PartyPrint,
  RegisterPrint,
} from "@/components/tbs/DocPrint";
import { useTbsApi } from "@/components/tbs/useTbs";
import { fmtDate } from "@/components/tbs/FormPrimitives";
import type {
  Bill,
  Booking,
  Challan,
  LhpPayment,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";
import {
  billWhatsAppText,
  bookingWhatsAppText,
  challanWhatsAppText,
  mrWhatsAppText,
  shareOnWhatsApp,
} from "@/lib/tbs/whatsapp";
import "../doc-print.css";
import "../lr-print.css";
import "../tbs.css";

type Bundle = {
  parties?: Party[];
  bookings?: Booking[];
  challans?: Challan[];
  bills?: Bill[];
  receipts?: MoneyReceipt[];
  payments?: LhpPayment[];
  notes?: NoteVoucher[];
};

function useBundle(type: string) {
  const parties = useTbsApi<{ parties: Party[] }>(
    type.includes("party") || type === "parties" || type === "booking" || type === "bill" || type === "note"
      ? "/api/tbs/parties"
      : null,
  );
  const bookings = useTbsApi<{ bookings: Booking[]; parties: Party[] }>(
    ["booking", "bookings", "challan", "bill", "challans", "bills"].includes(type)
      ? "/api/tbs/bookings"
      : null,
  );
  const challans = useTbsApi<{ challans: Challan[] }>(
    ["challan", "challans", "lhp", "lhp-list"].includes(type) ? "/api/tbs/challans" : null,
  );
  const bills = useTbsApi<{ bills: Bill[]; bookings: Booking[] }>(
    ["bill", "bills", "mr", "mrs"].includes(type) ? "/api/tbs/bills" : null,
  );
  const mrs = useTbsApi<{ receipts: MoneyReceipt[] }>(
    ["mr", "mrs"].includes(type) ? "/api/tbs/money-receipts" : null,
  );
  const lhp = useTbsApi<{ payments: LhpPayment[] }>(
    ["lhp", "lhp-list"].includes(type) ? "/api/tbs/lhp" : null,
  );
  const notes = useTbsApi<{ notes: NoteVoucher[] }>(
    type === "note" ? "/api/tbs/notes" : null,
  );

  const loading =
    parties.loading ||
    bookings.loading ||
    challans.loading ||
    bills.loading ||
    mrs.loading ||
    lhp.loading ||
    notes.loading;

  const data: Bundle = {
    parties: parties.data?.parties || bookings.data?.parties,
    bookings: bookings.data?.bookings || bills.data?.bookings,
    challans: challans.data?.challans,
    bills: bills.data?.bills,
    receipts: mrs.data?.receipts,
    payments: lhp.data?.payments,
    notes: notes.data?.notes,
  };

  return { loading, data };
}

function buildShareText(
  type: string,
  id: string,
  data: Bundle,
): string | null {
  if (type === "booking" && id) {
    const b = data.bookings?.find((x) => x.id === id || x.lrNo === id);
    return b ? bookingWhatsAppText(b) : null;
  }
  if (type === "challan" && id) {
    const c = data.challans?.find((x) => x.id === id || x.challanNo === id);
    return c ? challanWhatsAppText(c) : null;
  }
  if (type === "bill" && id) {
    const b = data.bills?.find((x) => x.id === id || x.billNo === id);
    return b ? billWhatsAppText(b) : null;
  }
  if (type === "mr" && id) {
    const r = data.receipts?.find((x) => x.id === id || x.mrNo === id);
    return r ? mrWhatsAppText(r) : null;
  }
  if (type === "lhp" && id) {
    const p = data.payments?.find((x) => x.id === id);
    if (!p) return null;
    return [
      "*SHYAM LOGISTICS*",
      "Lorry Hire Payment",
      "",
      `Challan: *${p.challanNo}*`,
      `Broker: ${p.broker || "—"}`,
      `Vehicle: ${p.vehNo || "—"}`,
      `Paid: ₹ ${Number(p.paidAmt || 0).toFixed(2)}`,
      `Date: ${fmtDate(p.transactionDate)}`,
      "",
      "Thank you.",
    ].join("\n");
  }
  return null;
}

function PrintInner() {
  const params = useSearchParams();
  const type = params.get("type") || "";
  const id = params.get("id") || "";
  const noteType = params.get("noteType") || "";
  const auto = params.get("auto") === "1";
  const { loading, data } = useBundle(type);

  const content = useMemo(() => {
    if (!type) return null;
    if (type === "booking" && id) {
      const b = data.bookings?.find((x) => x.id === id || x.lrNo === id);
      if (!b) return null;
      return <BookingBillPrint booking={b} parties={data.parties || []} />;
    }
    if (type === "bookings") {
      return (
        <RegisterPrint
          title="BOOKING / LR REGISTER"
          columns={["Sr", "LR No", "Date", "Party", "From", "To", "Freight"]}
          rows={(data.bookings || []).map((b, i) => [
            i + 1,
            b.lrNo,
            fmtDate(b.lrDate),
            b.billingParty,
            b.from,
            b.to,
            b.freight,
          ])}
        />
      );
    }
    if (type === "party" && id) {
      const p = data.parties?.find((x) => x.id === id);
      if (!p) return null;
      return <PartyPrint party={p} />;
    }
    if (type === "parties") {
      return <PartiesListPrint parties={data.parties || []} />;
    }
    if (type === "challan" && id) {
      const c = data.challans?.find((x) => x.id === id || x.challanNo === id);
      if (!c) return null;
      return <ChallanPrint challan={c} bookings={data.bookings || []} />;
    }
    if (type === "challans") {
      return (
        <RegisterPrint
          title="CHALLAN REGISTER"
          columns={["Sr", "Challan", "Date", "Broker", "Vehicle", "Balance"]}
          rows={(data.challans || []).map((c, i) => [
            i + 1,
            c.challanNo,
            fmtDate(c.challanDate),
            c.brokerOwner,
            c.vehicleNo,
            c.balance,
          ])}
        />
      );
    }
    if (type === "bill" && id) {
      const b = data.bills?.find((x) => x.id === id || x.billNo === id);
      if (!b) return null;
      return (
        <BillPrint
          bill={b}
          bookings={data.bookings || []}
          parties={data.parties || []}
        />
      );
    }
    if (type === "bills") {
      return (
        <RegisterPrint
          title="BILL REGISTER"
          columns={["Sr", "Bill No", "Date", "Party", "Amount"]}
          rows={(data.bills || []).map((b, i) => [
            i + 1,
            b.billNo,
            fmtDate(b.billDate),
            b.partyName,
            b.totalAmount,
          ])}
        />
      );
    }
    if (type === "mr" && id) {
      const r = data.receipts?.find((x) => x.id === id || x.mrNo === id);
      if (!r) return null;
      return <MrPrint receipt={r} />;
    }
    if (type === "mrs") {
      return (
        <RegisterPrint
          title="MONEY RECEIPT REGISTER"
          columns={["Sr", "MR No", "Bill", "Party", "Paid", "Date"]}
          rows={(data.receipts || []).map((r, i) => [
            i + 1,
            r.mrNo,
            r.billNo,
            r.partyName,
            r.paidAmt,
            fmtDate(r.transactionDate),
          ])}
        />
      );
    }
    if (type === "lhp" && id) {
      const p = data.payments?.find((x) => x.id === id);
      if (!p) return null;
      return <LhpPrint payment={p} />;
    }
    if (type === "lhp-list") {
      return (
        <RegisterPrint
          title="LHP PAYMENT REGISTER"
          columns={["Sr", "Challan", "Broker", "Vehicle", "Paid", "Date"]}
          rows={(data.payments || []).map((p, i) => [
            i + 1,
            p.challanNo,
            p.broker,
            p.vehNo,
            p.paidAmt,
            fmtDate(p.transactionDate),
          ])}
        />
      );
    }
    if (type === "note" && id) {
      const n = data.notes?.find((x) => x.id === id);
      if (!n) return null;
      return <NotePrint note={n} />;
    }
    if (type === "note" && noteType) {
      const list = (data.notes || []).filter((n) => n.type === noteType);
      const title =
        noteType === "debit"
          ? "DEBIT NOTE REGISTER"
          : noteType === "credit"
            ? "CREDIT NOTE REGISTER"
            : "EXPENSE VOUCHER REGISTER";
      return (
        <RegisterPrint
          title={title}
          columns={["Sr", "Voucher", "Date", "Party", "Amount", "Narration"]}
          rows={list.map((n, i) => [
            i + 1,
            n.voucherNo,
            fmtDate(n.date),
            n.partyName,
            n.amount,
            n.narration,
          ])}
        />
      );
    }
    return null;
  }, [type, id, noteType, data]);

  const shareText = useMemo(
    () => (!loading ? buildShareText(type, id, data) : null),
    [loading, type, id, data],
  );

  useEffect(() => {
    if (auto && content && !loading) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [auto, content, loading]);

  return (
    <div className="doc-print-page">
      <div className="doc-print-toolbar">
        <Link href="/admin" className="tbs-btn">
          ← Admin
        </Link>
        <button type="button" className="tbs-btn tbs-btn-print" onClick={() => window.print()}>
          🖨 Print
        </button>
        {shareText && (
          <button
            type="button"
            className="tbs-btn tbs-btn-wa"
            onClick={() => shareOnWhatsApp(shareText)}
          >
            WhatsApp
          </button>
        )}
        <span style={{ fontSize: 12 }}>
          {type}
          {id ? ` #${id}` : ""} — Print / Save as PDF / WhatsApp
        </span>
      </div>
      {loading ? (
        <div className="tbs-empty">Loading print…</div>
      ) : content ? (
        content
      ) : (
        <div className="tbs-empty">Document not found. Select a saved record and try again.</div>
      )}
    </div>
  );
}

export default function UnifiedPrintPage() {
  return (
    <Suspense fallback={<div className="tbs-empty">Loading…</div>}>
      <PrintInner />
    </Suspense>
  );
}
