import {
  LineCapStyle,
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import { partyLabel } from "@/lib/tbs/partyLabel";
import { pdfWinAnsi } from "@/lib/tbs/pdfWinAnsi";
import type { Booking, Party } from "@/lib/tbs/types";

const PAGE_H = 841.92;
/** Offset between matching fields on copy 1 vs copy 2 (not the gap above copy 2). */
const COPY2_DY = 425.0;

/**
 * PDF text extract Y is the top of the glyph box (origin top-left).
 * pdf-lib drawText Y is the baseline (origin bottom-left).
 */
function baseY(topY: number, fontSize = 9) {
  return PAGE_H - topY - fontSize;
}

/** Vertically center text on a row midpoint (top-left Y). */
function baseYMid(midY: number, fontSize: number) {
  return PAGE_H - midY - fontSize * 0.32;
}

function dmy(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}

function amt(n: number | string | undefined) {
  const v = Number(n) || 0;
  return v ? v.toFixed(2) : "";
}

function partyOf(parties: Party[], name: unknown) {
  const n = partyLabel(name).trim().toLowerCase();
  if (!n) return undefined;
  return parties.find(
    (p) => partyLabel(p.partyName).trim().toLowerCase() === n,
  );
}

type Pt = {
  x: number;
  y: number;
  size?: number;
  right?: number;
  mid?: boolean;
  /** Max width in points — text must never cross this far. */
  maxW?: number;
};

function shrinkToWidth(
  font: PDFFont,
  value: string,
  size: number,
  maxW: number,
): { text: string; size: number } {
  let s = size;
  while (s > 6 && font.widthOfTextAtSize(value, s) > maxW) s -= 0.4;
  if (font.widthOfTextAtSize(value, s) <= maxW) return { text: value, size: s };
  let t = value;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}...`, s) > maxW) {
    t = t.slice(0, -1);
  }
  return { text: `${t}...`, size: s };
}

function wrapToWidth(
  font: PDFFont,
  value: string,
  size: number,
  maxW: number,
  maxLines: number,
): { lines: string[]; size: number } {
  const limit = Math.max(8, maxW - 1);
  let s = size;
  const pack = (sz: number) => {
    const lines: string[] = [];
    let rest = value.trim();
    while (rest && lines.length < maxLines) {
      if (font.widthOfTextAtSize(rest, sz) <= limit) {
        lines.push(rest);
        rest = "";
        break;
      }
      let cut = rest.length;
      while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), sz) > limit) {
        cut -= 1;
      }
      lines.push(rest.slice(0, cut).trimEnd());
      rest = rest.slice(cut).trimStart();
    }
    if (rest && lines.length) {
      lines[lines.length - 1] = shrinkToWidth(
        font,
        lines[lines.length - 1],
        sz,
        limit,
      ).text;
    }
    return lines.filter(Boolean);
  };
  let lines = pack(s);
  while (s > 6.2 && lines.some((ln) => ln.endsWith("..."))) {
    s -= 0.35;
    lines = pack(s);
  }
  return { lines, size: s };
}

/**
 * Freight row mid-Y from blank form grid (value column).
 * Amounts are drawn centered on these so lines do not strike through text.
 */
const FREIGHT_MID: Record<string, number> = {
  freight: 220.14,
  doorColl: 236.23,
  doorDel: 251.49,
  hamali: 265.78,
  stChgs: 279.59,
  totalAmt: 293.88,
  gstAmt: 308.53,
  advance: 322.7,
  balance: 337.35,
};

const FIELDS: Record<string, Pt> = {
  lorryNo: { x: 70.8, y: 66.7, maxW: 170 },
  bookingFrom: { x: 100.2, y: 91.3, maxW: 140 },
  deliveryAt: { x: 316.2, y: 91.3, maxW: 90 },
  lrNo: { x: 484.2, y: 91.3, size: 11, maxW: 80 },
  from: { x: 100.8, y: 109.7, maxW: 140 },
  to: { x: 285.9, y: 109.7, size: 10, maxW: 115 },
  date: { x: 483.6, y: 109.7, maxW: 80 },
  consignor: { x: 76.0, y: 131.2, size: 9, maxW: 210 },
  consignorAddr: { x: 26.4, y: 146.5, size: 8, maxW: 260 },
  consignorGst: { x: 76.0, y: 173.2, size: 8, maxW: 210 },
  consignee: { x: 352.0, y: 131.2, size: 9, maxW: 210 },
  consigneeAddr: { x: 304.0, y: 149.2, size: 8, maxW: 255 },
  consigneeGst: { x: 352.0, y: 173.2, size: 8, maxW: 210 },
  articles: { x: 25.0, y: 217.1, maxW: 40 },
  particulars: { x: 69.9, y: 217.1, maxW: 188 },
  /** Inv.No column ends ~324 (Rate rule ~338). 268+72 overflowed into Rate. */
  invNo: { x: 266.0, y: 214.0, size: 7, maxW: 54 },
  rate: { x: 348.8, y: 217.0, size: 8, maxW: 30 },
  actWt: { x: 340.0, y: 265.1, size: 8, maxW: 42 },
  chgWt: { x: 340.0, y: 307.1, size: 8, maxW: 42 },
  freight: { x: 502.0, y: FREIGHT_MID.freight, size: 8, right: 504, mid: true, maxW: 48 },
  doorColl: { x: 502.0, y: FREIGHT_MID.doorColl, size: 8, right: 504, mid: true, maxW: 48 },
  doorDel: { x: 502.0, y: FREIGHT_MID.doorDel, size: 8, right: 504, mid: true, maxW: 48 },
  hamali: { x: 502.0, y: FREIGHT_MID.hamali, size: 8, right: 504, mid: true, maxW: 48 },
  stChgs: { x: 502.0, y: FREIGHT_MID.stChgs, size: 8, right: 504, mid: true, maxW: 48 },
  totalAmt: { x: 502.0, y: FREIGHT_MID.totalAmt, size: 8, right: 504, mid: true, maxW: 48 },
  gstAmt: { x: 502.0, y: FREIGHT_MID.gstAmt, size: 8, right: 504, mid: true, maxW: 48 },
  advance: { x: 502.0, y: FREIGHT_MID.advance, size: 8, right: 504, mid: true, maxW: 48 },
  balance: { x: 502.0, y: FREIGHT_MID.balance, size: 8, right: 504, mid: true, maxW: 48 },
  remark: { x: 520.0, y: 217.1, size: 8, maxW: 48 },
  eway: { x: 86.0, y: 352.5, maxW: 125 },
  validDate: { x: 278.0, y: 352.5, maxW: 90 },
};

const CHECKS = {
  payTopay: { x: 28.56, y: 373.56, w: 9.6, h: 9.96 },
  payPaid: { x: 70.56, y: 373.56, w: 9.6, h: 9.96 },
  payTbb: { x: 118.56, y: 373.56, w: 9.6, h: 9.96 },
};

/**
 * GST Tax Payable by — 3 separate checkboxes inside the printed box.
 * Right border of the form is ~577; this row must end before 568.
 */
const GST_PAY_ROW = {
  y: 77.6,
  size: 6,
  box: 7,
  items: [
    { key: "consigner", label: "Consigner", x: 420 },
    { key: "consignee", label: "Consignee", x: 468 },
    { key: "transporter", label: "Transporter", x: 518 },
  ] as const,
};

type GstCopyKey = (typeof GST_PAY_ROW.items)[number]["key"];

function drawCheckMark(
  page: PDFPage,
  x: number,
  topY: number,
  size: number,
  dy: number,
) {
  const bottom = PAGE_H - (topY + dy) - size;
  const left = x + size * 0.16;
  const right = x + size * 0.84;
  const midX = x + size * 0.4;
  const midY = bottom + size * 0.22;
  const top = bottom + size * 0.8;
  const startY = bottom + size * 0.48;
  page.drawLine({
    start: { x: left, y: startY },
    end: { x: midX, y: midY },
    thickness: 1.15,
    color: rgb(0, 0, 0),
    lineCap: LineCapStyle.Round,
  });
  page.drawLine({
    start: { x: midX, y: midY },
    end: { x: right, y: top },
    thickness: 1.15,
    color: rgb(0, 0, 0),
    lineCap: LineCapStyle.Round,
  });
}

function drawTick(
  page: PDFPage,
  box: { x: number; y: number; w: number; h: number },
  dy: number,
) {
  drawCheckMark(page, box.x, box.y, Math.min(box.w, box.h), dy);
}

function drawEmptyBox(
  page: PDFPage,
  x: number,
  topY: number,
  size: number,
  dy: number,
) {
  const bottom = PAGE_H - (topY + dy) - size;
  page.drawRectangle({
    x,
    y: bottom,
    width: size,
    height: size,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.8,
  });
}

async function readBrandBytes(rel: string): Promise<Uint8Array> {
  const candidates = [
    path.join(process.cwd(), "public", "brand", rel),
    path.join(process.cwd(), "src", "lib", "tbs", "assets", rel),
  ];
  for (const filePath of candidates) {
    try {
      return await readFile(filePath);
    } catch {
      /* try next */
    }
  }
  throw new Error(`Could not load brand file: ${rel}`);
}

/** Print peacock (white/transparent). Screen mark has a black square — do not use on LR. */
async function readPrintLogoBytes(): Promise<Uint8Array | null> {
  for (const name of [
    "shyam-peacock-mark-print.png",
    "shyam-peacock-mark.png",
  ]) {
    try {
      const buf = await readBrandBytes(name);
      if (buf[0] === 0x89 && buf[1] === 0x50) return buf;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function embedPrintLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  const bytes = await readPrintLogoBytes();
  if (!bytes) return null;
  return pdf.embedPng(bytes);
}

/** Original JPEG peacock boxes on lr-form-blank.pdf (top-left origin). */
const LOGO_BOXES = [
  { x: 20.4, y: 9.8, w: 53.4, h: 37.1 },
  { x: 20.0, y: 431.0, w: 52.0, h: 36.0 },
];

function drawPrintLogo(page: PDFPage, image: PDFImage, copyIndex: 0 | 1) {
  const box = LOGO_BOXES[copyIndex];
  const pdfY = PAGE_H - box.y - box.h;
  page.drawRectangle({
    x: box.x,
    y: pdfY,
    width: box.w,
    height: box.h,
    color: rgb(1, 1, 1),
  });
  const dims = image.scaleToFit(box.w - 1, box.h - 1);
  page.drawImage(image, {
    x: box.x + (box.w - dims.width) / 2,
    y: pdfY + (box.h - dims.height) / 2,
    width: dims.width,
    height: dims.height,
  });
}

export async function buildLrPdf(
  booking: Booking,
  parties: Party[],
): Promise<Uint8Array> {
  const bytes = await readBrandBytes("lr-form-blank.pdf");
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const [copied] = await pdf.copyPages(donor, [0]);
  pdf.addPage(copied);
  const page1 = pdf.getPages()[0];
  const page2 = pdf.getPages()[1];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const printLogo = await embedPrintLogo(pdf);

  const consignor = partyOf(parties, booking.consignor);
  const consignee = partyOf(parties, booking.consignee);
  const lrType = (booking.lrType || "").toLowerCase();
  const fromStation = booking.from || booking.bookingFrom || "";
  const rateLabel = booking.rate ? String(booking.rate) : "FIX";
  const actWt = booking.actualWt ? String(booking.actualWt) : "";
  const chgWt = booking.chargedWt ? String(booking.chargedWt) : actWt;

  const values: Record<string, string> = {
    lorryNo: pdfWinAnsi(booking.vehicleNo),
    bookingFrom: pdfWinAnsi(booking.bookingFrom),
    deliveryAt: pdfWinAnsi(booking.deliveryAt),
    lrNo: pdfWinAnsi(booking.lrNo),
    from: pdfWinAnsi(fromStation),
    to: pdfWinAnsi(booking.to),
    date: dmy(booking.lrDate),
    consignor: pdfWinAnsi(booking.consignor),
    consignorAddr: pdfWinAnsi(consignor?.address),
    consignorGst: pdfWinAnsi(consignor?.gstTin),
    consignee: pdfWinAnsi(booking.consignee),
    consigneeAddr: pdfWinAnsi(consignee?.address || booking.address),
    consigneeGst: pdfWinAnsi(consignee?.gstTin || booking.gstNo),
    articles: pdfWinAnsi(booking.noOfArticles),
    particulars: pdfWinAnsi(booking.particulars),
    invNo: pdfWinAnsi(booking.invNoDate),
    rate: pdfWinAnsi(rateLabel),
    actWt: pdfWinAnsi(actWt),
    chgWt: pdfWinAnsi(chgWt),
    freight: "",
    doorColl: "",
    doorDel: "",
    hamali: "",
    stChgs: "",
    totalAmt: "",
    gstAmt: "",
    advance: "",
    balance: "",
    remark: "",
    eway: pdfWinAnsi(booking.ewayBillNo),
    validDate: booking.validDate ? dmy(booking.validDate) : "",
  };

  const boldKeys = new Set(["lrNo", "to", "consignor", "consignee"]);

  function drawGstPayRow(page: PDFPage, dy: number, ticked: GstCopyKey) {
    const cfg = GST_PAY_ROW;
    const boxSize = cfg.box;
    const labelSize = cfg.size;
    for (const item of cfg.items) {
      drawEmptyBox(page, item.x, cfg.y, boxSize, dy);
      if (item.key === ticked) {
        drawCheckMark(page, item.x, cfg.y, boxSize, dy);
      }
      page.drawText(item.label, {
        x: item.x + boxSize + 1.6,
        y: baseY(cfg.y + 0.5 + dy, labelSize),
        size: labelSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  function drawCopy(page: PDFPage, dy: number, ticked: GstCopyKey) {
    drawGstPayRow(page, dy, ticked);

    for (const [key, text] of Object.entries(values)) {
      if (!text) continue;
      const f = FIELDS[key];
      if (!f) continue;
      const size0 = f.size ?? 9;
      const useBold = boldKeys.has(key);
      const fnt = useBold ? fontBold : font;
      const wrapKeys = new Set(["invNo", "particulars", "consignorAddr", "consigneeAddr"]);
      if (f.maxW && wrapKeys.has(key)) {
        const wrapped = wrapToWidth(
          fnt,
          text,
          size0,
          f.maxW,
          key === "invNo" ? 4 : 2,
        );
        wrapped.lines.forEach((line, i) => {
          page.drawText(line, {
            x: f.x,
            y: baseY(f.y + dy + i * (wrapped.size + 1.5), wrapped.size),
            size: wrapped.size,
            font: fnt,
            color: rgb(0, 0, 0),
          });
        });
        continue;
      }
      const fitted = f.maxW
        ? shrinkToWidth(fnt, text, size0, f.maxW)
        : { text, size: size0 };
      let x = f.x;
      if (f.right != null) {
        const tw = fnt.widthOfTextAtSize(fitted.text, fitted.size);
        x = f.right - tw;
      }
      if (f.mid && f.right != null) {
        const tw = fnt.widthOfTextAtSize(fitted.text, fitted.size);
        const padX = f.right - tw - 1;
        const padH = fitted.size + 2;
        const padTop = f.y + dy - padH / 2;
        page.drawRectangle({
          x: padX,
          y: PAGE_H - padTop - padH,
          width: tw + 2,
          height: padH,
          color: rgb(1, 1, 1),
        });
      }
      page.drawText(fitted.text, {
        x,
        y: f.mid ? baseYMid(f.y + dy, fitted.size) : baseY(f.y + dy, fitted.size),
        size: fitted.size,
        font: fnt,
        color: rgb(0, 0, 0),
      });
    }

    const ticks = [
      {
        box: CHECKS.payTopay,
        on: lrType.includes("to pay") || lrType.includes("topay"),
      },
      { box: CHECKS.payPaid, on: lrType === "paid" },
      { box: CHECKS.payTbb, on: lrType.includes("tbb") },
    ];
    for (const t of ticks) {
      if (!t.on) continue;
      drawTick(page, t.box, dy);
    }
  }

  // Page 1: Consigner copy (top) + Consignee copy (bottom)
  drawCopy(page1, 0, "consigner");
  drawCopy(page1, COPY2_DY, "consignee");
  if (printLogo) {
    drawPrintLogo(page1, printLogo, 0);
    drawPrintLogo(page1, printLogo, 1);
  }
  // Page 2: Transporter copy (top only)
  drawCopy(page2, 0, "transporter");
  if (printLogo) drawPrintLogo(page2, printLogo, 0);
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: page2.getWidth(),
    height: PAGE_H - 412,
    color: rgb(1, 1, 1),
  });

  return pdf.save();
}
