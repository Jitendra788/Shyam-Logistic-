import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
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

/** Process-local cache (helps within one serverless instance). */
const mem = new Map<string, unknown>();

function redisClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() ||
    process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
    process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/** True when writes survive across deploys / cold starts (Upstash / Vercel KV). */
export function isTbsPersistent(): boolean {
  return Boolean(redisClient());
}

function redisKey(file: string) {
  return `shyam:tbs:${file}`;
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // read-only hosts
  }
}

async function readFromFs<T>(file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeToFs<T>(file: string, data: T): Promise<boolean> {
  await ensureDir();
  try {
    await fs.writeFile(
      path.join(DATA_DIR, file),
      JSON.stringify(data, null, 2),
      "utf8",
    );
    return true;
  } catch {
    return false;
  }
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  if (mem.has(file)) {
    return mem.get(file) as T;
  }

  const redis = redisClient();
  if (redis) {
    try {
      const val = await redis.get<T>(redisKey(file));
      if (val !== null && val !== undefined) {
        mem.set(file, val);
        return val;
      }
    } catch (err) {
      console.error("Upstash read failed", file, err);
    }
  }

  const fromDisk = await readFromFs<T>(file);
  if (fromDisk !== null) {
    mem.set(file, fromDisk);
    // Warm Redis so later writes/reads stay consistent
    if (redis) {
      try {
        await redis.set(redisKey(file), fromDisk);
      } catch {
        /* ignore */
      }
    }
    return fromDisk;
  }

  mem.set(file, fallback);
  if (redis) {
    try {
      await redis.set(redisKey(file), fallback);
    } catch {
      /* ignore */
    }
  } else {
    await writeToFs(file, fallback);
  }
  return fallback;
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  mem.set(file, data);

  const redis = redisClient();
  if (redis) {
    try {
      await redis.set(redisKey(file), data);
      return;
    } catch (err) {
      console.error("Upstash write failed", file, err);
      throw new Error("Server data save failed (Redis). Check Upstash env vars.");
    }
  }

  const ok = await writeToFs(file, data);
  if (!ok) {
    throw new Error(
      "Server cannot save/delete data. Vercel → Settings → Environment Variables me UPSTASH_REDIS_REST_URL aur UPSTASH_REDIS_REST_TOKEN set karke Redeploy karo.",
    );
  }
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
    partyCode: "1047",
    partyName: "Shanbhag Engineering Works",
    contactNo: "9876543210",
    address: "Miraj",
    gstTin: "27AAAAA0000A1Z5",
    partyType: "Customer",
    panNo: "",
    opBalance: 0,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p2",
    partyCode: "1048",
    partyName: "Vijay Engineering & Mahchinry pvt Ltd",
    contactNo: "9822000000",
    address: "Kolhapur",
    gstTin: "",
    partyType: "Customer",
    panNo: "",
    opBalance: 0,
    accountStartFrom: "2025-04-01",
  },
  {
    id: "p3",
    partyCode: "1049",
    partyName: "jitendra",
    contactNo: "8459858242",
    address: "Sangli",
    gstTin: "",
    partyType: "Customer",
    panNo: "",
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
    from: "Sangli",
    to: "Pune",
    vehicleNo: "MH10AB1234",
    deliveryAt: "Pune",
    billingParty: "Shanbhag Engineering Works",
    consignor: "Shanbhag Engineering Works",
    consignee: "ABC Traders",
    address: "Pune",
    gstNo: "",
    noOfArticles: "10",
    particulars: "PUMPS",
    invNoDate: "",
    actualWt: 1000,
    chargedWt: 1000,
    rate: 5,
    freight: 5000,
    hamali: 0,
    stCharges: 0,
    lrCharges: 50,
    doorDelivery: 0,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 5050,
    grandTotal: 5050,
    gstPaidBy: "Consignor",
    ewayBillNo: "",
    validDate: "",
    lrType: "TBB",
    valueRs: 50000,
    delivered: true,
  },
  {
    id: "b3",
    bookingFrom: "Sangli",
    lrNo: "390",
    lrDate: "2026-08-10",
    from: "Sangli",
    to: "Mumbai",
    vehicleNo: "MH09CD5678",
    deliveryAt: "Mumbai",
    billingParty: "Vijay Engineering & Mahchinry pvt Ltd",
    consignor: "Vijay Engineering & Mahchinry pvt Ltd",
    consignee: "XYZ",
    address: "Mumbai",
    gstNo: "",
    noOfArticles: "5",
    particulars: "MACHINERY",
    invNoDate: "",
    actualWt: 2000,
    chargedWt: 2000,
    rate: 8,
    freight: 16000,
    hamali: 500,
    stCharges: 0,
    lrCharges: 50,
    doorDelivery: 950,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 17500,
    grandTotal: 17500,
    gstPaidBy: "Consignor",
    ewayBillNo: "",
    validDate: "",
    lrType: "TBB",
    valueRs: 200000,
    delivered: true,
  },
];

const seedChallans: Challan[] = [
  {
    id: "c1",
    challanNo: "1152",
    challanDate: "2026-08-12",
    vehicleNo: "MH10AB1234",
    brokerOwner: "DIRECT LORRY BY VANDER",
    brokerPan: "",
    fromStation: "Sangli",
    toStation: "Pune",
    freight: 20000,
    advance: 5000,
    transfer: 0,
    cash: 0,
    fuel: 5000,
    balance: 10000,
    driverName: "",
    licenceNo: "",
    engine: "",
    chessy: "",
    insuNo: "",
    owner: "",
    panNo: "",
    lrIds: ["b1"],
  },
];

const seedLhp: LhpPayment[] = [];
const seedBills: Bill[] = [
  {
    id: "bill1",
    billNo: "147",
    billDate: "2026-08-11",
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

export function nextCode(
  items: {
    partyCode?: string;
    lrNo?: string;
    challanNo?: string;
    billNo?: string;
    mrNo?: string;
    voucherNo?: string;
  }[],
  key: string,
  start = 1000,
) {
  const nums = items
    .map((i) => Number((i as Record<string, string>)[key]))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : start - 1;
  return String(max + 1);
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
