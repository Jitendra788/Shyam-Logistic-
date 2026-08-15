import { LineCapStyle, PDFDocument, StandardFonts, rgb, type PDFPage, type PDFImage } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import type { Booking, Party } from "@/lib/tbs/types";
import { getSettings } from "@/lib/store";

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

function partyOf(parties: Party[], name: string) {
  return parties.find(
    (p) => p.partyName.trim().toLowerCase() === name.trim().toLowerCase(),
  );
}

type Pt = { x: number; y: number; size?: number; right?: number; mid?: boolean };

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
  lorryNo: { x: 70.8, y: 66.7 },
  bookingFrom: { x: 100.2, y: 91.3 },
  deliveryAt: { x: 316.2, y: 91.3 },
  lrNo: { x: 484.2, y: 91.3, size: 11 },
  from: { x: 100.8, y: 109.7 },
  to: { x: 285.9, y: 109.7, size: 10 },
  date: { x: 483.6, y: 109.7 },
  consignor: { x: 76.0, y: 131.2, size: 9 },
  consignorAddr: { x: 26.4, y: 146.5, size: 8 },
  consignorGst: { x: 76.0, y: 173.2, size: 8 },
  consignee: { x: 352.0, y: 131.2, size: 9 },
  consigneeAddr: { x: 304.0, y: 149.2, size: 8 },
  consigneeGst: { x: 352.0, y: 173.2, size: 8 },
  articles: { x: 25.0, y: 217.1 },
  particulars: { x: 69.9, y: 217.1 },
  invNo: { x: 268.0, y: 217.1 },
  rate: { x: 348.8, y: 217.0 },
  actWt: { x: 340.0, y: 265.1 },
  chgWt: { x: 340.0, y: 307.1 },
  freight: { x: 502.0, y: FREIGHT_MID.freight, size: 8, right: 504, mid: true },
  doorColl: { x: 502.0, y: FREIGHT_MID.doorColl, size: 8, right: 504, mid: true },
  doorDel: { x: 502.0, y: FREIGHT_MID.doorDel, size: 8, right: 504, mid: true },
  hamali: { x: 502.0, y: FREIGHT_MID.hamali, size: 8, right: 504, mid: true },
  stChgs: { x: 502.0, y: FREIGHT_MID.stChgs, size: 8, right: 504, mid: true },
  totalAmt: { x: 502.0, y: FREIGHT_MID.totalAmt, size: 8, right: 504, mid: true },
  gstAmt: { x: 502.0, y: FREIGHT_MID.gstAmt, size: 8, right: 504, mid: true },
  advance: { x: 502.0, y: FREIGHT_MID.advance, size: 8, right: 504, mid: true },
  balance: { x: 502.0, y: FREIGHT_MID.balance, size: 8, right: 504, mid: true },
  remark: { x: 520.0, y: 217.1, size: 8 },
  eway: { x: 86.0, y: 352.5 },
  validDate: { x: 278.0, y: 352.5 },
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

function publicFile(url: string) {
  const rel = url.replace(/^\//, "").replace(/^public[\\/]/, "");
  return path.join(process.cwd(), "public", rel);
}

function isDefaultSiteLogo(url: string) {
  return /shyam-logo|shyam-brand|shyam-mark|shyam-peacock|\/brand\/logo/i.test(
    url,
  );
}

/** Website logo as PNG/JPG bytes (pdf-lib cannot embed WebP). */
async function readSiteLogoBytes(): Promise<Uint8Array | null> {
  const settings = await getSettings();
  const custom = settings.logoUrl?.trim() || "";
  const paths: string[] = [];
  if (custom && !isDefaultSiteLogo(custom)) {
    paths.push(publicFile(custom));
    paths.push(publicFile(custom.replace(/\.webp$/i, ".png")));
    paths.push(publicFile(custom.replace(/\.webp$/i, ".jpg")));
  }
  paths.push(publicFile("/brand/shyam-peacock-mark.png"));
  paths.push(publicFile("/brand/shyam-brand-logo.png"));
  const seen = new Set<string>();
  for (const file of paths) {
    if (seen.has(file)) continue;
    seen.add(file);
    try {
      const buf = await readFile(file);
      if (buf[0] === 0x89 && buf[1] === 0x50) return buf; // PNG
      if (buf[0] === 0xff && buf[1] === 0xd8) return buf; // JPEG
    } catch {
      /* try next */
    }
  }
  return null;
}

async function embedSiteLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  const bytes = await readSiteLogoBytes();
  if (!bytes) return null;
  if (bytes[0] === 0x89) return pdf.embedPng(bytes);
  return pdf.embedJpg(bytes);
}

