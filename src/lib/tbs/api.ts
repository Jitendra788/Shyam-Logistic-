import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function failSave(err: unknown) {
  console.error("TBS save failed", err);
  const msg =
    err instanceof Error
      ? err.message
      : "Save failed — set UPSTASH_REDIS on Vercel";
  return NextResponse.json({ error: msg }, { status: 503 });
}
