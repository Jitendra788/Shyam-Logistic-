"use client";

import { useEffect, useState } from "react";
import type { Booking, Party } from "@/lib/tbs/types";
import { sharePdfOnWhatsApp } from "@/lib/tbs/whatsapp";

let latestLrPdf: { blob: Blob; fileName: string } | null = null;

/**
 * Builds LR PDF via POST (booking body) so IndexedDB-only rows still print.
 * Renders the result as a blob URL in an iframe.
 */
export function LrPdfFrame({
  booking,
  parties = [],
  autoPrint = false,
}: {
  booking: Booking;
  parties?: Party[];
  autoPrint?: boolean;
  /** @deprecated use booking prop */
  bookingId?: string;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoke = "";
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/tbs/bookings/lr-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking, parties, id: booking.id }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(data?.error || `PDF failed (${res.status})`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        revoke = URL.createObjectURL(blob);
        latestLrPdf = {
          blob,
          fileName: `LR-${booking.lrNo || booking.id}.pdf`,
        };
        setUrl(revoke);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "PDF failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild when booking identity / LR changes
  }, [booking.id, booking.lrNo, booking.lrDate, booking.grandTotal, booking.stCharges, booking.freight, booking.gstPaidBy, booking.lrType]);

  useEffect(() => {
    if (!autoPrint || !url) return;
    const t = setTimeout(() => printLrPdfFrame(), 600);
    return () => clearTimeout(t);
  }, [autoPrint, url]);

  if (loading) {
    return <div className="tbs-empty">Preparing LR PDF…</div>;
  }
  if (error) {
    return <div className="tbs-msg err">{error}</div>;
  }

  return (
    <iframe
      id="lr-pdf-frame"
      title={`LR ${booking.lrNo || booking.id}`}
      src={url}
      style={{
        display: "block",
        width: "210mm",
        height: "594mm",
        maxWidth: "100%",
        margin: "0 auto 24px",
        border: "1px solid #999",
        background: "#fff",
      }}
    />
  );
}

export function printLrPdfFrame() {
  const frame = document.getElementById("lr-pdf-frame") as HTMLIFrameElement | null;
  frame?.contentWindow?.focus();
  frame?.contentWindow?.print();
}

/** Download / open the current blob PDF in a new tab. */
export function openLrPdfBlob() {
  const frame = document.getElementById("lr-pdf-frame") as HTMLIFrameElement | null;
  const src = frame?.src;
  if (src) window.open(src, "_blank", "noopener,noreferrer");
}

/** Send the generated LR PDF on WhatsApp (file, not text). */
export async function shareLrPdfOnWhatsApp() {
  if (!latestLrPdf) {
    alert("PDF ready nahi hai. Thoda wait karke phir try karein.");
    return;
  }
  try {
    await sharePdfOnWhatsApp(latestLrPdf.blob, latestLrPdf.fileName);
  } catch (e) {
    alert(e instanceof Error ? e.message : "WhatsApp PDF failed");
  }
}
