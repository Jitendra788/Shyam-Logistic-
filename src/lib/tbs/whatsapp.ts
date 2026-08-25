import { partyLabel } from "@/lib/tbs/partyLabel";

/** Open WhatsApp with a pre-filled message (works on phone + desktop WhatsApp Web). */
export function shareOnWhatsApp(message: string) {
  const text = message.trim();
  if (!text) {
    alert("Nothing to share");
    return;
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    void navigator
      .share({ title: "SHYAM LOGISTICS", text })
      .catch(() => openWaMe(text));
    return;
  }

  openWaMe(text);
}

function openWaMe(text: string) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Share a PDF on WhatsApp when the phone allows it; otherwise download the file. */
export async function sharePdfOnWhatsApp(blob: Blob, fileName: string) {
  const name = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  if (!blob || blob.size < 20) {
    throw new Error("PDF ready nahi hai. Print page dubara kholo.");
  }

  const file = new File([blob], name, { type: "application/pdf" });
  const payload: ShareData = { files: [file], title: name };
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (typeof nav.share === "function") {
    try {
      if (!nav.canShare || nav.canShare(payload)) {
        await nav.share(payload);
        return;
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  downloadBlob(blob, name);
  alert("PDF download ho gaya. WhatsApp me attach karke bhejein.");
}

export function bookingWhatsAppText(b: {
  lrNo: string;
  lrDate: string;
  billingParty: string;
  consignor: string;
  consignee: string;
  from: string;
  to: string;
  vehicleNo: string;
  freight: number;
  grandTotal?: number;
  total?: number;
}): string {
  const amt = Number(b.grandTotal || b.total || b.freight || 0);
  const party =
    partyLabel(b.billingParty) || partyLabel(b.consignee) || partyLabel(b.consignor);
  return [
    "*SHYAM LOGISTICS*",
    "Consignment Note / LR",
    "",
    `LR No: *${b.lrNo}*`,
    `Date: ${fmt(b.lrDate)}`,
    `Party: ${party}`,
    `From: ${b.from || "-"} -> To: ${b.to || "-"}`,
    b.vehicleNo ? `Vehicle: ${b.vehicleNo}` : "",
    amt ? `Amount: Rs. ${amt.toFixed(2)}` : "",
    "",
    "Thank you.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function challanWhatsAppText(c: {
  challanNo: string;
  challanDate: string;
  brokerOwner: string;
  vehicleNo: string;
  fromStation: string;
  toStation: string;
  freight: number;
  balance: number;
}): string {
  return [
    "*SHYAM LOGISTICS*",
    "Lorry Hire Contract / Challan",
    "",
    `Challan No: *${c.challanNo}*`,
    `Date: ${fmt(c.challanDate)}`,
    `Broker: ${partyLabel(c.brokerOwner) || "-"}`,
    `Vehicle: ${c.vehicleNo || "-"}`,
    `From: ${c.fromStation || "-"} -> To: ${c.toStation || "-"}`,
    `Freight: Rs. ${Number(c.freight || 0).toFixed(2)}`,
    `Balance: Rs. ${Number(c.balance || 0).toFixed(2)}`,
    "",
    "Thank you.",
  ].join("\n");
}

export function billWhatsAppText(b: {
  billNo: string;
  billDate: string;
  partyName: string;
  totalAmount: number;
}): string {
  return [
    "*SHYAM LOGISTICS*",
    "Transport Bill",
    "",
    `Bill No: *${b.billNo}*`,
    `Date: ${fmt(b.billDate)}`,
    `Party: ${partyLabel(b.partyName)}`,
    `Amount: Rs. ${Number(b.totalAmount || 0).toFixed(2)}`,
    "",
    "Thank you.",
  ].join("\n");
}

export function mrWhatsAppText(r: {
  mrNo: string;
  billNo: string;
  partyName: string;
  paidAmt: number;
  transactionDate: string;
}): string {
  return [
    "*SHYAM LOGISTICS*",
    "Money Receipt",
    "",
    `MR No: *${r.mrNo}*`,
    `Bill No: ${r.billNo}`,
    `Party: ${partyLabel(r.partyName)}`,
    `Paid: Rs. ${Number(r.paidAmt || 0).toFixed(2)}`,
    `Date: ${fmt(r.transactionDate)}`,
    "",
    "Thank you.",
  ].join("\n");
}

function fmt(iso: string) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}
