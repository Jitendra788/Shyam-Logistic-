"use client";

import { partyLabel } from "@/lib/tbs/partyLabel";
import { bookingWhatsAppText, billWhatsAppText } from "@/lib/tbs/whatsapp";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

export type SharePerson = {
  role: string;
  name: string;
  email: string;
  phone: string;
};

export function partyEmail(p?: Party | null) {
  return String(p?.email || "").trim();
}

export function typedReceiverEmail(value?: string | null) {
  return String(value || "").trim();
}

export function partyPhone(p?: Party | null) {
  return String(p?.contactNo || "").replace(/[^\d+]/g, "");
}

export function findParty(parties: Party[], name: string) {
  const n = partyLabel(name).trim().toLowerCase();
  if (!n) return undefined;
  return parties.find((p) => partyLabel(p.partyName).trim().toLowerCase() === n);
}

export function bookingSharePeople(booking: Booking, parties: Party[]): SharePerson[] {
  const rows: Array<{ role: string; name: string }> = [
    { role: "Billing", name: booking.billingParty },
    { role: "Consignor", name: booking.consignor },
    { role: "Consignee", name: booking.consignee },
  ];
  const seen = new Set<string>();
  const out: SharePerson[] = [];
  for (const row of rows) {
    const name = partyLabel(row.name);
    if (!name) continue;
    const p = findParty(parties, name);
    const email = partyEmail(p);
    const phone = partyPhone(p);
    const key = `${name}|${email}|${phone}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ role: row.role, name, email, phone });
  }
  return out;
}

export function billSharePeople(bill: Bill, parties: Party[]): SharePerson[] {
  const name = partyLabel(bill.partyName);
  const p = findParty(parties, name);
  return [
    {
      role: "Bill party",
      name,
      email: partyEmail(p),
      phone: partyPhone(p),
    },
  ].filter((x) => x.name);
}

async function blobToBase64(blob: Blob) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

async function fetchPdfBlob(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error || `PDF failed (${res.status})`);
  }
  return res.blob();
}

export async function bookingPdfBlob(booking: Booking, parties: Party[]) {
  return fetchPdfBlob("/api/tbs/bookings/lr-pdf", {
    booking,
    parties,
    id: booking.id,
  });
}

export async function billPdfBlob(
  bill: Bill,
  bookings: Booking[],
  parties: Party[],
) {
  return fetchPdfBlob("/api/tbs/bills/pdf", { bill, bookings, parties });
}

export async function emailPdfTo(opts: {
  to: string;
  subject: string;
  text: string;
  fileName: string;
  blob: Blob;
}) {
  const to = opts.to.trim();
  if (!to || !to.includes("@")) {
    throw new Error("Enter Receiver Email ID me sahi email likho.");
  }
  const pdfBase64 = await blobToBase64(opts.blob);
  const res = await fetch("/api/tbs/send-doc", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject: opts.subject,
      text: opts.text,
      fileName: opts.fileName,
      pdfBase64,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    to?: string;
  };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Company email se PDF nahi gayi");
  }
  return { sent: true as const, to };
}

export function bookingSmsText(booking: Booking) {
  return bookingWhatsAppText(booking);
}

export function billSmsText(bill: Bill) {
  return billWhatsAppText(bill);
}
