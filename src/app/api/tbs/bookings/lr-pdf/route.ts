import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tbs/api";
import { buildLrPdf } from "@/lib/tbs/lrPdf";
import { getBookings, getParties } from "@/lib/tbs/store";
import type { Booking, Party } from "@/lib/tbs/types";

export const maxDuration = 30;
export const runtime = "nodejs";

function pdfResponse(pdfBytes: Uint8Array, lrNo: string) {
  const copy = Uint8Array.from(pdfBytes);
  return new Response(copy, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="LR-${lrNo || "print"}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

function failPdf(err: unknown) {
  console.error("LR PDF failed", err);
  const msg = err instanceof Error ? err.message : "PDF failed";
  return NextResponse.json({ error: msg }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    if (!id) {
      return NextResponse.json({ error: "Missing booking" }, { status: 400 });
    }
    const [bookings, parties] = await Promise.all([
      getBookings(),
      getParties().catch(() => [] as Party[]),
    ]);
    const booking = bookings.find((b) => b.id === id || b.lrNo === id);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found. Save first, then print." },
        { status: 404 },
      );
    }
    const pdfBytes = await buildLrPdf(booking, parties);
    return pdfResponse(pdfBytes, booking.lrNo || id);
  } catch (err) {
    return failPdf(err);
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const body = (await req.json()) as {
      id?: string;
      booking?: Booking;
      parties?: Party[];
    };
    const booking = body.booking;
    if (!booking || typeof booking !== "object" || !(booking.lrNo || booking.id)) {
      return NextResponse.json({ error: "Missing booking" }, { status: 400 });
    }
    const parties = Array.isArray(body.parties) ? body.parties : [];
    const pdfBytes = await buildLrPdf(booking, parties);
    return pdfResponse(pdfBytes, booking.lrNo || booking.id);
  } catch (err) {
    return failPdf(err);
  }
}
