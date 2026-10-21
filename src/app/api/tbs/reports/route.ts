import { NextResponse } from "next/server";
import { requireAuth, ok } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getMoneyReceipts,
  getNotes,
  getParties,
} from "@/lib/tbs/store";
import { buildTbsReport } from "@/lib/tbs/reportBuild";

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "booking";
  const [parties, bookings, bills, receipts, challans, notes] = await Promise.all([
    getParties(),
    getBookings(),
    getBills(),
    getMoneyReceipts(),
    getChallans(),
    getNotes(),
  ]);
  const payload = buildTbsReport(
    kind,
    {
      parties,
      bookings,
      bills,
      receipts,
      challans,
      notes,
    },
    {
      from: searchParams.get("from") || "",
      to: searchParams.get("to") || "",
      party: searchParams.get("party") || "",
      asOf: searchParams.get("asOf") || "",
      status: searchParams.get("status") || "",
    },
  );
  if (!payload) {
    return NextResponse.json({ error: "Unknown report kind" }, { status: 400 });
  }
  return ok(payload);
}
