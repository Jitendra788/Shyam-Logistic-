"use client";

import { idbClearAll, idbGet, idbSet, migrateLegacyIdb } from "@/lib/tbs/idb";
import { applyVehicleToLrs } from "@/lib/tbs/legacySkdb";
import { nextAvailableCode, nextCode, unusedOrNext } from "@/lib/tbs/nextCode";
import { lrCountsAsBilled } from "@/lib/tbs/lrType";
import { buildTbsReport } from "@/lib/tbs/reportBuild";
import type {
  Bill,
  Booking,
  Challan,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";

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

function isRecordRows(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  const first = value[0];
  return Boolean(first && typeof first === "object" && "id" in first);
}

function pullCollections(payload: Record<string, unknown>) {
  const out: Partial<Record<Col, unknown>> = {};
  for (const name of COLLECTIONS) {
    const value = payload[name];
    if (value == null) continue;
    if (name === "masters") {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out[name] = value;
      }
      continue;
    }
    if (isRecordRows(value)) out[name] = value;
  }
  return out;
}

async function saveCollections(found: Partial<Record<Col, unknown>>, overwrite: boolean) {
  for (const name of COLLECTIONS) {
    if (found[name] == null) continue;
    const existing = await getCol(name);
    const incoming = found[name];
    if (
      Array.isArray(incoming) &&
      incoming.length === 0
    ) {
      continue;
    }
    if (Array.isArray(incoming) && Array.isArray(existing)) {
      await setCol(name, mergeById(incoming, existing));
      continue;
    }
    if (!overwrite && existing != null) continue;
    await setCol(name, incoming);
  }
}

function mergeById(server: unknown, local: unknown) {
  if (!Array.isArray(local) || !local.length) return server;
  if (!Array.isArray(server) || !server.length) return local;
  const map = new Map<string, Record<string, unknown>>();
  for (const row of server as { id?: string }[]) {
    if (row && typeof row === "object" && row.id) map.set(row.id, row as Record<string, unknown>);
  }
  for (const row of local as { id?: string }[]) {
    if (row && typeof row === "object" && row.id && !map.has(row.id)) {
      map.set(row.id, row as Record<string, unknown>);
    }
  }
  return [...map.values()];
}

async function overlayPayload(payload: Record<string, unknown>) {
  const next = { ...payload };
  for (const name of COLLECTIONS) {
    const local = await getCol(name);
    if (local == null) continue;
    const cur = next[name];
    const localHas =
      (Array.isArray(local) && local.length > 0) ||
      (!Array.isArray(local) && local && typeof local === "object");
    if (!localHas) continue;
    if (name === "masters") {
      if (!cur || (typeof cur === "object" && !Object.keys(cur as object).length)) {
        next[name] = local;
      }
      continue;
    }
    next[name] = mergeById(cur, local);
  }
  if (Array.isArray(next.challans)) {
    next.nextChallan = nextAvailableCode(
      next.challans as Record<string, unknown>[],
      "challanNo",
      1,
    );
  }
  if (Array.isArray(next.bookings)) {
    next.nextLr = nextCode(next.bookings as Record<string, unknown>[], "lrNo", 1);
  }
  if (Array.isArray(next.bills)) {
    next.nextBill = nextCode(next.bills as Record<string, unknown>[], "billNo", 1);
  }
  if (Array.isArray(next.receipts)) {
    next.nextMr = nextCode(next.receipts as Record<string, unknown>[], "mrNo", 1);
  }
  if (Array.isArray(next.parties)) {
    next.nextCode = nextCode(next.parties as Record<string, unknown>[], "partyCode", 1);
  }
  return next;
}

