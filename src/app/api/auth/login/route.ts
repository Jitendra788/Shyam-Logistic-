import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    const creds = getAdminCredentials();
    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);
    const res = NextResponse.json({ ok: true });
    const cookie = sessionCookieOptions(token);
    res.cookies.set(cookie);
    return res;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
