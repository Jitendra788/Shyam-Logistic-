"use client";

import { idbClearAll, idbGet, idbSet } from "@/lib/tbs/idb";
import { applyVehicleToLrs } from "@/lib/tbs/legacySkdb";
import { nextAvailableCode, nextCode, unusedOrNext } from "@/lib/tbs/nextCode";
import { buildTbsReport } from "@/lib/tbs/reportBuild";
import type { Bill, Booking, Challan, MoneyReceipt, NoteVoucher, Party } from "@/lib/tbs/types";

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
    // Reports APIs reuse the key "parties" as a string[] of names — never store those.
    if (isRecordRows(value)) out[name] = value;
  }
  return out;
}

async function saveCollections(found: Partial<Record<Col, unknown>>, overwrite: boolean) {
  for (const name of COLLECTIONS) {
    if (found[name] == null) continue;
    const existing = await getCol(name);
    if (!overwrite && existing != null) continue;
    const incoming = found[name];
    // Never wipe a filled local collection with an empty API payload
    // (LHP GET can return challans: [] while Part Challan still has rows in IDB).
    if (
      Array.isArray(incoming) &&
      incoming.length === 0 &&
      Array.isArray(existing) &&
      existing.length > 0
    ) {
      continue;
    }
    await setCol(name, found[name]);
  }
}

async function overlayPayload(payload: Record<string, unknown>) {
  const next = { ...payload };
  for (const name of COLLECTIONS) {
    const local = await getCol(name);
    if (local == null) continue;
    const cur = next[name];
    const serverEmpty = Array.isArray(cur) && cur.length === 0;
    const localHas =
      (Array.isArray(local) && local.length > 0) ||
      (!Array.isArray(local) && local && typeof local === "object");
    // Keep server seed when IndexedDB has an empty array (old skdb import).
    if (!localHas) continue;
    if (cur == null || serverEmpty || localHas) {
      next[name] = local;
    }
  }
  if (Array.isArray(next.challans)) {
    next.nextChallan = nextAvailableCode(next.challans as Record<string, unknown>[], "challanNo", 1);
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

  let res: Response;
  try {
    res = await orig(input, init);
  } catch {
    res = jsonResponse({ error: "Network error" }, 503);
  }

  const persistent = res.headers.get("x-tbs-persistent") === "1";
  const path = pathnameOf(url);

  if (method === "GET") {
    const isCollectionGet = Boolean(PATH_COL[path]);
    if (res.ok) {
      const data = (await res.clone().json()) as Record<string, unknown>;
      if (isCollectionGet) {
        await saveCollections(pullCollections(data), persistent);
        return jsonResponse(await overlayPayload(data));
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
        const data = {} as Record<string, unknown>;
        const over = await overlayPayload(data);
        if (Object.keys(over).length) return jsonResponse(over);
      } catch {
        /* ignore */
      }
    }
    return res;
  }

  // After full wipe, drop local IndexedDB so browser does not resurrect old rows
  if (
    res.ok &&
    (method === "POST" || method === "DELETE") &&
    path.includes("/api/tbs/wipe")
  ) {
    await idbClearAll();
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
    if (path.includes("/api/tbs/wipe")) {
      await idbClearAll();
      for (const name of COLLECTIONS) {
        if (name === "masters") {
          await setCol(name, {
            stations: ["Sangli", "KAGAL", "PANVAL", "shirwal", "SURAT", "Pune", "Mumbai", "Kolhapur"],
            vehicles: [],
            brokers: ["All"],
            particulars: [],
            partyTypes: ["Consigner/Consignee", "Broker"],
            gstPaidBy: ["Consignor", "Consignee", "Broker", "Company", "Transporter"],
            lrTypes: ["Paid", "ToPay", "TBB", "Cancel"],
            gstLabels: ["GST @ 0%", "GST @ 5%", "GST @ 12%", "GST @ 18%"],
          });
        } else {
          await setCol(name, []);
        }
      }
      return jsonResponse({ ok: true, local: true, message: "All local data cleared" });
    }
    const applied = await applyMutation(url, method, init);
    if (applied && "row" in applied && applied.row) {
      return jsonResponse(applied.row, 201);
    }
    return jsonResponse({ ok: true, local: true }, 200);
  }

  // Local-only rows (IndexedDB) can 404 on server PUT — still save locally.
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
