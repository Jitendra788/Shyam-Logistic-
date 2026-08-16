import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { amountInWordsINR } from "@/lib/tbs/amountWords";
import {
  BILL_ADDRESS,
  BILL_BANK,
  billedPartyInfo,
  billPrintTotal,
  buildBillLines,
  displayBillNo,
  fmtBillDate,
  type BillPrintLine,
} from "@/lib/tbs/billPrint";
import { sharePdfOnWhatsApp } from "@/lib/tbs/whatsapp";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

/** Old Frm_billprinting page: US Letter landscape. */
const PAGE_W = 792;
const PAGE_H = 612;
const RED = rgb(0.75, 0, 0);
const BLACK = rgb(0, 0, 0);

const COLS = [
  { t: "Sr No", x: 24, w: 38 },
  { t: "LR No", x: 62, w: 50 },
  { t: "LR Date", x: 112, w: 70 },
  { t: "Invoice No", x: 182, w: 78 },
  { t: "Weight", x: 260, w: 52 },
  { t: "Vehicle No.", x: 312, w: 78 },
  { t: "From", x: 390, w: 62 },
  { t: "To", x: 452, w: 62 },
  { t: "Freight", x: 514, w: 50 },
  { t: "Halting", x: 564, w: 42 },
  { t: "Hamali", x: 606, w: 44 },
  { t: "Other", x: 650, w: 44 },
  { t: "Total Bill", x: 694, w: 74 },
];

function line(
  page: PDFPage,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness = 0.9,
) {
  page.drawLine({
    start: { x: x1, y: y1 },
    end: { x: x2, y: y2 },
    thickness,
    color: BLACK,
  });
}

function rect(page: PDFPage, x: number, y: number, w: number, h: number, thickness = 1.4) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: BLACK,
    borderWidth: thickness,
    color: undefined,
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
  if (!value) return;
  page.drawText(value.slice(0, 140), { x, y, size, font, color });
}

function center(
  page: PDFPage,
  font: PDFFont,
  value: string,
  y: number,
  size: number,
  color = BLACK,
) {
  const w = font.widthOfTextAtSize(value, size);
  text(page, font, value, (PAGE_W - w) / 2, y, size, color);
}

