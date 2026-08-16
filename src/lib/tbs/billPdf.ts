import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { amountInWordsINR } from "@/lib/tbs/amountWords";
import { sharePdfOnWhatsApp } from "@/lib/tbs/whatsapp";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

const PAGE_W = 841.89;
const PAGE_H = 595.28;
const MARGIN = 28;
const NAVY = rgb(0.04, 0.12, 0.24);
const LINE = rgb(0.15, 0.15, 0.15);
const MUTED = rgb(0.25, 0.25, 0.25);

const BILL_ADDRESS =
  "Jajal Petrol Pump, Pune-Bangalore Highway, Vikaswadi, Kolhapur 416 234(Mah.)";
const BANK = {
  holder: "Shyam Logistics",
  accountNo: "50200116108322",
  ifsc: "HDFC0005373",
  branch: "Sangli (Current A/c)",
};

function dmy(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

function num(n: number) {
  return n ? String(n) : "";
}

function partyOf(parties: Party[], name: string) {
  const q = name.trim().toLowerCase();
  return parties.find((p) => p.partyName.trim().toLowerCase() === q);
}

function drawLine(page: PDFPage, x1: number, y1: number, x2: number, y2: number) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness: 0.6,
    color: LINE,
  });
}

function text(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  y: number,
  size: number,
  color = rgb(0, 0, 0),
) {
  page.drawText(value.slice(0, 120), { x, y, size, font, color });
}

