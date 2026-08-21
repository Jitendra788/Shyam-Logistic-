import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { isLibsqlRemote, sqliteGet, sqliteKind, sqliteSet } from "@/lib/db/sqlite";
import { blobGet, blobSet, hasBlobStore } from "@/lib/db/blobKv";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";
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

/** True when every visitor sees the same saved records. */
export function isTbsPersistent(): boolean {
  if (hasPostgres() || isLibsqlRemote() || redisClient() || hasBlobStore()) return true;
  return !process.env.VERCEL;
}

export function tbsStorageKind(): "postgres" | "sqlite" | "redis" | "blob" | "local" {
  if (hasPostgres()) return "postgres";
  if (!process.env.VERCEL) {
    if (sqliteKind() === "sqlite") return "sqlite";
    return "local";
  }
  if (sqliteKind() === "sqlite") return "sqlite";
  if (redisClient()) return "redis";
  if (hasBlobStore()) return "blob";
  return "local";
}

export function tbsBackendFlags() {
  return {
    vercel: Boolean(process.env.VERCEL),
    postgres: hasPostgres(),
    turso: isLibsqlRemote(),
    blob: hasBlobStore(),
    redis: Boolean(redisClient()),
  };
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

async function readJson<T>(file: string, fallback: T): Promise<T> {
  const onVercel = Boolean(process.env.VERCEL);

  if (mem.has(file) && !onVercel) {
    return mem.get(file) as T;
  }

  const fromPg = await pgGet<T>(file);
  if (fromPg !== undefined) {
    if (!onVercel) mem.set(file, fromPg);
    return fromPg;
  }

  const fromSql = await sqliteGet<T>(file);
  if (fromSql !== undefined) {
    if (!onVercel) mem.set(file, fromSql);
    return fromSql;
  }

  if (hasBlobStore()) {
    const blob = await blobGet<T>(file);
    if (blob.ok && blob.value !== undefined) return blob.value;
    if (blob.ok) return fallback;
  }

  const redis = redisClient();
  if (redis) {
    try {
      const val = await redis.get<T>(redisKey(file));
      if (val !== null && val !== undefined) return val;
      return fallback;
    } catch (err) {
      console.error("Upstash read failed", file, err);
    }
  }

  if (onVercel) return fallback;

  const fromDisk = await readFromFs<T>(file);
  if (fromDisk !== null) {
    mem.set(file, fromDisk);
    await sqliteSet(file, fromDisk);
    return fromDisk;
  }

  mem.set(file, fallback);
  await sqliteSet(file, fallback);
  await writeToFs(file, fallback);
  return fallback;
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  if (!process.env.VERCEL) mem.set(file, data);

  const pgOk = await pgSet(file, data);
  const sqlOk = await sqliteSet(file, data);
  const blobOk = hasBlobStore() ? await blobSet(file, data) : false;
  const redis = redisClient();
  let redisOk = false;
  if (redis) {
    try {
      await redis.set(redisKey(file), data);
      redisOk = true;
    } catch (err) {
      console.error("Upstash write failed", file, err);
    }
  }

  if (sqlOk || redisOk || blobOk || pgOk) return;

  if (process.env.VERCEL) {
    throw new Error(
      "Shared database is not connected. Connect Neon Postgres or Blob on Vercel, then Redeploy.",
    );
  }

  const ok = await writeToFs(file, data);
  if (!ok) {
    throw new Error("Server cannot save data.");
  }
}

const STATE_KEY = "tbs-state-v1.json";

type TbsState = {
  parties: Party[];
  bookings: Booking[];
  challans: Challan[];
  payments: LhpPayment[];
  bills: Bill[];
  receipts: MoneyReceipt[];
  notes: NoteVoucher[];
  masters: Masters;
};

function emptyState(): TbsState {
  return {
    parties: [],
    bookings: [],
    challans: [],
    payments: [],
    bills: [],
    receipts: [],
    notes: [],
    masters: { ...defaultMasters },
  };
}

function useSharedState() {
  if (hasPostgres()) return true;
  if (!process.env.VERCEL) return false;
  return isLibsqlRemote() || Boolean(redisClient()) || hasBlobStore();
}

function normalizeState(raw: Partial<TbsState> | null | undefined): TbsState {
  const base = emptyState();
  if (!raw || typeof raw !== "object") return base;
  return {
    parties: Array.isArray(raw.parties) ? raw.parties : [],
    bookings: Array.isArray(raw.bookings) ? raw.bookings : [],
    challans: Array.isArray(raw.challans) ? raw.challans : [],
    payments: Array.isArray(raw.payments) ? raw.payments : [],
    bills: Array.isArray(raw.bills) ? raw.bills : [],
    receipts: Array.isArray(raw.receipts) ? raw.receipts : [],
    notes: Array.isArray(raw.notes) ? raw.notes : [],
    masters: { ...defaultMasters, ...(raw.masters || {}) },
  };
}

let inflightState: Promise<TbsState> | null = null;

async function readCollection<T>(file: string): Promise<T | undefined> {
  const fromPg = await pgGet<T>(file);
  if (fromPg !== undefined) return fromPg;
  const fromSql = await sqliteGet<T>(file);
  if (fromSql !== undefined) return fromSql;
  if (hasBlobStore()) {
    const blob = await blobGet<T>(file);
    if (!blob.ok) {
      throw new Error("Shared storage read failed. Retry in a moment.");
    }
    return blob.value;
  }
  const redis = redisClient();
  if (redis) {
    try {
      const val = await redis.get<T>(redisKey(file));
      if (val !== null && val !== undefined) return val;
    } catch (err) {
      console.error("Upstash read failed", file, err);
      throw new Error("Shared storage read failed. Retry in a moment.");
    }
  }
  return undefined;
}

async function fetchSharedState(): Promise<TbsState> {
  const fromPg = await pgGet<TbsState>(STATE_KEY);
  if (fromPg && typeof fromPg === "object") return normalizeState(fromPg);

  const fromSql = await sqliteGet<TbsState>(STATE_KEY);
  if (fromSql && typeof fromSql === "object") return normalizeState(fromSql);

  if (hasBlobStore()) {
    const blob = await blobGet<TbsState>(STATE_KEY);
    if (!blob.ok) {
      throw new Error("Shared storage read failed. Retry in a moment.");
    }
    if (blob.value) return normalizeState(blob.value);
  }

  const redis = redisClient();
  if (redis) {
    try {
      const val = await redis.get<TbsState>(redisKey(STATE_KEY));
      if (val) return normalizeState(val);
    } catch (err) {
      console.error("Upstash state read failed", err);
      throw new Error("Shared storage read failed. Retry in a moment.");
    }
  }

  const legacy = normalizeState({
    parties: (await readCollection<Party[]>("parties.json")) || [],
    bookings: (await readCollection<Booking[]>("bookings.json")) || [],
    challans: (await readCollection<Challan[]>("challans.json")) || [],
    payments: (await readCollection<LhpPayment[]>("lhp-payments.json")) || [],
    bills: (await readCollection<Bill[]>("bills.json")) || [],
    receipts: (await readCollection<MoneyReceipt[]>("money-receipts.json")) || [],
    notes: (await readCollection<NoteVoucher[]>("notes.json")) || [],
    masters:
      (await readCollection<Masters>("masters.json")) || defaultMasters,
  });
  if (
    legacy.parties.length ||
    legacy.bookings.length ||
    legacy.bills.length ||
    legacy.challans.length
  ) {
    await persistState(legacy);
  }
  return legacy;
}

async function loadState(): Promise<TbsState> {
  if (inflightState) return inflightState;
  inflightState = fetchSharedState().finally(() => {
    inflightState = null;
  });
  return inflightState;
}

async function persistState(state: TbsState): Promise<void> {
  inflightState = Promise.resolve(state);
  try {
    const pgOk = await pgSet(STATE_KEY, state);
    const sqlOk = await sqliteSet(STATE_KEY, state);
    const blobOk = hasBlobStore() ? await blobSet(STATE_KEY, state) : false;
    const redis = redisClient();
    let redisOk = false;
    if (redis) {
      try {
        await redis.set(redisKey(STATE_KEY), state);
        redisOk = true;
      } catch (err) {
        console.error("Upstash state write failed", err);
      }
    }
    if (pgOk || sqlOk || blobOk || redisOk) return;
    if (process.env.VERCEL) {
      throw new Error(
        "Shared database is not connected. Connect Neon Postgres or Blob on Vercel, then Redeploy.",
      );
    }
  } finally {
    inflightState = null;
  }
}

let writeChain: Promise<void> = Promise.resolve();

async function patchState(patch: Partial<TbsState>): Promise<void> {
  const run = writeChain.then(async () => {
    const cur = await fetchSharedState();
    await persistState({ ...cur, ...patch });
  });
  writeChain = run.catch(() => undefined);
  return run;
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
  lrTypes: ["Paid", "ToPay", "TBB", "Cancel"],
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
  const raw = useSharedState()
    ? (await loadState()).masters
    : await readJson("masters.json", defaultMasters);
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
  if (useSharedState()) return patchState({ masters: data });
  return writeJson("masters.json", data);
}

export async function getParties() {
  if (useSharedState()) return (await loadState()).parties;
  return readJson("parties.json", seedParties);
}
export async function saveParties(data: Party[]) {
  if (useSharedState()) return patchState({ parties: data });
  return writeJson("parties.json", data);
}

export async function getBookings() {
  if (useSharedState()) return (await loadState()).bookings;
  return readJson("bookings.json", seedBookings);
}
export async function saveBookings(data: Booking[]) {
  if (useSharedState()) return patchState({ bookings: data });
  return writeJson("bookings.json", data);
}

export async function getChallans() {
  if (useSharedState()) return (await loadState()).challans;
  return readJson("challans.json", seedChallans);
}
export async function saveChallans(data: Challan[]) {
  if (useSharedState()) return patchState({ challans: data });
  return writeJson("challans.json", data);
}

export async function getLhpPayments() {
  if (useSharedState()) return (await loadState()).payments;
  return readJson("lhp-payments.json", seedLhp);
}
export async function saveLhpPayments(data: LhpPayment[]) {
  if (useSharedState()) return patchState({ payments: data });
  return writeJson("lhp-payments.json", data);
}

export async function getBills() {
  if (useSharedState()) return (await loadState()).bills;
  return readJson("bills.json", seedBills);
}
export async function saveBills(data: Bill[]) {
  if (useSharedState()) return patchState({ bills: data });
  return writeJson("bills.json", data);
}

export async function getMoneyReceipts() {
  if (useSharedState()) return (await loadState()).receipts;
  return readJson("money-receipts.json", seedMr);
}
export async function saveMoneyReceipts(data: MoneyReceipt[]) {
  if (useSharedState()) return patchState({ receipts: data });
  return writeJson("money-receipts.json", data);
}

export async function getNotes() {
  if (useSharedState()) return (await loadState()).notes;
  return readJson("notes.json", seedNotes);
}
export async function saveNotes(data: NoteVoucher[]) {
  if (useSharedState()) return patchState({ notes: data });
  return writeJson("notes.json", data);
}

export { nextCode } from "./nextCode";

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Wipe all TBS transport data (keeps default masters lists). */
export async function wipeAllTbsData() {
  mem.clear();
  inflightState = null;
  if (useSharedState()) {
    await persistState(emptyState());
    return { ok: true as const };
  }
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
