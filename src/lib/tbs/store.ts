import { promises as fs } from "fs";
import path from "path";
import type {
  Bill,
  Booking,
  Challan,
  LhpPayment,
  Masters,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "tbs");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDir();
  const p = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(p, JSON.stringify(fallback, null, 2), "utf8");
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

export const defaultMasters: Masters = {
  stations: [
    "Sangli",
    "KAGAL",
    "PANVAL",
    "shirwal",
    "SURAT",
    "Pune",
    "Mumbai",
    "Kolhapur",
  ],
  vehicles: [
    "MH10AB1234",
    "RJ11GD4197",
    "MH45AF7861",
    "WB25N3925",
    "MH09CD5678",
  ],
  brokers: [
    "All",
    "OMSAI CHICODI NISSAR MULLA",
    "DIRECT LORRY BY VANDER",
    "SHREE GAJENDARA",
    "GS TARANSPOT KOP",
    "OMKAR LOGISTICS",
    "DELHI PANJAB ROADLINES",
    "GURUKARPPA PATIL",
    "MAHARVEER TARANSPOT",
    "NEW RAVI TRANSPOT SERVICES",
    "JAY HANUMANGARH",
    "NAMOKAR TRANSPORT",
    "ODC ROADLINES",
    "VINOD AGRAVAL",
  ],
  particulars: ["PUMPS", "CASNUB", "6R1080TA 6H.2", "MACHINERY", "SPARE PARTS"],
  partyTypes: ["Customer", "Consignor", "Consignee", "Both"],
  gstPaidBy: ["Consignor", "Consignee", "Transporter"],
  lrTypes: ["Paid", "To Pay", "TBB"],
};

const seedParties: Party[] = [
  {
    id: "p1",
    partyCode: "1045",
    partyName: "Shanbhag Engineering Company",
    contactNo: "9822012345",
    address: "MIDC Sangli",
    gstTin: "27AABCS1234A1Z5",
    partyType: "Customer",
    panNo: "AABCS1234A",
    opBalance: 0,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p2",
    partyCode: "1046",
    partyName: "Vijay Engineering & Mahchinry pvt Ltd",
    contactNo: "9876543210",
    address: "Kolhapur",
    gstTin: "27AABCV5678B1Z2",
    partyType: "Customer",
    panNo: "AABCV5678B",
    opBalance: 5000,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p3",
    partyCode: "1047",
    partyName: "PATEL HEAT EXCHANGERS PVT LTD",
    contactNo: "9644747779",
    address: "GOVINDPURA BANGALORE",
    gstTin: "29AABCP9999C1Z1",
    partyType: "Customer",
    panNo: "AABCP9999C",
    opBalance: 0,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p4",
    partyCode: "1048",
    partyName: "Electromech Fire Fighters Pvt Ltd",
    contactNo: "9988776655",
    address: "Pune",
    gstTin: "27AABCE1111D1Z3",
    partyType: "Customer",
    panNo: "AABCE1111D",
    opBalance: 1200,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p5",
    partyCode: "1049",
    partyName: "PRIDE RUBBERS",
    contactNo: "9123456780",
    address: "Surat",
    gstTin: "24AABCPR222E1Z4",
    partyType: "Customer",
    panNo: "AABCPR222E",
    opBalance: 0,
    accountStartFrom: "2025-04-01",
  },
];

