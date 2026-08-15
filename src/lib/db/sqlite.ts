import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

/** Project database: bookings, parties, bills, site settings, blog, enquiries. */
const DB_FILE = path.join(process.cwd(), "data", "shyam.sqlite");

type GlobalDb = typeof globalThis & { __shyamSqlite?: Database.Database };

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  return db;
}

export function getSqlite(): Database.Database | null {
  const g = globalThis as GlobalDb;
  if (g.__shyamSqlite) return g.__shyamSqlite;
  try {
    g.__shyamSqlite = open();
    return g.__shyamSqlite;
  } catch (err) {
    console.error("SQLite open failed", err);
    return null;
  }
}

export function isSqliteReady(): boolean {
  return Boolean(getSqlite());
}

export function sqliteGet<T>(key: string): T | undefined {
  const db = getSqlite();
  if (!db) return undefined;
  const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  if (!row) return undefined;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return undefined;
  }
}

export function sqliteSet(key: string, value: unknown): boolean {
  const db = getSqlite();
  if (!db) return false;
  db.prepare(
    `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
  ).run(key, JSON.stringify(value), Date.now());
  return true;
}
