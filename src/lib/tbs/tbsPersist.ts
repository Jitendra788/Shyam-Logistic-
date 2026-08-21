"use client";

import { idbClearAll, idbDropLegacyCopies } from "@/lib/tbs/idb";

function pathnameOf(url: string) {
  try {
    return new URL(url, window.location.origin).pathname.replace(/\/$/, "");
  } catch {
    return url.split("?")[0];
  }
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

  if (
    res.ok &&
    (method === "POST" || method === "DELETE") &&
    path.includes("/api/tbs/wipe")
  ) {
    await idbClearAll();
    await idbDropLegacyCopies();
  }

  return res;
}

export function installTbsPersist() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __tbsPersist?: boolean };
  if (w.__tbsPersist) return;
  w.__tbsPersist = true;
  void idbClearAll();
  void idbDropLegacyCopies();
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (url.includes("/api/tbs/bookings/lr-pdf")) return orig(input, init);
    if (url.includes("/api/tbs")) return tbsHandle(orig, input, init);
    return orig(input, init);
  };
}
