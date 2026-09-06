import { partyLabel } from "@/lib/tbs/partyLabel";
import { billPrintAmount, displayBillNo, fmtBillDate } from "@/lib/tbs/billPrint";
import type { Bill, Booking } from "@/lib/tbs/types";

export const EMAIL_COMPANY = {
  name: "SHYAM LOGISTICS",
  owner: "Mohanlal",
  phone: "8459858242",
  phone2: "9057420562",
  email: "shyamlogisticscompany535@gmail.com",
  website: "www.shyamlogistic.online",
  address:
    "Gate No.295/2, B/1, Near Laxmi Tekadi, Shri Mahalaxmi Petrol Pump 5 Star MIDC Kagal, Kolhapur. 416216",
  gstin: "27AXGPL2293R1ZP",
};

function esc(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtPhone(n: string) {
  const d = n.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return n;
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}

function money(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "";
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export type EmailRow = { label: string; value: string };

export function bookingEmailRows(b: Booking): EmailRow[] {
  const amt = Number(b.grandTotal || b.total || b.freight || 0);
  const party =
    partyLabel(b.billingParty) || partyLabel(b.consignee) || partyLabel(b.consignor);
  const rows: EmailRow[] = [
    { label: "Document", value: "Consignment Note / LR" },
    { label: "LR No", value: b.lrNo || "" },
    { label: "Date", value: fmtDate(b.lrDate) },
    { label: "Party", value: party },
    { label: "From", value: b.from || "" },
    { label: "To", value: b.to || "" },
  ];
  if (b.vehicleNo) rows.push({ label: "Vehicle", value: b.vehicleNo });
  if (amt) rows.push({ label: "Amount", value: money(amt) });
  return rows.filter((r) => r.value);
}

export function billEmailRows(bill: Bill, bookings: Booking[]): EmailRow[] {
  const amt = billPrintAmount(bookings, bill);
  return [
    { label: "Document", value: "Tax Invoice / Transport Bill" },
    { label: "Bill No", value: displayBillNo(bill.billNo, bill.billDate) },
    { label: "Date", value: fmtBillDate(bill.billDate) },
    { label: "Party", value: partyLabel(bill.partyName) },
    { label: "Amount", value: money(amt) },
  ].filter((r) => r.value);
}

export function buildDocEmail(opts: {
  title: string;
  rows: EmailRow[];
  fileName: string;
}): { html: string; text: string } {
  const co = EMAIL_COMPANY;
  const phones = `${fmtPhone(co.phone)} / ${fmtPhone(co.phone2)}`;
  const rowHtml = opts.rows
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 10px;border:1px solid #222;font-weight:700;width:140px;background:#f7f7f7;">${esc(r.label)}</td>
          <td style="padding:8px 10px;border:1px solid #222;">${esc(r.value)}</td>
        </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(opts.title)}</title>
  <style>
    @media print {
      body { margin: 0; }
      .sheet { border: none !important; box-shadow: none !important; }
    }
  </style>
</head>
<body style="margin:0;padding:16px;background:#eee;font-family:Arial,Helvetica,sans-serif;color:#111;">
  <div class="sheet" style="max-width:640px;margin:0 auto;background:#fff;border:2px solid #111;padding:18px 20px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:2px solid #b30000;padding-bottom:10px;margin-bottom:12px;">
      <tr>
        <td width="72" valign="top">
          <img src="cid:shyam-logo" width="64" height="64" alt="SHYAM LOGISTICS" style="display:block;border:0;" />
        </td>
        <td valign="top" style="padding-left:10px;">
          <div style="font-size:22px;font-weight:800;color:#b30000;letter-spacing:0.5px;">${esc(co.name)}</div>
          <div style="font-size:13px;font-weight:700;margin-top:2px;">Owner : ${esc(co.owner)}</div>
          <div style="font-size:13px;margin-top:4px;">Mobile : ${esc(phones)}</div>
          <div style="font-size:12px;margin-top:2px;">Email : ${esc(co.email)}</div>
          <div style="font-size:12px;margin-top:2px;">${esc(co.website)}</div>
        </td>
      </tr>
    </table>
    <div style="font-size:11px;margin-bottom:12px;line-height:1.4;">${esc(co.address)}<br/>GST : ${esc(co.gstin)}</div>
    <div style="text-align:center;font-size:16px;font-weight:800;border:1px solid #111;padding:6px 8px;margin-bottom:12px;">${esc(opts.title)}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      ${rowHtml}
    </table>
    <p style="font-size:13px;margin:16px 0 8px;">Please find the attached PDF for print.</p>
    <p style="font-size:12px;color:#333;margin:0 0 18px;">Attachment : ${esc(opts.fileName)}</p>
    <div style="border-top:1px solid #111;padding-top:10px;font-size:13px;">
      <div>Thank you,</div>
      <div style="font-weight:800;margin-top:4px;">For ${esc(co.name)}</div>
      <div style="margin-top:2px;">Owner : ${esc(co.owner)}</div>
      <div style="margin-top:2px;">Mobile : ${esc(phones)}</div>
    </div>
  </div>
</body>
</html>`;

  const text = [
    co.name,
    `Owner : ${co.owner}`,
    `Mobile : ${phones}`,
    `Email : ${co.email}`,
    co.address,
    `GST : ${co.gstin}`,
    "",
    opts.title,
    ...opts.rows.map((r) => `${r.label}: ${r.value}`),
    "",
    `PDF print ke liye attach hai: ${opts.fileName}`,
    "",
    `Thank you,`,
    `For ${co.name}`,
    `Owner : ${co.owner}`,
    `Mobile : ${phones}`,
  ].join("\n");

  return { html, text };
}
