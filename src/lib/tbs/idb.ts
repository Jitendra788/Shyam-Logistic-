"use client";

const DB_NAME = "shyam-tbs-v4";
const OLD_DBS = [
  "shyam-tbs",
  "shyam-tbs-v2",
  "shyam-tbs-v3",
  "shyam-tbs-v4",
];

function deleteDb(name: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve();
      return;
    }
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

export async function idbClearAll(): Promise<void> {
  await deleteDb(DB_NAME);
}

export async function idbDropLegacyCopies(): Promise<void> {
  for (const name of OLD_DBS) await deleteDb(name);
}

/** Delete every leftover TBS IndexedDB, service worker, and Cache Storage copy. */
export function purgeAllBrowserTbsCopies(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const w = window as Window & { __TBS_PURGE?: Promise<void> };
  if (w.__TBS_PURGE) return w.__TBS_PURGE;
  w.__TBS_PURGE = (async () => {
    try {
      const regs = await navigator.serviceWorker?.getRegistrations?.();
      if (regs?.length) await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      /* ignore */
    }
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      /* ignore */
    }
    const names = new Set(OLD_DBS);
    try {
      const listed = await indexedDB.databases?.();
      for (const db of listed || []) {
        if (db.name && /shyam|tbs|skdb/i.test(db.name)) names.add(db.name);
      }
    } catch {
      /* ignore */
    }
    await Promise.all([...names].map((name) => deleteDb(name)));
  })();
  return w.__TBS_PURGE;
}
