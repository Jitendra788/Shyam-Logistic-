"use client";

const DB_NAME = "shyam-tbs-v4";
const STORE = "kv";

const OLD_DBS = ["shyam-tbs", "shyam-tbs-v2", "shyam-tbs-v3"];

type Rec = { data: unknown; at: number };

function openNamed(name: string): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(name);
    let created = false;
    req.onupgradeneeded = () => {
      created = true;
    };
    req.onerror = () => resolve(null);
    req.onsuccess = () => {
      if (created) {
        req.result.close();
        try {
          indexedDB.deleteDatabase(name);
        } catch {
          /* ignore */
        }
        resolve(null);
        return;
      }
      resolve(req.result);
    };
  });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(key: string): Promise<Rec | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Rec) || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSet(key: string, rec: Rec): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const req = tx.objectStore(STORE).put(rec, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    /* ignore */
  }
}

export async function idbClearAll(): Promise<void> {
  try {
    if (typeof indexedDB === "undefined") return;
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  } catch {
    /* ignore */
  }
}

export async function idbKeys(): Promise<string[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAllKeys();
      req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String));
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

let migrated = false;

/** Copy leftover rows from older IndexedDB names — do not delete them. */
export async function migrateLegacyIdb(): Promise<void> {
  if (migrated || typeof indexedDB === "undefined") return;
  migrated = true;
  for (const name of OLD_DBS) {
    const old = await openNamed(name);
    if (!old) continue;
    try {
      const storeName = old.objectStoreNames.item(0);
      if (!storeName) {
        old.close();
        continue;
      }
      const rows = await new Promise<{ key: IDBValidKey; value: Rec }[]>((resolve) => {
        const tx = old.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.openCursor();
        const out: { key: IDBValidKey; value: Rec }[] = [];
        req.onsuccess = () => {
          const cursor = req.result;
          if (!cursor) {
            resolve(out);
            return;
          }
          out.push({ key: cursor.key, value: cursor.value as Rec });
          cursor.continue();
        };
        req.onerror = () => resolve(out);
      });
      old.close();
      for (const row of rows) {
        const key = String(row.key);
        const existing = await idbGet(key);
        if (existing?.data != null) continue;
        const value = row.value;
        if (value && typeof value === "object" && "data" in value) {
          await idbSet(key, value);
        } else {
          await idbSet(key, { data: value, at: Date.now() });
        }
      }
    } catch {
      try {
        old.close();
      } catch {
        /* ignore */
      }
    }
  }
}