async function embedPng(pdf: PDFDocument, url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await pdf.embedPng(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function drawRow(
  page: PDFPage,
  font: PDFFont,
  row: BillPrintLine | null,
  y: number,
  rowH: number,
  tableLeft: number,
  tableRight: number,
) {
  line(page, tableLeft, y, tableRight, y, 0.6);
  if (!row) return;
  const baseline = y - rowH + 5;
  const values = [
    row.sr,
    row.lrNo,
    row.lrDate,
    row.invNo,
    row.weight,
    row.vehicle,
    row.from,
    row.to,
    row.freight,
    row.halting,
    row.hamali,
    row.other,
    row.total,
  ];
  values.forEach((v, i) => {
    const col = COLS[i];
    const tw = font.widthOfTextAtSize(v, 8);
    const x = col.x + Math.max(2, (col.w - tw) / 2);
    text(page, font, v, x, baseline, 8);
  });
}

export async function buildBillPdfBlob(opts: {
  bill: Bill;
  bookings: Booking[];
  parties?: Party[];
}): Promise<Blob> {
  const { bill, bookings, parties = [] } = opts;
  const lrs = bookings.filter((b) => (bill.lrIds || []).includes(b.id));
  const lines = buildBillLines(lrs, bill);
  const total = billPrintTotal(bill, lrs);
  const { address, gstNo } = billedPartyInfo(bill.partyName, lrs, parties);
  const shownNo = displayBillNo(bill.billNo, bill.billDate);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);

  const logo = await embedPng(pdf, "/brand/shyam-peacock-mark.png");
  const stamp = await embedPng(pdf, "/brand/shyam-stamp.png");

  const outer = 18;
  rect(page, outer, 16, PAGE_W - outer * 2, PAGE_H - 32, 1.8);

  center(page, font, "|| Shri Ganesh Prasanna ||", 574, 10);
  if (logo) {
    page.drawImage(logo, { x: 28, y: 518, width: 48, height: 48 });
  }
  center(page, serif, "SHYAM LOGISTICS", 546, 26, RED);
  center(
    page,
    font,
    `${BILL_ADDRESS} E-mail :shyamlogisticscompany535@gmail.com`,
    530,
    8,
  );
  center(page, bold, "Mobile : 8459858242 / 9057420562", 517, 9);
  center(page, bold, "GST : 27AXGPL2293R1ZP", 500, 11);

  const boxL = 24;
  const boxR = PAGE_W - 24;
  const boxTop = 492;
  const boxBot = 418;
  rect(page, boxL, boxBot, boxR - boxL, boxTop - boxBot, 1.5);
  line(page, boxL, 470, boxR, 470, 1.2);
  center(page, bold, "Tax Invoice", 476, 13);

  const splitX = 568;
  line(page, splitX, boxBot, splitX, 470, 1.1);
  text(page, bold, "Party Name", 32, 454, 9);
  text(page, bold, bill.partyName || "", 118, 454, 10);
  text(page, bold, "Address", 32, 438, 9);
  text(page, font, address || "", 118, 438, 9);
  text(page, bold, "GST No", 32, 424, 9);
  text(page, bold, gstNo || "", 118, 424, 9);
  text(page, bold, "Bill No", 578, 450, 9);
  text(page, bold, shownNo, 628, 450, 10);
  text(page, bold, "Date", 578, 428, 9);
  text(page, bold, fmtBillDate(bill.billDate), 628, 428, 10);

  const tableTop = boxBot;
  const tableLeft = boxL;
  const tableRight = boxR;
  const headerH = 18;
  const rowH = 16;
  const minRows = Math.max(lines.length, 10);
  const tableBottom = tableTop - headerH - minRows * rowH;

  line(page, tableLeft, tableTop, tableRight, tableTop, 1.4);
  COLS.forEach((c) => {
    const tw = bold.widthOfTextAtSize(c.t, 8);
    text(page, bold, c.t, c.x + Math.max(2, (c.w - tw) / 2), tableTop - 13, 8);
  });
  line(page, tableLeft, tableTop - headerH, tableRight, tableTop - headerH, 0.8);

  for (let i = 0; i < minRows; i++) {
    const y = tableTop - headerH - i * rowH;
    drawRow(page, font, lines[i] || null, y, rowH, tableLeft, tableRight);
  }

  const gx = [tableLeft, ...COLS.map((c) => c.x + c.w).slice(0, -1), tableRight];
  const tableHeadY = tableTop;
  gx.forEach((x) => line(page, x, tableHeadY, x, tableBottom, 0.7));
  line(page, tableLeft, tableBottom, tableRight, tableBottom, 1);

  const totTop = tableBottom;
  const totBot = totTop - 22;
  rect(page, tableLeft, totBot, tableRight - tableLeft, totTop - totBot, 1.3);
  text(page, bold, "Total Freight : -", 32, totBot + 7, 11);
  text(page, bold, String(total), 128, totBot + 7, 12);
  const totalCol = COLS[12];
  text(page, bold, "Freight", 656, totBot + 7, 11);
  const totW = bold.widthOfTextAtSize(String(total), 11);
  text(page, bold, String(total), totalCol.x + totalCol.w - totW - 6, totBot + 7, 11);
  line(page, 650, totBot, 650, totTop, 0.7);
  line(page, totalCol.x, totBot, totalCol.x, totTop, 0.7);

  const wordsTop = totBot;
  const wordsBot = wordsTop - 20;
  rect(page, tableLeft, wordsBot, tableRight - tableLeft, wordsTop - wordsBot, 1.3);
  text(page, bold, "Amount in words:", 32, wordsBot + 6, 10);
  text(page, font, amountInWordsINR(total), 128, wordsBot + 6, 9);

  text(page, bold, "Bank Details :", 32, wordsBot - 16, 11);
  text(page, font, `Account Holder : ${BILL_BANK.holder}`, 32, wordsBot - 32, 10);
  text(page, font, `Account No ${BILL_BANK.accountNo}`, 230, wordsBot - 32, 10);
  text(page, font, `IFSC Code ${BILL_BANK.ifsc}`, 32, wordsBot - 48, 10);
  text(page, font, `Branch : ${BILL_BANK.branch}`, 230, wordsBot - 48, 10);

  if (bill.remark) {
    text(page, bold, "Remark:", 32, wordsBot - 64, 9);
    text(page, font, bill.remark.slice(0, 90), 80, wordsBot - 64, 9);
  }

  if (stamp) {
    page.drawImage(stamp, { x: 638, y: 48, width: 78, height: 78 });
  }
  text(page, bold, "Authorised Signature", 32, 36, 11);
  text(page, bold, "Reciever's Sign", 326, 36, 11);
  text(page, bold, "For Shyam Logistics", 638, 36, 11);

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
  const name = displayBillNo(opts.bill.billNo, opts.bill.billDate).replaceAll("/", "-");
  await sharePdfOnWhatsApp(blob, `${name || "Bill"}.pdf`);
}
