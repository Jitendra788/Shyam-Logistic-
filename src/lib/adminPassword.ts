import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";
import { sqliteGet, sqliteSet } from "@/lib/db/sqlite";
import { blobGet, blobSet, hasBlobStore } from "@/lib/db/blobKv";
import { getAdminCredentials } from "@/lib/auth";

const KEY = "site:admin-password";
const scrypt = promisify(scryptCb);

type Stored = { salt?: string; hash?: string };

let memCache: Stored | null = null;

function envPassword() {
  return getAdminCredentials().password;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

async function hashPassword(password: string, salt: string) {
  const buf = (await scrypt(password, salt, 32)) as Buffer;
  return buf.toString("hex");
}

async function readStored(): Promise<Stored | null> {
  if (memCache?.salt && memCache?.hash) return memCache;
  if (hasBlobStore()) {
    const blob = await blobGet<Stored>(KEY);
    if (blob.ok && blob.value?.salt && blob.value?.hash) {
      memCache = blob.value;
      return blob.value;
    }
  }
  if (hasPostgres()) {
    const row = await pgGet<Stored>(KEY);
    if (row?.salt && row?.hash) {
      memCache = row;
      return row;
    }
  }
  const local = await sqliteGet<Stored>(KEY);
  if (local?.salt && local?.hash) {
    memCache = local;
    return local;
  }
  return null;
}

/** Session stamp — changes when password is saved, so old cookies die. */
export async function getPasswordRev(): Promise<string> {
  const stored = await readStored();
  if (stored?.hash) return stored.hash.slice(0, 16);
  return "env0";
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const stored = await readStored();
  if (stored?.salt && stored?.hash) {
    const hash = await hashPassword(password, stored.salt);
    return safeEqual(hash, stored.hash);
  }
  const env = envPassword();
  if (password.length !== env.length) return false;
  return safeEqual(password, env);
}

export async function saveAdminPassword(password: string): Promise<boolean> {
  const salt = randomBytes(16).toString("hex");
  const hash = await hashPassword(password, salt);
  const value: Stored = { salt, hash };
  memCache = value;
  const blobOk = hasBlobStore() ? await blobSet(KEY, value) : false;
  const pgOk = hasPostgres() ? await pgSet(KEY, value) : false;
  const sqlOk = await sqliteSet(KEY, value);
  return blobOk || pgOk || sqlOk;
}
