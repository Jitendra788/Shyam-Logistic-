import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/tbs/api";
import { buildChallanPdfBlob } from "@/lib/tbs/challanPdf";
import type { Booking, Challan } from "@/lib/tbs/types";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const body = (await req.json()) as {
      challan?: Challan;
      bookings?: Booking[];
    };
    if (!body.challan?.id && !body.challan?.challanNo) {
      return NextResponse.json({ error: "Missing challan" }, { status: 400 });
    }
    const blob = await buildChallanPdfBlob({
      challan: body.challan,
      bookings: Array.isArray(body.bookings) ? body.bookings : [],
    });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Challan.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Challan PDF failed", err);
    const msg = err instanceof Error ? err.message : "Challan PDF failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
