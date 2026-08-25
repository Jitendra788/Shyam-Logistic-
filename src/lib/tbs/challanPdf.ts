import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { BILL_ADDRESS, fmtBillDate } from "@/lib/tbs/billPrint";
import { embedBrandPng } from "@/lib/tbs/embedBrandPng";
import { sharePdfOnWhatsApp } from "@/lib/tbs/whatsapp";
import { pdfWinAnsi } from "@/lib/tbs/pdfWinAnsi";
import type { Booking, Challan } from "@/lib/tbs/types";

/** Old RptChallan / 1151.pdf — US Letter portrait. */
const PAGE_W = 612;
const PAGE_H = 792;
const RED = rgb(0.75, 0, 0);
const BLACK = rgb(0, 0, 0);

const COL_X = [44, 63, 121, 185, 339, 415, 499, 586];

function line(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0.7,
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color: BLACK,
  });
}

function rect(page: PDFPage, x: number, y: number, w: number, h: number, thickness = 1.2) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: BLACK,
    borderWidth: thickness,
  });
}

function text(
  page: PDFPage,
  font: PDFFont,
  value: string,
  x: number,
  y: number,
  size: number,
  color = BLACK,
) {
  const safe = pdfWinAnsi(value);
  if (!safe) return;
  page.drawText(safe.slice(0, 80), { x, y, size, font, color });
}

function center(
  page: PDFPage,
  font: PDFFont,
  value: string,
  y: number,
  size: number,
  color = BLACK,
) {
  const safe = pdfWinAnsi(value);
  if (!safe) return;
  const w = font.widthOfTextAtSize(safe, size);
  text(page, font, safe, (PAGE_W - w) / 2, y, size, color);
}