const seedBookings: Booking[] = [
  {
    id: "b1",
    bookingFrom: "Sangli",
    lrNo: "388",
    lrDate: "2026-08-13",
    from: "KAGAL",
    to: "PANVAL",
    vehicleNo: "MH10AB1234",
    deliveryAt: "Godown",
    billingParty: "Shanbhag Engineering Company",
    consignor: "Shanbhag Engineering Company",
    consignee: "Vijay Engineering & Mahchinry pvt Ltd",
    address: "MIDC Sangli",
    gstNo: "27AABCS1234A1Z5",
    noOfArticles: "10",
    particulars: "6R1080TA 6H.2",
    invNoDate: "INV-101 / 12-08-2026",
    actualWt: 7000,
    chargedWt: 7000,
    rate: 2.07,
    freight: 14500,
    hamali: 0,
    stCharges: 100,
    lrCharges: 0,
    doorDelivery: 0,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 14600,
    grandTotal: 14600,
    gstPaidBy: "Consignor",
    ewayBillNo: "",
    validDate: "2026-08-13",
    lrType: "TBB",
    valueRs: 150000,
    delivered: true,
  },
  {
    id: "b2",
    bookingFrom: "Sangli",
    lrNo: "384",
    lrDate: "2026-08-06",
    from: "shirwal",
    to: "SURAT",
    vehicleNo: "DD01AA9862",
    deliveryAt: "DOOR DLY CC ATT",
    billingParty: "Shanbhag Engineering Company",
    consignor: "KIRLOSKAR BROTHERS LTD",
    consignee: "Shanbhag Engineering Company",
    address: "KIRLOSKARWADI TAL.PALUS SANGLI MH 416308",
    gstNo: "27AAACK7300E1ZZ",
    noOfArticles: "05",
    particulars: "PUMPS",
    invNoDate: "2603000474",
    actualWt: 7000,
    chargedWt: 7000,
    rate: 0,
    freight: 0,
    hamali: 0,
    stCharges: 0,
    lrCharges: 0,
    doorDelivery: 0,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 0,
    grandTotal: 0,
    gstPaidBy: "Consignor",
    ewayBillNo: "212259620838",
    validDate: "2026-08-08",
    lrType: "TBB",
    valueRs: 0,
    delivered: false,
  },
  {
    id: "b3",
    bookingFrom: "Sangli",
    lrNo: "385",
    lrDate: "2026-08-07",
    from: "KAGAL",
    to: "SURAT",
    vehicleNo: "MH45AF7861",
    deliveryAt: "Godown",
    billingParty: "Vijay Engineering & Mahchinry pvt Ltd",
    consignor: "Vijay Engineering & Mahchinry pvt Ltd",
    consignee: "PATEL HEAT EXCHANGERS PVT LTD",
    address: "Kolhapur",
    gstNo: "27AABCV5678B1Z2",
    noOfArticles: "6",
    particulars: "CASNUB",
    invNoDate: "INV-90 / 06-08-2026",
    actualWt: 5000,
    chargedWt: 5000,
    rate: 2.5,
    freight: 12500,
    hamali: 0,
    stCharges: 100,
    lrCharges: 0,
    doorDelivery: 0,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 12600,
    grandTotal: 12600,
    gstPaidBy: "Transporter",
    ewayBillNo: "",
    validDate: "2026-08-13",
    lrType: "Paid",
    valueRs: 60000,
    delivered: true,
  },
];

