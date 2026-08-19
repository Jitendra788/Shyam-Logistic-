import type { Bill, Booking, Party } from "@/lib/tbs/types";
import { billExtraCharges } from "@/lib/tbs/billAmount";

export const BILL_ADDRESS =
  "Jajal Petrol Pump, Pune-Bangalore Highway, Vikaswadi, Kolhapur 416 234(Mah.)";

export const BILL_BANK = {
  holder: "Shyam Logistics",
  accountNo: "50200116108322",
  ifsc: "HDFC0005373",
  branch: "Sangli (Current A/c)",
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Indian FY label used on old bills: SGL/25-26/128 */
export function financialYearLabel(iso?: string) {
  const d = iso ? new Date(`${iso}T00:00:00`) : new Date();
  const y = Number.isFinite(d.getTime()) ? d.getFullYear() : new Date().getFullYear();
  const m = Number.isFinite(d.getTime()) ? d.getMonth() + 1 : new Date().getMonth() + 1;
  const start = m >= 4 ? y : y - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}

export function billSerial(billNo: string) {
  const raw = String(billNo || "").trim();
  const m = raw.match(/(\d+)\s*$/);
  return m ? m[1].replace(/^0+(?=\d)/, "") : raw;
}

/** Old Frm_billprinting number: SGL/25-26/128 */
export function displayBillNo(billNo: string, billDate?: string) {
  const raw = String(billNo || "").trim();
  if (/^SGL\//i.test(raw)) return raw.toUpperCase();
  const n = billSerial(raw);
  if (!n) return "";
  return `SGL/${financialYearLabel(billDate)}/${n}`;
}

export function fmtBillDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}-${m}-${y}` : iso;
}

export function fmtLrDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  if (!y || !m || !d || mi < 0 || mi > 11) return fmtBillDate(iso);
  return `${d}-${MONTHS_SHORT[mi]}-${y}`;
}

export function partyOf(parties: Party[], name: string) {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  return parties.find((p) => p.partyName.trim().toLowerCase() === q);
}

function blankNum(n: number) {
  const v = Number(n) || 0;
  if (!v) return "";
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

export type BillPrintLine = {
  sr: string;
  lrNo: string;
  lrDate: string;
  invNo: string;
  weight: string;
  vehicle: string;
  from: string;
  to: string;
  freight: string;
  halting: string;
  hamali: string;
  other: string;
  total: string;
  chargeLabel?: boolean;
};

export function lrOtherCharges(b: Booking) {
  return (
    Number(b.otherChrg || 0) +
    Number(b.stCharges || 0) +
    Number(b.lrCharges || 0) +
    Number(b.doorDelivery || 0) +
    Number(b.doorColle || 0)
  );
}

/** Crystal Rptbilling parameters from billmaster. */
export function billCrystalCharges(bill?: Partial<Bill>) {
  return [
    ["LR Charges", Number(bill?.lrCharges) || 0],
    ["Detention", Number(bill?.detention) || 0],
    ["Hamali", Number(bill?.hamali) || 0],
    ["Door Delivery", Number(bill?.doorDelivery) || 0],
    ["Door Collection", Number(bill?.doorCollection) || 0],
    ["Other", Number(bill?.other) || 0],
  ] as const;
}

export function billLrSum(lrs: Booking[]) {
  return lrs.reduce((s, b) => s + Number(b.grandTotal || b.freight || 0), 0);
}

export function buildBillLines(lrs: Booking[]): BillPrintLine[] {
  return lrs.map((b, i) => {
    const freight = Number(b.freight || 0);
    const hamali = Number(b.hamali || 0);
    const halting = Number(b.barrier || 0);
    const other = lrOtherCharges(b);
    const rowTotal = Number(b.grandTotal) || freight + hamali + halting + other;
    return {
      sr: String(i + 1),
      lrNo: b.lrNo || "",
      lrDate: fmtLrDate(b.lrDate),
      invNo: b.invNoDate || "",
      weight: blankNum(Number(b.chargedWt || b.actualWt || 0)),
      vehicle: b.vehicleNo || "",
      from: b.from || b.bookingFrom || "",
      to: b.to || "",
      freight: blankNum(freight),
      halting: blankNum(halting),
      hamali: blankNum(hamali),
      other: blankNum(other),
      total: blankNum(rowTotal),
    };
  });
}

export function billedPartyInfo(
  partyName: string,
  lrs: Booking[],
  parties: Party[],
) {
  const party = partyOf(parties, partyName);
  return {
    address: party?.address || lrs[0]?.address || "",
    gstNo: party?.gstTin || lrs[0]?.gstNo || "",
  };
}

export function billPrintTotal(bill: Bill, lrs: Booking[]) {
  const lrSum = billLrSum(lrs);
  return Number(bill.totalAmount) || lrSum + billExtraCharges(bill);
}
