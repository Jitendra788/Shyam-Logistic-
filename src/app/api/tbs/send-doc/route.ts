import { failSave, ok, requireAuth, bad } from "@/lib/tbs/api";
import { sendPdfViaGmail } from "@/lib/tbs/sendPdfGmail";
import { COMPANY_GMAIL, getGmailSmtp } from "@/lib/tbs/gmailSecret";
import { buildLrPdf } from "@/lib/tbs/lrPdf";
import { buildBillPdfBlob } from "@/lib/tbs/billPdf";
import { getBills, getBookings, getParties } from "@/lib/tbs/store";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMPANY_NAME = "SHYAM LOGISTICS";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function pdfFromRequest(body: {
  kind?: string;
  id?: string;
  pdfBase64?: string;
}): Promise<{ bytes: Uint8Array; fileName: string }> {
  const kind = String(body.kind || "");
  const id = String(body.id || "").trim();
  if (kind === "booking" && id) {
    const [bookings, parties] = await Promise.all([
      getBookings(),
      getParties().catch(() => [] as Party[]),
    ]);
    const booking = bookings.find((b) => b.id === id || b.lrNo === id);
    if (!booking) throw new Error("Booking not found. Save first, then email.");
    const bytes = await buildLrPdf(booking, parties);
    return { bytes, fileName: `LR-${booking.lrNo || id}.pdf` };
  }
  if (kind === "bill" && id) {
    const [bills, bookings, parties] = await Promise.all([
      getBills(),
      getBookings(),
      getParties().catch(() => [] as Party[]),
    ]);
    const bill = bills.find((b: Bill) => b.id === id || b.billNo === id);
    if (!bill) throw new Error("Bill not found. Save first, then email.");
    const blob = await buildBillPdfBlob({
      bill,
      bookings: bookings as Booking[],
      parties,
    });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    return { bytes, fileName: `Bill-${bill.billNo || id}.pdf` };
  }
  const pdfBase64 = String(body.pdfBase64 || "").replace(
    /^data:application\/pdf;base64,/,
    "",
  );
  if (!pdfBase64 || pdfBase64.length < 80) {
    throw new Error("PDF missing");
  }
  return {
    bytes: Buffer.from(pdfBase64, "base64"),
    fileName: "document.pdf",
  };
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      to?: string;
      subject?: string;
      text?: string;
      fileName?: string;
      pdfBase64?: string;
      kind?: string;
      id?: string;
    };
    const to = String(body.to || "").trim();
    if (!validEmail(to)) return bad("Enter Receiver Email ID me sahi email likho");

    const built = await pdfFromRequest(body);
    const fileName = (body.fileName || built.fileName).replace(/[^\w.\-]+/g, "_");
    const smtp = await getGmailSmtp();
    const pass = smtp.pass;
    if (!pass) {
      return bad(
        "Company email setup nahi hai. Gmail App Password server pe save nahi mili.",
      );
    }

    try {
      await sendPdfViaGmail({
        user: COMPANY_GMAIL,
        pass,
        to,
        subject: body.subject || `${COMPANY_NAME} document`,
        text: body.text || "Please find the attached PDF.",
        fileName,
        pdfBytes: built.bytes,
      });
      return ok({ ok: true, to, from: COMPANY_GMAIL });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gmail send failed";
      console.error("Gmail SMTP send-doc failed", msg);
      return bad(`Gmail se email nahi gayi: ${msg}`);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "PDF missing" || msg.startsWith("Booking") || msg.startsWith("Bill")) {
      return bad(msg);
    }
    return failSave(e);
  }
}
