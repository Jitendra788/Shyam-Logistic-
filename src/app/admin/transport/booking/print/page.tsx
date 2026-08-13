"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { BookingBillPrint } from "@/components/tbs/DocPrint";
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

  useEffect(() => {
    if (auto && booking) {
      const t = setTimeout(() => window.print(), 400);
      return () => clearTimeout(t);
    }
  }, [auto, booking]);

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
    <div className="doc-print-page">
      <div className="doc-print-toolbar">
        <Link href="/admin/transport/booking" className="tbs-btn">
          ← Back
        </Link>
        <button type="button" className="tbs-btn tbs-btn-print" onClick={() => window.print()}>
          🖨 Print Bill
        </button>
        <span style={{ fontSize: 12, color: "#333" }}>
          LR No. {booking.lrNo} — Tax Invoice
        </span>
      </div>
      <BookingBillPrint booking={booking} parties={data?.parties || []} />
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
