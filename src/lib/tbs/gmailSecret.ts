import { env as nodeEnv } from "node:process";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";
import { blobGet, blobSet, hasBlobStore } from "@/lib/db/blobKv";

const KEY = "site:gmail-smtp";

export const COMPANY_GMAIL = "shyamlogisticscompany535@gmail.com";

function readRuntime(name: string) {
  const bag =
    (globalThis as { process?: { env?: NodeJS.ProcessEnv } }).process?.env ||
    nodeEnv;
  return String(bag[name] || "").trim();
}

type Stored = { user?: string; pass?: string };

export async function getGmailSmtp(): Promise<{ user: string; pass: string }> {
  const fromEnv = {
    user: readRuntime("SMTP_USER") || COMPANY_GMAIL,
    pass: readRuntime("GMAIL_APP_PASSWORD") || readRuntime("SMTP_PASS"),
  };
  let stored: Stored | undefined;
  if (hasBlobStore()) {
    const blob = await blobGet<Stored>(KEY);
    if (blob.ok && blob.value?.pass) stored = blob.value;
  }
  if (!stored?.pass && hasPostgres()) {
    stored = await pgGet<Stored>(KEY);
  }
  const user = COMPANY_GMAIL;
  const pass = fromEnv.pass || stored?.pass || "";
  if (pass) await saveGmailSmtp(user, pass);
  return { user, pass };
}

export async function saveGmailSmtp(user: string, pass: string) {
  const value = {
    user: user.trim() || COMPANY_GMAIL,
    pass: pass.replace(/\s/g, ""),
  };
  if (!value.pass) return false;
  const blobOk = hasBlobStore() ? await blobSet(KEY, value) : false;
  const pgOk = hasPostgres() ? await pgSet(KEY, value) : false;
  return blobOk || pgOk;
}
