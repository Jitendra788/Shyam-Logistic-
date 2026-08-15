"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LrPdfFrame, openLrPdfBlob, printLrPdfFrame, shareLrPdfOnWhatsApp } from "@/components/tbs/LrPdfFrame";
import { useTbsApi } from "@/components/tbs/useTbs";
import type { Booking, Party } from "@/lib/tbs/types";
import "@/app/admin/doc-print.css";

type Payload = {
  bookings: Booking[];
  parties: Party[];
};

function PrintInner() {
  const params = useSearchParams();
  const id = params.get("id") || "";
  const auto = params.get("auto") === "1";
  const { data, loading, error } = useTbsApi<Payload>("/api/tbs/bookings");

  const booking = data?.bookings.find((b) => b.id === id || b.lrNo === id);

  if (loading) return <div className="tbs-empty">Loading bill…</div>;
  if (error) return <div className="tbs-msg err">{error}</div>;
  if (!booking) {
    return (
      <div className="doc-print-page">
        <div className="doc-print-toolbar">
          <Link href="/admin/transport/booking" className="tbs-btn">
            ← Back to Booking
          </Link>
        </div>
        <div className="tbs-empty">Booking not found. Save first, then print.</div>
      </div>
    );
  }

  return (
    <div className="doc-print-page" style={{ background: "#ddd", minHeight: "100vh" }}>
      <div className="doc-print-toolbar lr-no-print" style={{ padding: 12 }}>
        <Link href="/admin/transport/booking" className="tbs-btn">
          ← Back
        </Link>
        <button type="button" className="tbs-btn tbs-btn-print" onClick={() => printLrPdfFrame()}>
          🖨 Print Bill
        </button>
        <button type="button" className="tbs-btn" onClick={() => openLrPdfBlob()}>
          Open PDF
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-wa"
          onClick={() => void shareLrPdfOnWhatsApp()}
        >
          WhatsApp
        </button>
        <span style={{ fontSize: 12, color: "#333" }}>
          LR No. {booking.lrNo} — Original PDF form
        </span>
      </div>
      <LrPdfFrame
        booking={booking}
        parties={data?.parties || []}
        autoPrint={auto}
      />
      <style>{`
        @media print {
          .lr-no-print, .doc-print-toolbar { display: none !important; }
          body { margin: 0; background: #fff; }
          iframe { border: none !important; width: 100% !important; height: 100vh !important; }
        }
      `}</style>
    </div>
  );
}

export default function BookingPrintPage() {
  return (
    <Suspense fallback={<div className="tbs-empty">Loading…</div>}>
      <PrintInner />
    </Suspense>
  );
}