export function memoAmt(n: number, cash = false) {
  const v = Number(n) || 0;
  if (cash) return v.toFixed(2);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function pdfY(top: number) {
  return PAGE_H - top;
}

export async function buildChallanPdfBlob(opts: {
  challan: Challan;
  bookings: Booking[];
}): Promise<Blob> {
  const { challan, bookings } = opts;
  const lrs = bookings.filter((b) => (challan.lrIds || []).includes(b.id));
  const pkgTotal = lrs.reduce((s, b) => s + (Number(b.noOfArticles) || 0), 0);
  const wtTotal = lrs.reduce(
    (s, b) => s + (Number(b.actualWt || b.chargedWt) || 0),
    0,
  );

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const logo = await embedBrandPng(pdf, "shyam-peacock-mark.png");
  const stamp = await embedBrandPng(pdf, "shyam-stamp.png");

  rect(page, 44, 22, 542, 737, 1.3);

  text(page, bold, `GST : 27AXGPL2293R1ZP`, 47, pdfY(46), 9);
  center(page, font, "|| Shree Ganesh Prasanna ||", pdfY(48), 9);
  text(page, bold, "Mob :8459858242", 497, pdfY(46), 8);
  text(page, bold, "9057420562", 524, pdfY(56), 8);

  if (logo) {
    page.drawImage(logo, { x: 128, y: pdfY(91), width: 42, height: 42 });
  }
  center(page, serif, "SHYAM LOGISTICS", pdfY(78), 26, RED);
  center(
    page,
    font,
    `${BILL_ADDRESS} E-mail :shyamlogisticscompany535@gmail.com`,
    pdfY(102),
    8,
  );

  line(page, 44, pdfY(107), 586, pdfY(107), 1);
  center(page, bold, "LORRY MEMO", pdfY(122), 13);
  line(page, 44, pdfY(130), 586, pdfY(130), 0.9);

  const rows: Array<[string, string, string, string, string, string]> = [
    ["Lorry No", challan.vehicleNo, "Date", fmtBillDate(challan.challanDate), "Memo No", challan.challanNo],
    ["Broker Name", challan.brokerOwner, "PAN No.", challan.brokerPan, "Engine No.", challan.engine],
    ["Driver Name", challan.driverName, "From", challan.fromStation, "To", challan.toStation],
    ["Owner Name", challan.owner, "PAN No.", challan.panNo, "Chessy", challan.chessy],
  ];
  const labelX = [48, 301, 450];
  const valueX = [121, 343, 498];
  rows.forEach((r, i) => {
    const y = pdfY(144 + i * 18);
    text(page, font, r[0], labelX[0], y, 9);
    text(page, bold, r[1], valueX[0], y, 9);
    text(page, font, r[2], labelX[1], y, 9);
    text(page, bold, r[3], valueX[1], y, 9);
    text(page, font, r[4], labelX[2], y, 9);
    text(page, bold, r[5], valueX[2], y, 9);
  });

  const tableTop = 204;
  const headerH = 22;
  const rowH = 18;
  const minRows = Math.max(lrs.length, 18);
  const dataBottom = tableTop + headerH + minRows * rowH;

  line(page, 44, pdfY(tableTop), 586, pdfY(tableTop), 1);
  const headers = ["Sr", "LR No", "No of Pkg.", "Content", "Act.Weight", "From", "To"];
  headers.forEach((h, i) => {
    const cx = (COL_X[i] + COL_X[i + 1]) / 2;
    const tw = bold.widthOfTextAtSize(h, 8);
    text(page, bold, h, cx - tw / 2, pdfY(tableTop + 15), 8);
  });
  line(page, 44, pdfY(tableTop + headerH), 586, pdfY(tableTop + headerH), 0.7);

  const cell = (vals: string[], rowIndex: number) => {
    const y = pdfY(tableTop + headerH + rowIndex * rowH + 13);
    vals.forEach((v, i) => {
      const safe = pdfWinAnsi(v);
      const cx = (COL_X[i] + COL_X[i + 1]) / 2;
      const tw = font.widthOfTextAtSize(safe, 8);
      text(page, font, safe, cx - tw / 2, y, 8);
    });
  };

  lrs.forEach((b, i) => {
    cell(
      [
        String(i + 1),
        b.lrNo || "",
        b.noOfArticles || "",
        b.particulars || "",
        String(b.actualWt || b.chargedWt || ""),
        b.from || b.bookingFrom || "",
        b.to || "",
      ],
      i,
    );
  });

  for (let i = 0; i < minRows; i++) {
    line(
      page,
      44,
      pdfY(tableTop + headerH + i * rowH),
      586,
      pdfY(tableTop + headerH + i * rowH),
      0.35,
    );
  }

  const charges: Array<[string, string, boolean]> = [
    ["Total Freight", memoAmt(challan.freight), true],
    ["Advance", memoAmt(challan.advance), false],
    ["Transfer", memoAmt(challan.transfer), false],
    ["Cash", memoAmt(challan.cash, true), false],
    ["Fuel", memoAmt(challan.fuel), false],
    ["Balance", memoAmt(challan.balance), false],
  ];
  const chargeTop = dataBottom;
  charges.forEach(([lab, val, first], i) => {
    const yTop = chargeTop + i * 18;
    const y = pdfY(yTop + 13);
    text(page, bold, lab, 420, y, 9);
    const tw = bold.widthOfTextAtSize(val, 9);
    text(page, bold, val, 582 - tw - 4, y, 9);
    if (first) {
      const tot = [
        String(lrs.length || ""),
        "",
        String(pkgTotal || ""),
        "",
        String(wtTotal || ""),
      ];
      tot.forEach((v, ci) => {
        const cx = (COL_X[ci] + COL_X[ci + 1]) / 2;
        const w = bold.widthOfTextAtSize(v, 9);
        text(page, bold, v, cx - w / 2, y, 9);
      });
    }
    line(page, 415, pdfY(yTop), 586, pdfY(yTop), 0.5);
  });
  const chargeBot = chargeTop + charges.length * 18;
  line(page, 44, pdfY(chargeTop), 415, pdfY(chargeTop), 0.8);
  line(page, 415, pdfY(chargeBot), 586, pdfY(chargeBot), 0.8);
  line(page, 44, pdfY(chargeBot + 52), 586, pdfY(chargeBot + 52), 0.8);

  COL_X.forEach((x, i) => {
    const toY = i >= 5 ? chargeBot : chargeTop;
    line(page, x, pdfY(tableTop), x, pdfY(toY), 0.4);
  });
  line(page, 44, pdfY(tableTop), 44, pdfY(chargeTop), 0.6);
  line(page, 586, pdfY(tableTop), 586, pdfY(chargeBot), 0.6);

  text(page, bold, "For Shyam Logistics", 477, pdfY(chargeBot + 16), 10);
  if (stamp) {
    page.drawImage(stamp, { x: 488, y: pdfY(chargeBot + 92), width: 72, height: 72 });
  }
  text(page, bold, "Driver Sign", 56, pdfY(chargeBot + 58), 10);

  const bytes = await pdf.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export async function shareChallanPdfOnWhatsApp(opts: {
  challan: Challan;
  bookings: Booking[];
}) {
  let blob: Blob;
  try {
    const res = await fetch("/api/tbs/challans/pdf", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    if (!res.ok) throw new Error("server");
    blob = await res.blob();
    if (blob.type && !blob.type.includes("pdf") && blob.size < 80) {
      throw new Error("server");
    }
  } catch {
    blob = await buildChallanPdfBlob(opts);
  }
  await sharePdfOnWhatsApp(
    blob,
    `Lorry-Memo-${opts.challan.challanNo || opts.challan.id}.pdf`,
  );
}
