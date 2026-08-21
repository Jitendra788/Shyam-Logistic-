import { neon } from "@neondatabase/serverless";

type GlobalPg = typeof globalThis & {
  __shyamPg?: ReturnType<typeof neon>;
  __shyamPgTable?: Promise<void>;
};

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

export function postgresUrl() {
  return (
    env("POSTGRES_URL") ||
    env("POSTGRES_PRISMA_URL") ||
    env("DATABASE_URL") ||
    env("POSTGRES_URL_NON_POOLING") ||
    env("POSTGRES_URL_NO_SSL")
  );
}

export function hasPostgres() {
  const url = postgresUrl();
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

function sqlClient() {
  if (!hasPostgres()) return null;
  const g = globalThis as GlobalPg;
  if (!g.__shyamPg) g.__shyamPg = neon(postgresUrl());
  return g.__shyamPg;
}

async function ensureTable() {
  const sql = sqlClient();
  if (!sql) return;
  const g = globalThis as GlobalPg;
  if (!g.__shyamPgTable) {
    g.__shyamPgTable = sql`
      CREATE TABLE IF NOT EXISTS tbs_kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `.then(() => undefined);
  }
  await g.__shyamPgTable;
}

export async function pgGet<T>(key: string): Promise<T | undefined> {
  const sql = sqlClient();
  if (!sql) return undefined;
  try {
    await ensureTable();
    const rows = (await sql`
      SELECT value FROM tbs_kv WHERE key = ${key} LIMIT 1
    `) as { value?: string }[];
    const value = rows[0]?.value;
    if (typeof value !== "string") return undefined;
    return JSON.parse(value) as T;
  } catch (err) {
    console.error("Postgres get failed", key, err);
    return undefined;
  }
}

export async function pgSet(key: string, value: unknown): Promise<boolean> {
  const sql = sqlClient();
  if (!sql) return false;
  try {
    await ensureTable();
    const payload = JSON.stringify(value);
    const ts = Date.now();
    await sql`
      INSERT INTO tbs_kv (key, value, updated_at)
      VALUES (${key}, ${payload}, ${ts})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = EXCLUDED.updated_at
    `;
    return true;
  } catch (err) {
    console.error("Postgres set failed", key, err);
    return false;
  }
}
