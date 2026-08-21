"use client";

const DB_NAME = "shyam-tbs-v4";
const OLD_DBS = ["shyam-tbs", "shyam-tbs-v2", "shyam-tbs-v3"];

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

/** Remove leftover browser copies so lists come only from the server database. */
export async function idbDropLegacyCopies(): Promise<void> {
  for (const name of OLD_DBS) await deleteDb(name);
}
