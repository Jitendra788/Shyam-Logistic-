/** Open WhatsApp with a pre-filled message (works on phone + desktop WhatsApp Web). */
export function shareOnWhatsApp(message: string) {
  const text = message.trim();
  if (!text) {
    alert("Nothing to share");
    return;
  }

  // Prefer native share sheet on mobile (user can pick WhatsApp)
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

/** Share a PDF file on WhatsApp (native share sheet). Text-only wa.me is not used. */
export async function sharePdfOnWhatsApp(blob: Blob, fileName: string) {
  const name = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  const file = new File([blob], name, { type: "application/pdf" });
  const payload: ShareData = { files: [file], title: name };
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (typeof nav.share === "function" && nav.canShare?.(payload)) {
    try {
      await nav.share(payload);
      return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
  }

  // Desktop browsers often cannot attach files to WhatsApp Web via URL.
  // Save the PDF so it can be attached in WhatsApp.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
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
  return [
    "*SHYAM LOGISTICS*",
    "Consignment Note / LR",
    "",
    `LR No: *${b.lrNo}*`,
    `Date: ${fmt(b.lrDate)}`,
    `Party: ${b.billingParty || b.consignee || b.consignor}`,
    `From: ${b.from || "—"} → To: ${b.to || "—"}`,
    b.vehicleNo ? `Vehicle: ${b.vehicleNo}` : "",
    amt ? `Amount: ₹ ${amt.toFixed(2)}` : "",
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
    `Broker: ${c.brokerOwner || "—"}`,
    `Vehicle: ${c.vehicleNo || "—"}`,
    `From: ${c.fromStation || "—"} → To: ${c.toStation || "—"}`,
    `Freight: ₹ ${Number(c.freight || 0).toFixed(2)}`,
    `Balance: ₹ ${Number(c.balance || 0).toFixed(2)}`,
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
    `Party: ${b.partyName}`,
    `Amount: ₹ ${Number(b.totalAmount || 0).toFixed(2)}`,
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
    `Party: ${r.partyName}`,
    `Paid: ₹ ${Number(r.paidAmt || 0).toFixed(2)}`,
    `Date: ${fmt(r.transactionDate)}`,
    "",
    "Thank you.",
  ].join("\n");
}

function fmt(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}
