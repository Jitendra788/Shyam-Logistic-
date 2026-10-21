import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { ADMIN_COOKIE } from "@/lib/auth-edge";

const COOKIE_NAME = ADMIN_COOKIE;
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function secret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  };
}

type ParsedSession = { username: string; exp: number; rev: string };

function parseSession(token: string | undefined): ParsedSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [username, expStr, rev, sig] = parts;
  if (!username || !expStr || !rev || !sig) return null;
  const payload = `${username}.${expStr}.${rev}`;
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  const { username: adminUser } = getAdminCredentials();
  if (username !== adminUser) return null;
  return { username, exp, rev };
}

export async function createSessionToken(username: string): Promise<string> {
  const { getPasswordRev } = await import("@/lib/adminPassword");
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const rev = await getPasswordRev();
  const payload = `${username}.${exp}.${rev}`;
  return `${payload}.${sign(payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  const parsed = parseSession(token);
  if (!parsed) return false;
  const { getPasswordRev } = await import("@/lib/adminPassword");
  return parsed.rev === (await getPasswordRev());
}

export async function isAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function getSessionUsername(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!(await verifySessionToken(token))) return null;
  return token?.split(".")[0] || null;
}

export function adminDisplayName(username: string) {
  if (username.toLowerCase() === "admin") return "Admin User";
  return username;
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
