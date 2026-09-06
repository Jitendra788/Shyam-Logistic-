import { billPrintAmount, displayBillNo, fmtBillDate } from "@/lib/tbs/billPrint";
import type { Bill, Booking } from "@/lib/tbs/types";

const OWNER = "Mohanlal";
const COMPANY = "SHYAM LOGISTICS";
const PHONES = "84598 58242 / 90574 20562";

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}

function signOff() {
  return [
    "Dhanyavaad.",
    "",
    OWNER,
    `Owner, ${COMPANY}`,
    `Mobile: ${PHONES}`,
  ].join("\n");
}

export function bookingEmailText(b: Booking): { title: string; text: string } {
  const lr = b.lrNo || "";
  const title = `SHYAM LOGISTICS LR ${lr}`.trim();
  const lines = [
    "Namaste,",
    "",
    `${COMPANY} se aapka Consignment Note / LR PDF bhej rahe hain. Print kar lijiye.`,
    "",
    lr ? `LR No: ${lr}` : "",
    b.lrDate ? `Date: ${fmtDate(b.lrDate)}` : "",
    b.from ? `From: ${b.from}` : "",
    b.to ? `To: ${b.to}` : "",
    b.vehicleNo ? `Vehicle: ${b.vehicleNo}` : "",
    "",
    signOff(),
  ].filter((line, i, arr) => line !== "" || arr[i - 1] !== "");
  return { title, text: lines.join("\n").replace(/\n{3,}/g, "\n\n") };
}

export function billEmailText(
  bill: Bill,
  bookings: Booking[],
): { title: string; text: string } {
  const no = displayBillNo(bill.billNo, bill.billDate);
  const amt = billPrintAmount(bookings, bill);
  const title = `SHYAM LOGISTICS Bill ${no}`.trim();
  const lines = [
    "Namaste,",
    "",
    `${COMPANY} se aapka Tax Invoice / Bill PDF bhej rahe hain. Print kar lijiye.`,
    "",
    no ? `Bill No: ${no}` : "",
    bill.billDate ? `Date: ${fmtBillDate(bill.billDate)}` : "",
    amt ? `Amount: Rs. ${amt}` : "",
    "",
    signOff(),
  ].filter((line, i, arr) => line !== "" || arr[i - 1] !== "");
  return { title, text: lines.join("\n").replace(/\n{3,}/g, "\n\n") };
}

export function genericEmailText(fileName: string): { title: string; text: string } {
  return {
    title: `${COMPANY} document`,
    text: [
      "Namaste,",
      "",
      `${COMPANY} se PDF bhej rahe hain. Print kar lijiye.`,
      fileName ? `File: ${fileName}` : "",
      "",
      signOff(),
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
