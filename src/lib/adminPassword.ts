import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";
import { blobGet, blobSet, hasBlobStore } from "@/lib/db/blobKv";
import { getAdminCredentials } from "@/lib/auth";

const KEY = "site:admin-password";
const scrypt = promisify(scryptCb);

type Stored = { salt?: string; hash?: string };

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
  if (hasBlobStore()) {
    const blob = await blobGet<Stored>(KEY);
    if (blob.ok && blob.value?.salt && blob.value?.hash) return blob.value;
  }
  if (hasPostgres()) {
    const row = await pgGet<Stored>(KEY);
    if (row?.salt && row?.hash) return row;
  }
  return null;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  if (!password) return false;
  const stored = await readStored();
  if (stored?.salt && stored?.hash) {
    const hash = await hashPassword(password, stored.salt);
    return safeEqual(hash, stored.hash);
  }
  return safeEqual(password, envPassword());
}

export async function saveAdminPassword(password: string): Promise<boolean> {
  const salt = randomBytes(16).toString("hex");
  const hash = await hashPassword(password, salt);
  const value: Stored = { salt, hash };
  const blobOk = hasBlobStore() ? await blobSet(KEY, value) : false;
  const pgOk = hasPostgres() ? await pgSet(KEY, value) : false;
  return blobOk || pgOk;
}
