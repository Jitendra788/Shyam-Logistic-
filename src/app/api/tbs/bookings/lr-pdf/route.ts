import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/tbs/api";
import { buildLrPdf } from "@/lib/tbs/lrPdf";
import { getBookings, getParties } from "@/lib/tbs/store";
import type { Booking, Party } from "@/lib/tbs/types";

function pdfResponse(pdfBytes: Uint8Array, lrNo: string) {
  return new NextResponse(Buffer.from(pdfBytes), {
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

async function safeParties(): Promise<Party[]> {
  try {
    return await getParties();
  } catch (err) {
    console.error("LR PDF parties failed", err);
    return [];
  }
}

/** Resolve booking from server store, or from client body. */
async function resolveBooking(
  id: string | undefined,
  bodyBooking: Booking | undefined,
): Promise<{ booking: Booking; parties: Party[] } | { error: string; status: number }> {
  const parties = await safeParties();

  if (bodyBooking && typeof bodyBooking === "object" && (bodyBooking.lrNo || bodyBooking.id)) {
    return { booking: bodyBooking, parties };
  }

  if (!id) {
    return { error: "Missing booking", status: 400 };
  }

  try {
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === id || b.lrNo === id);
    if (!booking) {
      return { error: "Booking not found. Save first, then print.", status: 404 };
    }
    return { booking, parties };
  } catch (err) {
    console.error("LR PDF bookings failed", err);
    return { error: "Could not load booking for PDF", status: 503 };
  }
}

export async function GET(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const id = req.nextUrl.searchParams.get("id") || "";
    const resolved = await resolveBooking(id, undefined);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    const pdfBytes = await buildLrPdf(resolved.booking, resolved.parties);
    return pdfResponse(pdfBytes, resolved.booking.lrNo || id);
  } catch (err) {
    return failPdf(err);
  }
}

export async function POST(req: NextRequest) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    let body: { id?: string; booking?: Booking; parties?: Party[] } = {};
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const resolved = await resolveBooking(body.id, body.booking);
    if ("error" in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const parties =
      Array.isArray(body.parties) && body.parties.length
        ? body.parties
        : resolved.parties;

    const pdfBytes = await buildLrPdf(resolved.booking, parties);
    return pdfResponse(pdfBytes, resolved.booking.lrNo || resolved.booking.id);
  } catch (err) {
    return failPdf(err);
  }
}
