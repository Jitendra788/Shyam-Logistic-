"use client";

import { idbClearAll, idbGet } from "@/lib/tbs/idb";

const COLLECTIONS = [
  "bookings",
  "parties",
  "bills",
  "challans",
  "payments",
  "receipts",
  "notes",
  "masters",
] as const;

type Col = (typeof COLLECTIONS)[number];

function colKey(name: Col) {
  return `col:${name}`;
}

async function getCol(name: Col): Promise<unknown[] | Record<string, unknown> | null> {
  const rec = await idbGet(colKey(name));
  return (rec?.data as unknown[] | Record<string, unknown>) || null;
}

function pathnameOf(url: string) {
  try {
    return new URL(url, window.location.origin).pathname.replace(/\/$/, "");
  } catch {
    return url.split("?")[0];
  }
}

let migrateOnce: Promise<boolean> | null = null;

async function leftoverLocal(): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {};
  for (const name of COLLECTIONS) {
    const local = await getCol(name);
    if (name === "masters") {
      if (local && typeof local === "object" && !Array.isArray(local)) {
        payload.masters = local;
      }
      continue;
    }
    if (Array.isArray(local) && local.length > 0) payload[name] = local;
  }
  return payload;
}

async function migrateBrowserToSqlite(orig: typeof fetch) {
  if (migrateOnce) return migrateOnce;
  migrateOnce = (async () => {
    const leftover = await leftoverLocal();
    if (!Object.keys(leftover).length) {
      await idbClearAll();
      return false;
    }
    const res = await orig("/api/tbs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(leftover),
    });
    if (res.ok) {
      await idbClearAll();
      return true;
    }
    migrateOnce = null;
    return false;
  })();
  return migrateOnce;
}

async function tbsHandle(
  orig: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;
  const method = (init?.method || "GET").toUpperCase();
  const path = pathnameOf(url);

  const res = await orig(input, init);
  const persistent = res.headers.get("x-tbs-persistent") === "1";
  const storage = res.headers.get("x-tbs-storage") || "";

  if (
    res.ok &&
    (method === "POST" || method === "DELETE") &&
    path.includes("/api/tbs/wipe")
  ) {
    await idbClearAll();
    return res;
  }

  if (persistent || storage === "sqlite" || storage === "redis") {
    if (method === "GET") {
      try {
        const imported = await migrateBrowserToSqlite(orig);
        if (imported) return orig(input, init);
      } catch {
        /* keep server response */
      }
    }
    return res;
  }

  return res;
}

export function installTbsPersist() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __tbsPersist?: boolean };
  if (w.__tbsPersist) return;
  w.__tbsPersist = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes("/api/tbs/bookings/lr-pdf")) return orig(input, init);
    if (url.includes("/api/tbs/import")) return orig(input, init);
    if (url.includes("/api/tbs")) return tbsHandle(orig, input, init);
    return orig(input, init);
  };
}
