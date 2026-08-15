import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { isSqliteReady, sqliteGet, sqliteSet } from "@/lib/db/sqlite";
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

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

function redisClient(): Redis | null {
  const url =
    env("UPSTASH_REDIS_REST_URL") ||
    env("KV_REST_API_URL") ||
    env("UPSTASH_REDIS_URL") ||
    env("REDIS_URL");
  const token =
    env("UPSTASH_REDIS_REST_TOKEN") ||
    env("KV_REST_API_TOKEN") ||
    env("UPSTASH_REDIS_TOKEN") ||
    env("REDIS_TOKEN");
  if (!url || !token) return null;
  if (!url.startsWith("http")) return null;
  return new Redis({ url, token });
}

/** True when the SQLite database file can be written. */
export function isTbsPersistent(): boolean {
  return isSqliteReady();
}

function redisKey(file: string) {
  return `shyam:tbs:v3:${file}`;
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

function isEmptyStoreValue(value: unknown) {
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  if (mem.has(file)) {
    return mem.get(file) as T;
  }

  const fromDisk = await readFromFs<T>(file);
  const fromSql = sqliteGet<T>(file);
  if (fromSql !== undefined) {
    if (isEmptyStoreValue(fromSql) && fromDisk && !isEmptyStoreValue(fromDisk)) {
      mem.set(file, fromDisk);
      sqliteSet(file, fromDisk);
      return fromDisk;
    }
    mem.set(file, fromSql);
    return fromSql;
  }

  const redis = redisClient();
  if (redis) {
    try {
      const val = await redis.get<T>(redisKey(file));
      if (val !== null && val !== undefined) {
        mem.set(file, val);
        sqliteSet(file, val);
        return val;
      }
    } catch (err) {
      console.error("Upstash read failed", file, err);
    }
  }

  if (fromDisk !== null) {
    mem.set(file, fromDisk);
    sqliteSet(file, fromDisk);
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
  sqliteSet(file, fallback);
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
  if (!sqliteSet(file, data)) {
    throw new Error(
      "SQLite save failed. Make sure the data folder is writable.",
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
  vehicles: [],
  brokers: ["All"],
  particulars: [],
  partyTypes: ["Consigner/Consignee", "Broker"],
  gstPaidBy: ["Consignor", "Consignee", "Broker", "Company", "Transporter"],
  lrTypes: ["Paid", "ToPay", "To Pay", "TBB", "Cancel"],
  gstLabels: ["GST @ 0%", "GST @ 5%", "GST @ 12%", "GST @ 18%"],
};

const seedParties: Party[] = [];

const seedBookings: Booking[] = [];

const seedChallans: Challan[] = [];

const seedLhp: LhpPayment[] = [];
const seedBills: Bill[] = [];
const seedMr: MoneyReceipt[] = [];
const seedNotes: NoteVoucher[] = [];

export async function getMasters() {
  const raw = await readJson("masters.json", defaultMasters);
  return {
    ...defaultMasters,
    ...raw,
    gstPaidBy: raw.gstPaidBy?.length ? raw.gstPaidBy : defaultMasters.gstPaidBy,
    lrTypes: raw.lrTypes?.length ? raw.lrTypes : defaultMasters.lrTypes,
    gstLabels: raw.gstLabels?.length ? raw.gstLabels : defaultMasters.gstLabels,
    partyTypes: ["Consigner/Consignee", "Broker"],
  };
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

/** Wipe all TBS transport data (keeps default masters lists). */
export async function wipeAllTbsData() {
  mem.clear();
  await Promise.all([
    writeJson("parties.json", [] as Party[]),
    writeJson("bookings.json", [] as Booking[]),
    writeJson("challans.json", [] as Challan[]),
    writeJson("lhp-payments.json", [] as LhpPayment[]),
    writeJson("bills.json", [] as Bill[]),
    writeJson("money-receipts.json", [] as MoneyReceipt[]),
    writeJson("notes.json", [] as NoteVoucher[]),
    writeJson("masters.json", { ...defaultMasters }),
  ]);
  return { ok: true as const };
}
