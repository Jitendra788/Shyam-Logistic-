"use client";

import { idbGet, idbSet } from "@/lib/tbs/idb";

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

const PATH_COL: Record<string, Col> = {
  "/api/tbs/bookings": "bookings",
  "/api/tbs/parties": "parties",
  "/api/tbs/bills": "bills",
  "/api/tbs/challans": "challans",
  "/api/tbs/lhp": "payments",
  "/api/tbs/money-receipts": "receipts",
  "/api/tbs/notes": "notes",
  "/api/tbs/masters": "masters",
};

function colKey(name: Col) {
  return `col:${name}`;
}

async function getCol(name: Col): Promise<unknown[] | Record<string, unknown> | null> {
  const rec = await idbGet(colKey(name));
  return (rec?.data as unknown[] | Record<string, unknown>) || null;
}

async function setCol(name: Col, data: unknown) {
  await idbSet(colKey(name), { data, at: Date.now() });
}

function pathnameOf(url: string) {
  try {
    return new URL(url, window.location.origin).pathname.replace(/\/$/, "");
  } catch {
    return url.split("?")[0];
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json",
      "x-tbs-local": "1",
    },
  });
}

function pullCollections(payload: Record<string, unknown>) {
  const out: Partial<Record<Col, unknown>> = {};
  for (const name of COLLECTIONS) {
    if (payload[name] != null) out[name] = payload[name];
  }
  return out;
}

async function saveCollections(found: Partial<Record<Col, unknown>>, overwrite: boolean) {
  for (const name of COLLECTIONS) {
    if (found[name] == null) continue;
    if (!overwrite) {
      const existing = await getCol(name);
      if (existing != null) continue;
    }
    await setCol(name, found[name]);
  }
}

async function overlayPayload(payload: Record<string, unknown>) {
  const next = { ...payload };
  for (const name of COLLECTIONS) {
    const local = await getCol(name);
    if (local != null) next[name] = local;
  }
  return next;
}

function withId(body: Record<string, unknown>, prefix: string) {
  if (!body.id) body.id = `${prefix}_${Date.now().toString(36)}`;
  return body;
}

async function applyMutation(url: string, method: string, init?: RequestInit) {
  const path = pathnameOf(url);
  const arrayKey = PATH_COL[path];
  if (!arrayKey) return { ok: true };

  const current = ((await getCol(arrayKey)) as unknown[]) || [];

  if (method === "DELETE") {
    const id = new URL(url, window.location.origin).searchParams.get("id");
    if (!id) return { ok: false };
    await setCol(
      arrayKey,
      current.filter((row) => (row as { id?: string }).id !== id),
    );
    return { ok: true };
  }

  let body: unknown = {};
  if (typeof init?.body === "string") {
    try {
      body = JSON.parse(init.body);
    } catch {
      body = {};
    }
  }

  if (method === "PUT") {
    const row = body as { id?: string };
    if (!row.id) return { ok: false };
    await setCol(
      arrayKey,
      current.map((item) =>
        (item as { id?: string }).id === row.id
          ? { ...(item as object), ...row }
          : item,
      ),
    );
    return { ok: true, row };
  }

  if (method === "POST") {
    const prefix = arrayKey.slice(0, 3);
    if (arrayKey === "masters") {
      const masters = ((await getCol("masters")) as Record<string, unknown>) || {};
      const particulars = Array.isArray(masters.particulars)
        ? [...(masters.particulars as string[])]
        : [];
      const brokers = Array.isArray(masters.brokers)
        ? [...(masters.brokers as string[])]
        : ["All"];
      const p = String((body as { particulars?: string }).particulars || "").trim();
      const broker = String((body as { broker?: string }).broker || "").trim();
      if (p && !particulars.some((x) => x.toLowerCase() === p.toLowerCase())) {
        particulars.unshift(p);
      }
      if (broker && !brokers.some((x) => x.toLowerCase() === broker.toLowerCase())) {
        const rest = brokers.filter((x) => x !== "All");
        brokers.splice(0, brokers.length, "All", broker, ...rest);
      }
      const next = { ...masters, particulars, brokers };
      await setCol("masters", next);
      return { ok: true, row: { masters: next } };
    }
    if (
      body &&
      typeof body === "object" &&
      "items" in body &&
      Array.isArray((body as { items: unknown[] }).items)
    ) {
      const items = (body as { items: Record<string, unknown>[] }).items.map(
        (item) => withId({ ...item }, prefix),
      );
      await setCol(arrayKey, [...items, ...current]);
      return { ok: true, items };
    }
    const row = withId({ ...(body as Record<string, unknown>) }, prefix);
    await setCol(arrayKey, [row, ...current]);
    return { ok: true, row };
  }

  return { ok: true };
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

  let res: Response;
  try {
    res = await orig(input, init);
  } catch {
    res = jsonResponse({ error: "Network error" }, 503);
  }

  const persistent = res.headers.get("x-tbs-persistent") === "1";

  if (method === "GET") {
    if (res.ok) {
      const data = (await res.clone().json()) as Record<string, unknown>;
      await saveCollections(pullCollections(data), persistent);
      if (!persistent) return jsonResponse(await overlayPayload(data));
      return res;
    }
    try {
      const data = {} as Record<string, unknown>;
      const over = await overlayPayload(data);
      if (Object.keys(over).length) return jsonResponse(over);
    } catch {
      /* ignore */
    }
    return res;
  }

  if (res.ok) {
    if (!persistent) {
      const applied = await applyMutation(url, method, init);
      if (res.headers.get("content-type")?.includes("json") && applied && "row" in applied) {
        return jsonResponse(applied.row, res.status);
      }
    }
    return res;
  }

  if (res.status === 503) {
    const applied = await applyMutation(url, method, init);
    if (applied && "row" in applied && applied.row) {
      return jsonResponse(applied.row, 201);
    }
    return jsonResponse({ ok: true, local: true }, 200);
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
    if (url.includes("/api/tbs")) return tbsHandle(orig, input, init);
    return orig(input, init);
  };
}