/** Cover printed peacock + place website logo (copy 1 / copy 2). */
const LOGO_BOXES = [
  { x: 18.2, y: 7.6, w: 57, h: 41 },
  { x: 18.2, y: 428.6, w: 58, h: 44 },
];

function drawSiteLogo(page: PDFPage, image: PDFImage, copyIndex: 0 | 1) {
  const box = LOGO_BOXES[copyIndex];
  const pdfY = PAGE_H - box.y - box.h;
  page.drawRectangle({
    x: box.x - 1,
    y: pdfY - 1,
    width: box.w + 2,
    height: box.h + 2,
    color: rgb(1, 1, 1),
  });
  const dims = image.scaleToFit(box.w, box.h);
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
  const blankPath = path.join(
    process.cwd(),
    "public",
    "brand",
    "lr-form-blank.pdf",
  );
  const bytes = await readFile(blankPath);
  const pdf = await PDFDocument.load(bytes);
  const donor = await PDFDocument.load(bytes);
  const [copied] = await pdf.copyPages(donor, [0]);
  pdf.addPage(copied);
  const page1 = pdf.getPages()[0];
  const page2 = pdf.getPages()[1];
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const siteLogo = await embedSiteLogo(pdf);

  const consignor = partyOf(parties, booking.consignor);
  const consignee = partyOf(parties, booking.consignee);
  const lrType = (booking.lrType || "").toLowerCase();
  const fromStation = booking.from || booking.bookingFrom || "";
  const rateLabel = booking.rate ? String(booking.rate) : "FIX";
  const actWt = booking.actualWt ? String(booking.actualWt) : "";
  const chgWt = booking.chargedWt ? String(booking.chargedWt) : actWt;

  const values: Record<string, string> = {
    lorryNo: booking.vehicleNo || "",
    bookingFrom: booking.bookingFrom || "",
    deliveryAt: booking.deliveryAt || "",
    lrNo: booking.lrNo || "",
    from: fromStation,
    to: booking.to || "",
    date: dmy(booking.lrDate),
    consignor: booking.consignor || "",
    consignorAddr: consignor?.address || "",
    consignorGst: consignor?.gstTin || "",
    consignee: booking.consignee || "",
    consigneeAddr: consignee?.address || booking.address || "",
    consigneeGst: consignee?.gstTin || booking.gstNo || "",
    articles: booking.noOfArticles || "",
    particulars: booking.particulars || "",
    invNo: booking.invNoDate || "",
    rate: rateLabel,
    actWt,
    chgWt,
    freight: amt(booking.freight),
    doorColl: amt(booking.doorColle),
    doorDel: amt(booking.doorDelivery),
    hamali: amt(booking.hamali),
    stChgs: amt(booking.stCharges),
    totalAmt: amt(booking.total || booking.grandTotal),
    gstAmt: amt(booking.gstAmt),
    advance: "",
    balance: amt(booking.grandTotal || booking.total),
    remark: "",
    eway: booking.ewayBillNo || "",
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
      const size = f.size ?? 9;
      const useBold = boldKeys.has(key);
      const fnt = useBold ? fontBold : font;
      let x = f.x;
      if (f.right != null) {
        const tw = fnt.widthOfTextAtSize(text, size);
        x = f.right - tw;
      }
      if (f.mid && f.right != null) {
        const tw = fnt.widthOfTextAtSize(text, size);
        const padX = f.right - tw - 1;
        const padH = size + 2;
        const padTop = f.y + dy - padH / 2;
        page.drawRectangle({
          x: padX,
          y: PAGE_H - padTop - padH,
          width: tw + 2,
          height: padH,
          color: rgb(1, 1, 1),
        });
      }
      page.drawText(text, {
        x,
        y: f.mid ? baseYMid(f.y + dy, size) : baseY(f.y + dy, size),
        size,
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
  if (siteLogo) {
    drawSiteLogo(page1, siteLogo, 0);
    drawSiteLogo(page1, siteLogo, 1);
  }
  // Page 2: Transporter copy (top only)
  drawCopy(page2, 0, "transporter");
  if (siteLogo) drawSiteLogo(page2, siteLogo, 0);
  page2.drawRectangle({
    x: 0,
    y: 0,
    width: page2.getWidth(),
    height: PAGE_H - 412,
    color: rgb(1, 1, 1),
  });

  return pdf.save();
}
