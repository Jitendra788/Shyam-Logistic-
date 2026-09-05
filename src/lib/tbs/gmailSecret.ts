import { env as nodeEnv } from "node:process";
import { hasPostgres, pgGet, pgSet } from "@/lib/db/postgres";

const KEY = "site:gmail-smtp";

export const COMPANY_GMAIL = "shyamlogisticscompany535@gmail.com";

/** Avoid Next.js build-time inlining of process.env.NAME. */
function readRuntime(name: string) {
  const bag = nodeEnv as NodeJS.ProcessEnv;
  return String(bag[name] || "").trim();
}

type Stored = { user?: string; pass?: string };

export async function getGmailSmtp(): Promise<{ user: string; pass: string }> {
  const fromEnv = {
    user: readRuntime("SMTP_USER"),
    pass: readRuntime("GMAIL_APP_PASSWORD") || readRuntime("SMTP_PASS"),
  };
  let stored: Stored | undefined;
  if (hasPostgres()) {
    stored = await pgGet<Stored>(KEY);
  }
  const user = fromEnv.user || stored?.user || COMPANY_GMAIL;
  const pass = fromEnv.pass || stored?.pass || "";
  if (pass && hasPostgres() && pass !== stored?.pass) {
    await pgSet(KEY, { user, pass }).catch(() => false);
  }
  return { user, pass };
}

export async function saveGmailSmtp(user: string, pass: string) {
  if (!hasPostgres()) return false;
  return pgSet(KEY, { user: user.trim() || COMPANY_GMAIL, pass: pass.trim() });
}
