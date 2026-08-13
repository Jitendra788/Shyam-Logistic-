"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LrPrintSheet, DEFAULT_LR_COMPANY } from "@/components/tbs/LrPrintSheet";
import { useTbsApi } from "@/components/tbs/useTbs";
import type { Booking, Party } from "@/lib/tbs/types";
import "@/app/admin/lr-print.css";

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
      <div className="lr-print-page lr-print-standalone">
        <div className="lr-print-toolbar lr-no-print">
          <Link href="/admin/transport/booking" className="tbs-btn">
            ← Back to Booking
          </Link>
        </div>
        <div className="tbs-empty">LR / booking not found. Save the booking first, then print.</div>
      </div>
    );
  }

  return (
    <div className="lr-print-page lr-print-standalone">
      <div className="lr-print-toolbar lr-no-print">
        <Link href="/admin/transport/booking" className="tbs-btn">
          ← Back
        </Link>
        <button type="button" className="tbs-btn" onClick={() => window.print()}>
          🖨 Print Bill
        </button>
        <span style={{ fontSize: 12, color: "#333" }}>
          LR No. {booking.lrNo} — use browser Print → Save as PDF if needed
        </span>
      </div>
      <LrPrintSheet
        booking={booking}
        parties={data?.parties || []}
        company={DEFAULT_LR_COMPANY}
      />
    </div>
  );
}

export default function LrPrintPage() {
  return (
    <Suspense fallback={<div className="tbs-empty">Loading…</div>}>
      <PrintInner />
    </Suspense>
  );
}
