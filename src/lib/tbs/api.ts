import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { isTbsPersistent, tbsStorageKind } from "@/lib/tbs/store";

export async function requireAuth() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function tbsHeaders() {
  return {
    "x-tbs-persistent": isTbsPersistent() ? "1" : "0",
    "x-tbs-storage": tbsStorageKind(),
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: tbsHeaders(),
  });
}

export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function failSave(err: unknown) {
  console.error("TBS save failed", err);
  const msg =
    err instanceof Error
      ? err.message
      : "Save failed — set TURSO_DATABASE_URL on Vercel";
  return NextResponse.json(
    { error: msg },
    {
      status: 503,
      headers: tbsHeaders(),
    },
  );
}
