import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/tbs/api";
import { buildBillPdfBlob } from "@/lib/tbs/billPdf";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;
  try {
    const body = (await req.json()) as {
      bill?: Bill;
      bookings?: Booking[];
      parties?: Party[];
    };
    if (!body.bill?.id && !body.bill?.billNo) {
      return NextResponse.json({ error: "Missing bill" }, { status: 400 });
    }
    const blob = await buildBillPdfBlob({
      bill: body.bill,
      bookings: Array.isArray(body.bookings) ? body.bookings : [],
      parties: Array.isArray(body.parties) ? body.parties : [],
    });
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Bill.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Bill PDF failed", err);
    const msg = err instanceof Error ? err.message : "Bill PDF failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
