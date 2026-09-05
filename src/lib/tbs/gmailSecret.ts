import { env as nodeEnv } from "node:process";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";
import { blobGet, blobSet, hasBlobStore } from "@/lib/db/blobKv";
import { getSettings } from "@/lib/store";

const KEY = "site:gmail-smtp";

export const COMPANY_GMAIL = "shyamlogisticscompany535@gmail.com";

/** Walk env keys so Next/Turbopack cannot replace a named env with "" at build. */
function readRuntime(name: string) {
  const bag =
    (globalThis as { process?: { env?: NodeJS.ProcessEnv } }).process?.env ||
    nodeEnv;
  const key = Object.keys(bag).find((k) => k === name);
  if (!key) return "";
  return String(bag[key] || "").trim();
}

function cleanPass(value: string) {
  return value.replace(/\s/g, "");
}

type Stored = { user?: string; pass?: string };

export async function getGmailSmtp(): Promise<{ user: string; pass: string }> {
  const fromEnv = cleanPass(
    readRuntime("GMAIL_APP_PASSWORD") || readRuntime("SMTP_PASS"),
  );
  let storedPass = "";
  if (hasBlobStore()) {
    const blob = await blobGet<Stored>(KEY);
    if (blob.ok && blob.value?.pass) storedPass = cleanPass(blob.value.pass);
  }
  if (!storedPass && hasPostgres()) {
    const row = await pgGet<Stored>(KEY);
    if (row?.pass) storedPass = cleanPass(row.pass);
  }
  let settingsPass = "";
  try {
    const settings = await getSettings();
    settingsPass = cleanPass(settings.gmailAppPassword || "");
  } catch {
    /* settings store may be unavailable */
  }
  const user = COMPANY_GMAIL;
  const pass = fromEnv || storedPass || settingsPass;
  if (pass) {
    void saveGmailSmtp(user, pass).catch(() => false);
  }
  return { user, pass };
}

export async function saveGmailSmtp(user: string, pass: string) {
  const value = {
    user: user.trim() || COMPANY_GMAIL,
    pass: cleanPass(pass),
  };
  if (!value.pass) return false;
  const blobOk = hasBlobStore() ? await blobSet(KEY, value) : false;
  const pgOk = hasPostgres() ? await pgSet(KEY, value) : false;
  return blobOk || pgOk;
}