async function overlayDashboard(data: Record<string, unknown>) {
  const bookings = ((await getCol("bookings")) as Booking[] | null) || [];
  const parties = ((await getCol("parties")) as unknown[]) || [];
  const bills = ((await getCol("bills")) as Bill[] | null) || [];
  const challans = ((await getCol("challans")) as unknown[]) || [];
  const receipts = ((await getCol("receipts")) as unknown[]) || [];
  const counts = (data.counts as Record<string, number>) || {};
  const serverRows = Array.isArray(data.recentBookings)
    ? (data.recentBookings as unknown[])
    : [];
  if (
    (counts.bookings || 0) > 0 &&
    serverRows.length > 0 &&
    (counts.bookings || 0) >= bookings.length
  ) {
    return data;
  }
  if (!bookings.length && !parties.length) return data;
  const billedLrIds = new Set<string>();
  for (const bill of bills) {
    for (const id of bill.lrIds || []) billedLrIds.add(id);
  }
  const recentBookings = [...bookings]
    .sort((a, b) => String(b.lrDate).localeCompare(String(a.lrDate)))
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      lrNo: b.lrNo,
      lrDate: b.lrDate,
      party: b.billingParty,
      from: b.from,
      to: b.to,
      amount: Number(b.grandTotal || b.total || b.freight || 0),
      delivered: Boolean(b.delivered),
      billed: lrCountsAsBilled(b.lrType, billedLrIds.has(b.id)),
    }));
  return {
    ...data,
    counts: {
      ...counts,
      parties: Math.max(counts.parties || 0, parties.length),
      bookings: Math.max(counts.bookings || 0, bookings.length),
      bills: Math.max(counts.bills || 0, bills.length),
      challans: Math.max(counts.challans || 0, challans.length),
      receipts: Math.max(counts.receipts || 0, receipts.length),
    },
    recentBookings:
      recentBookings.length > serverRows.length ? recentBookings : data.recentBookings,
  };
}

async function overlayAnyReport(url: string) {
  let kind = "";
  let from = "";
  let to = "";
  let party = "";
  let asOf = "";
  let status = "";
  try {
    const u = new URL(url, window.location.origin);
    kind = u.searchParams.get("kind") || "";
    from = u.searchParams.get("from") || "";
    to = u.searchParams.get("to") || "";
    party = u.searchParams.get("party") || "";
    asOf = u.searchParams.get("asOf") || "";
    status = u.searchParams.get("status") || "";
  } catch {
    return null;
  }
  const parties = ((await getCol("parties")) as Party[] | null) || [];
  const bookings = ((await getCol("bookings")) as Booking[] | null) || [];
  const bills = ((await getCol("bills")) as Bill[] | null) || [];
  const receipts = ((await getCol("receipts")) as MoneyReceipt[] | null) || [];
  const challans = ((await getCol("challans")) as Challan[] | null) || [];
  const notes = ((await getCol("notes")) as NoteVoucher[] | null) || [];
  if (
    !parties.length &&
    !bookings.length &&
    !bills.length &&
    !receipts.length &&
    !challans.length &&
    !notes.length
  ) {
    return null;
  }
  return buildTbsReport(
    kind || "booking",
    { parties, bookings, bills, receipts, challans, notes },
    { from, to, party, asOf, status },
  );
}

function withId(body: Record<string, unknown>, prefix: string) {
  if (!body.id) body.id = `${prefix}_${Date.now().toString(36)}`;
  return body;
}

async function syncLorryLocal(row: { lrIds?: string[]; vehicleNo?: string }) {
  const lrIds = row.lrIds || [];
  const veh = String(row.vehicleNo || "");
  if (!lrIds.length || !veh.trim()) return;
  const bookings = ((await getCol("bookings")) as { id: string; vehicleNo?: string }[]) || [];
  const next = applyVehicleToLrs(bookings, lrIds, veh);
  if (next.changed) await setCol("bookings", next.bookings);
}

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

let migrateOnce: Promise<boolean> | null = null;

