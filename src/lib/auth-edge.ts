/** Edge-safe session check (middleware). Full rev check still happens in Node APIs. */

export const ADMIN_COOKIE = "sl_admin_session";

function sessionSecret() {
  return process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";
}

function adminUsername() {
  return process.env.ADMIN_USERNAME || "admin";
}

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function signHex(payload: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return hex(sig);
}

export async function hasValidSessionCookie(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [username, expStr, rev, sig] = parts;
  if (!username || !expStr || !rev || !sig) return false;
  const expected = await signHex(`${username}.${expStr}.${rev}`);
  if (!safeEqual(sig, expected)) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  return username === adminUsername();
}
