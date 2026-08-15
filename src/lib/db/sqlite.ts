import { createClient, type Client } from "@libsql/client";
import fs from "fs";
import path from "path";

type GlobalDb = typeof globalThis & {
  __shyamLibsql?: Client;
  __shyamLibsqlTable?: Promise<void>;
};

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

export function libsqlUrl() {
  return env("TURSO_DATABASE_URL") || env("LIBSQL_URL");
}

export function isLibsqlRemote() {
  const url = libsqlUrl();
  return (
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.startsWith("wss://")
  );
}

function localFileUrl() {
  const dir = path.join(process.cwd(), "data");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* read-only hosts */
  }
  const file = path.join(dir, "shyam.sqlite").replace(/\\/g, "/");
  return `file:${file}`;
}

export function getLibsql(): Client | null {
  // On Vercel the filesystem is not shared — only a hosted SQLite URL works.
  if (process.env.VERCEL && !isLibsqlRemote()) return null;

  const g = globalThis as GlobalDb;
  if (g.__shyamLibsql) return g.__shyamLibsql;

  const url = isLibsqlRemote() ? libsqlUrl() : localFileUrl();
  if (!url) return null;
  const authToken =
    env("TURSO_AUTH_TOKEN") || env("LIBSQL_AUTH_TOKEN") || undefined;
  try {
    g.__shyamLibsql = createClient({ url, authToken });
    return g.__shyamLibsql;
  } catch (err) {
    console.error("SQLite open failed", err);
    return null;
  }
}

export function sqliteKind(): "sqlite" | "none" {
  if (isLibsqlRemote()) return "sqlite";
  if (process.env.VERCEL) return "none";
  return getLibsql() ? "sqlite" : "none";
}

async function ensureTable(db: Client) {
  const g = globalThis as GlobalDb;
  if (!g.__shyamLibsqlTable) {
    g.__shyamLibsqlTable = db
      .execute(
        `CREATE TABLE IF NOT EXISTS kv (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
      )
      .then(() => undefined);
  }
  await g.__shyamLibsqlTable;
}

export async function sqliteGet<T>(key: string): Promise<T | undefined> {
  const db = getLibsql();
  if (!db) return undefined;
  try {
    await ensureTable(db);
    const rs = await db.execute({
      sql: "SELECT value FROM kv WHERE key = ?",
      args: [key],
    });
    const value = rs.rows[0]?.value;
    if (typeof value !== "string") return undefined;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("SQLite get failed", key, err);
    return undefined;
  }
}

export async function sqliteSet(key: string, value: unknown): Promise<boolean> {
  const db = getLibsql();
  if (!db) return false;
  try {
    await ensureTable(db);
    await db.execute({
      sql: `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = excluded.updated_at`,
      args: [key, JSON.stringify(value), Date.now()],
    });
    return true;
  } catch (err) {
    console.error("SQLite set failed", key, err);
    return false;
  }
}