async function migrateBrowserToServer(orig: typeof fetch) {
  if (migrateOnce) return migrateOnce;
  migrateOnce = (async () => {
    await migrateLegacyIdb();
    const leftover = await leftoverLocal();
    if (!Object.keys(leftover).length) return false;
    const res = await orig("/api/tbs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(leftover),
    });
    if (!res.ok) {
      migrateOnce = null;
      return false;
    }
    return true;
  })();
  return migrateOnce;
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
    const nextRows = current.map((item) =>
      (item as { id?: string }).id === row.id
        ? { ...(item as object), ...row }
        : item,
    );
    await setCol(arrayKey, nextRows);
    if (arrayKey === "challans") {
      await syncLorryLocal(row as { lrIds?: string[]; vehicleNo?: string });
    }
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
      const rawItems = (body as { items: Record<string, unknown>[] }).items;
      let nextMr = Number(
        nextAvailableCode(current as Record<string, unknown>[], "mrNo", 1),
      );
      const items = rawItems.map((item) => {
        const row = withId({ ...item }, prefix);
        if (arrayKey === "receipts" && !row.mrNo) {
          row.mrNo = String(nextMr++);
        }
        return row;
      });
      await setCol(arrayKey, [...items, ...current]);
      return { ok: true, items };
    }
    const row = withId({ ...(body as Record<string, unknown>) }, prefix);
    if (arrayKey === "challans") {
      row.challanNo = unusedOrNext(
        current as Record<string, unknown>[],
        "challanNo",
        String(row.challanNo || ""),
        1,
      );
    }
    await setCol(arrayKey, [row, ...current]);
    if (arrayKey === "challans") {
      await syncLorryLocal(row as { lrIds?: string[]; vehicleNo?: string });
    }
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
  const path = pathnameOf(url);

  let res: Response;
  try {
    res = await orig(input, init);
  } catch {
    res = jsonResponse({ error: "Network error" }, 503);
  }

  const persistent = res.headers.get("x-tbs-persistent") === "1";
  const storage = res.headers.get("x-tbs-storage") || "";
  const shared =
    persistent ||
    storage === "postgres" ||
    storage === "sqlite" ||
    storage === "redis" ||
    storage === "blob";

  if (
    res.ok &&
    (method === "POST" || method === "DELETE") &&
    path.includes("/api/tbs/wipe")
  ) {
    await idbClearAll();
    return res;
  }

  if (method === "GET") {
    let imported = false;
    if (shared) {
      try {
        imported = await migrateBrowserToServer(orig);
      } catch {
        /* keep local copy */
      }
    } else {
      try {
        await migrateLegacyIdb();
      } catch {
        /* ignore */
      }
    }
    if (imported) {
      try {
        res = await orig(input, init);
      } catch {
        /* keep first response */
      }
    }

    const isCollectionGet = Boolean(PATH_COL[path]);
    if (res.ok) {
      const data = (await res.clone().json()) as Record<string, unknown>;
      if (isCollectionGet) {
        await saveCollections(pullCollections(data), shared);
        return jsonResponse(await overlayPayload(data));
      }
      if (path.includes("/api/tbs/dashboard")) {
        return jsonResponse(await overlayDashboard(data));
      }
      if (path.includes("/api/tbs/reports")) {
        const rebuilt = await overlayAnyReport(url);
        if (rebuilt) return jsonResponse(rebuilt);
      }
      return res;
    }
    if (path.includes("/api/tbs/reports")) {
      const rebuilt = await overlayAnyReport(url);
      if (rebuilt) return jsonResponse(rebuilt);
    }
    if (isCollectionGet) {
      try {
        const over = await overlayPayload({});
        if (Object.keys(over).length) return jsonResponse(over);
      } catch {
        /* ignore */
      }
    }
    return res;
  }

  if (res.ok) {
    if (!shared) {
      const applied = await applyMutation(url, method, init);
      if (res.headers.get("content-type")?.includes("json") && applied && "row" in applied) {
        return jsonResponse(applied.row, res.status);
      }
    }
    return res;
  }

  if (res.status === 503) {
    if (path.includes("/api/tbs/wipe")) {
      return res;
    }
    const applied = await applyMutation(url, method, init);
    if (applied && "row" in applied && applied.row) {
      return jsonResponse(applied.row, 201);
    }
    return jsonResponse({ ok: true, local: true }, 200);
  }

  if (res.status === 404 && method === "PUT") {
    const applied = await applyMutation(url, method, init);
    if (applied && "row" in applied && applied.row) {
      return jsonResponse(applied.row, 200);
    }
  }

  return res;
}

export function installTbsPersist() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __tbsPersist?: boolean };
  if (w.__tbsPersist) return;
  w.__tbsPersist = true;
  void migrateLegacyIdb();
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
