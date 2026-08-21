"use client";

import { purgeAllBrowserTbsCopies } from "@/lib/tbs/idb";

function pathnameOf(url: string) {
  try {
    return new URL(url, window.location.origin).pathname.replace(/\/$/, "");
  } catch {
    return url.split("?")[0];
  }
}

export function installTbsPersist() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __tbsPersist?: boolean };
  if (w.__tbsPersist) return;
  w.__tbsPersist = true;
  void purgeAllBrowserTbsCopies();
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const path = pathnameOf(url);
    const req = orig(input, init);
    if (
      url.includes("/api/tbs/wipe") &&
      (method === "POST" || method === "DELETE")
    ) {
      return req.then(async (res) => {
        if (res.ok) await purgeAllBrowserTbsCopies();
        return res;
      });
    }
    return req;
  };
}