export async function buildBillPdfBlob(opts: {
  bill: Bill;
  bookings: Booking[];
  parties?: Party[];
}): Promise<Blob> {
  const { bill, bookings, parties = [] } = opts;
  const lrs = bookings.filter((b) => (bill.lrIds || []).includes(b.id));
  const extras =
    Number(bill.lrCharges || 0) +
    Number(bill.detention || 0) +
    Number(bill.hamali || 0) +
    Number(bill.doorDelivery || 0) +
    Number(bill.doorCollection || 0) +
    Number(bill.other || 0);
  const lrSum = lrs.reduce((s, b) => s + Number(b.grandTotal || b.freight || 0), 0);
  const total = Number(bill.totalAmount) || lrSum + extras;
  const party = partyOf(parties, bill.partyName);
  const address = party?.address || lrs[0]?.address || "";
  const gstNo = party?.gstTin || lrs[0]?.gstNo || "";

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  try {
    const res = await fetch("/brand/shyam-peacock-mark.png");
    if (res.ok) {
      const img = await pdf.embedPng(await res.arrayBuffer());
      page.drawImage(img, { x: MARGIN, y: PAGE_H - 78, width: 42, height: 42 });
    }
  } catch {
    /* logo optional */
  }

  const right = PAGE_W - MARGIN;
  let y = PAGE_H - 36;
  text(page, font, "|| Shri Ganesh Prasanna ||", PAGE_W / 2 - 70, y, 9, MUTED);
  y -= 18;
  text(page, bold, "SHYAM LOGISTICS", 80, y, 16, NAVY);
  y -= 13;
  text(page, font, BILL_ADDRESS, 80, y, 8, MUTED);
  y -= 11;
  text(
    page,
    font,
    "E-mail : shyamlogisticscompany535@gmail.com  |  Mobile : 8459858242 / 9057420562",
    80,
    y,
    8,
    MUTED,
  );
  y -= 11;
  text(page, bold, "GST : 27AXGPL2293R1ZP", 80, y, 8, NAVY);

  y -= 18;
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: right - MARGIN,
    height: 18,
    color: NAVY,
  });
  text(page, bold, "Tax Invoice", PAGE_W / 2 - 32, y, 12, rgb(1, 1, 1));

  y -= 28;
  text(page, bold, "Party Name", MARGIN, y, 9);
  text(page, font, bill.partyName || "—", MARGIN + 70, y, 10);
  text(page, bold, "Bill No", 560, y, 9);
  text(page, font, String(bill.billNo), 615, y, 10);
  y -= 14;
  text(page, bold, "Address", MARGIN, y, 9);
  text(page, font, address || "—", MARGIN + 70, y, 8);
  text(page, bold, "Date", 560, y, 9);
  text(page, font, dmy(bill.billDate), 615, y, 10);
  y -= 14;
  text(page, bold, "GST No", MARGIN, y, 9);
  text(page, font, gstNo || "—", MARGIN + 70, y, 9);

  y -= 16;
  const cols = [
    { t: "Sr", w: 28 },
    { t: "LR No", w: 48 },
    { t: "LR Date", w: 58 },
    { t: "Invoice No", w: 70 },
    { t: "Weight", w: 48 },
    { t: "Vehicle No.", w: 78 },
    { t: "From", w: 68 },
    { t: "To", w: 68 },
    { t: "Freight", w: 52 },
    { t: "Halting", w: 48 },
    { t: "Hamali", w: 48 },
    { t: "Other", w: 48 },
    { t: "Total Bill", w: 62 },
  ];
  const tableLeft = MARGIN;
  const tableWidth = cols.reduce((s, c) => s + c.w, 0);
  const headerH = 16;
  page.drawRectangle({
    x: tableLeft,
    y: y - headerH + 4,
    width: tableWidth,
    height: headerH,
    color: rgb(0.91, 0.93, 0.96),
  });
  let cx = tableLeft + 3;
  for (const c of cols) {
    text(page, bold, c.t, cx, y - 8, 7);
    cx += c.w;
  }
  drawLine(page, tableLeft, y + 4, tableLeft + tableWidth, y + 4);
  y -= headerH;

  const rows = lrs.length ? lrs : [];
  const minRows = Math.max(rows.length, 4);
  for (let i = 0; i < minRows; i++) {
    const b = rows[i];
    const rowH = 16;
    drawLine(page, tableLeft, y + 4, tableLeft + tableWidth, y + 4);
    if (b) {
      const other =
        Number(b.otherChrg || 0) +
        Number(b.stCharges || 0) +
        Number(b.lrCharges || 0) +
        Number(b.doorDelivery || 0) +
        Number(b.doorColle || 0);
      const freight = Number(b.freight || 0);
      const hamali = Number(b.hamali || 0);
      const halting = Number(b.barrier || 0);
      const rowTotal = Number(b.grandTotal) || freight + hamali + halting + other;
      const values = [
        String(i + 1),
        b.lrNo || "",
        dmy(b.lrDate),
        b.invNoDate || "",
        num(Number(b.chargedWt || b.actualWt || 0)),
        b.vehicleNo || "",
        (b.from || b.bookingFrom || "").slice(0, 12),
        (b.to || "").slice(0, 12),
        num(freight),
        num(halting),
        num(hamali),
        num(other),
        num(rowTotal),
      ];
      cx = tableLeft + 3;
      values.forEach((v, j) => {
        text(page, font, v, cx, y - 8, 7);
        cx += cols[j].w;
      });
    }
    y -= rowH;
  }
  drawLine(page, tableLeft, y + 4, tableLeft + tableWidth, y + 4);
  let gx = tableLeft;
  for (const c of cols) {
    drawLine(page, gx, y + 4 + minRows * 16 + headerH, gx, y + 4);
    gx += c.w;
  }
  drawLine(page, tableLeft + tableWidth, y + 4 + minRows * 16 + headerH, tableLeft + tableWidth, y + 4);

  y -= 10;
  text(page, bold, "Total Freight : -", MARGIN, y, 10);
  text(page, bold, String(total), MARGIN + 110, y, 12, NAVY);
  text(page, bold, "Freight", 680, y, 10);
  text(page, bold, String(total), 740, y, 12, NAVY);

  y -= 18;
  text(page, bold, "Amount in words:", MARGIN, y, 9);
  text(page, font, amountInWordsINR(total), MARGIN + 95, y, 8);

  y -= 20;
  text(page, bold, "Bank Details :", MARGIN, y, 9);
  y -= 12;
  text(page, font, `Account Holder : ${BANK.holder}`, MARGIN, y, 8);
  text(page, font, `Account No ${BANK.accountNo}`, 280, y, 8);
  y -= 11;
  text(page, font, `IFSC Code ${BANK.ifsc}`, MARGIN, y, 8);
  text(page, font, `Branch : ${BANK.branch}`, 280, y, 8);

  if (bill.remark) {
    y -= 14;
    text(page, bold, "Remark:", MARGIN, y, 8);
    text(page, font, bill.remark.slice(0, 90), MARGIN + 48, y, 8);
  }

  y = 36;
  text(page, font, "Authorised Signature", MARGIN, y, 8);
  text(page, font, "Reciever's Sign", 320, y, 8);
  text(page, bold, "For Shyam Logistics", 620, y, 9);

  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export async function shareBillPdfOnWhatsApp(opts: {
  bill: Bill;
  bookings: Booking[];
  parties?: Party[];
}) {
  const blob = await buildBillPdfBlob(opts);
  await sharePdfOnWhatsApp(blob, `Bill-${opts.bill.billNo || opts.bill.id}.pdf`);
}