const seedChallans: Challan[] = [
  {
    id: "c1",
    challanNo: "1152",
    challanDate: "2026-08-13",
    vehicleNo: "RJ11GD4197",
    brokerOwner: "JAY HANUMANGARH",
    brokerPan: "ABCDE1234F",
    fromStation: "Sangli",
    toStation: "SURAT",
    freight: 20000,
    advance: 5000,
    transfer: 0,
    cash: 2000,
    fuel: 3000,
    balance: 10000,
    driverName: "Ramesh Patil",
    licenceNo: "MH10-2020-123",
    engine: "ENG9988",
    chessy: "CHS4455",
    insuNo: "INS-7788",
    owner: "JAY HANUMANGARH",
    panNo: "ABCDE1234F",
    lrIds: ["b2", "b3"],
  },
  {
    id: "c2",
    challanNo: "1023",
    challanDate: "2026-01-17",
    vehicleNo: "RJ11GD4197",
    brokerOwner: "NAMOKAR TRANSPORT",
    brokerPan: "",
    fromStation: "Sangli",
    toStation: "Pune",
    freight: 8000,
    advance: 3000,
    transfer: 0,
    cash: 0,
    fuel: 0,
    balance: 5000,
    driverName: "",
    licenceNo: "",
    engine: "",
    chessy: "",
    insuNo: "",
    owner: "NAMOKAR TRANSPORT",
    panNo: "",
    lrIds: [],
  },
  {
    id: "c3",
    challanNo: "1029",
    challanDate: "2026-01-17",
    vehicleNo: "MH45AF7861",
    brokerOwner: "ODC ROADLINES",
    brokerPan: "",
    fromStation: "Kolhapur",
    toStation: "Mumbai",
    freight: 9000,
    advance: 5000,
    transfer: 0,
    cash: 0,
    fuel: 0,
    balance: 4000,
    driverName: "",
    licenceNo: "",
    engine: "",
    chessy: "",
    insuNo: "",
    owner: "ODC ROADLINES",
    panNo: "",
    lrIds: [],
  },
  {
    id: "c4",
    challanNo: "1030",
    challanDate: "2026-01-18",
    vehicleNo: "WB25N3925",
    brokerOwner: "VINOD AGRAVAL",
    brokerPan: "",
    fromStation: "Sangli",
    toStation: "SURAT",
    freight: 27000,
    advance: 7000,
    transfer: 0,
    cash: 0,
    fuel: 0,
    balance: 20000,
    driverName: "",
    licenceNo: "",
    engine: "",
    chessy: "",
    insuNo: "",
    owner: "VINOD AGRAVAL",
    panNo: "",
    lrIds: [],
  },
];

const seedLhp: LhpPayment[] = [];
const seedBills: Bill[] = [
  {
    id: "bill1",
    billNo: "147",
    billDate: "2026-08-13",
    partyName: "Vijay Engineering & Mahchinry pvt Ltd",
    totalAmount: 17500,
    remark: "",
    submissionDate: "2026-08-13",
    lrIds: ["b3"],
  },
];
const seedMr: MoneyReceipt[] = [];
const seedNotes: NoteVoucher[] = [];

export async function getMasters() {
  return readJson("masters.json", defaultMasters);
}
export async function saveMasters(data: Masters) {
  return writeJson("masters.json", data);
}

export async function getParties() {
  return readJson("parties.json", seedParties);
}
export async function saveParties(data: Party[]) {
  return writeJson("parties.json", data);
}

export async function getBookings() {
  return readJson("bookings.json", seedBookings);
}
export async function saveBookings(data: Booking[]) {
  return writeJson("bookings.json", data);
}

export async function getChallans() {
  return readJson("challans.json", seedChallans);
}
export async function saveChallans(data: Challan[]) {
  return writeJson("challans.json", data);
}

export async function getLhpPayments() {
  return readJson("lhp-payments.json", seedLhp);
}
export async function saveLhpPayments(data: LhpPayment[]) {
  return writeJson("lhp-payments.json", data);
}

export async function getBills() {
  return readJson("bills.json", seedBills);
}
export async function saveBills(data: Bill[]) {
  return writeJson("bills.json", data);
}

export async function getMoneyReceipts() {
  return readJson("money-receipts.json", seedMr);
}
export async function saveMoneyReceipts(data: MoneyReceipt[]) {
  return writeJson("money-receipts.json", data);
}

export async function getNotes() {
  return readJson("notes.json", seedNotes);
}
export async function saveNotes(data: NoteVoucher[]) {
  return writeJson("notes.json", data);
}

export function nextCode(items: { partyCode?: string; lrNo?: string; challanNo?: string; billNo?: string; mrNo?: string; voucherNo?: string }[], key: string, start = 1000) {
  const nums = items
    .map((i) => Number((i as Record<string, string>)[key]))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : start - 1;
  return String(max + 1);
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
