import { BlobNotFoundError, del, get, list, put } from "@vercel/blob";

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

export function hasBlobStore() {
  return Boolean(
    env("BLOB_READ_WRITE_TOKEN") || env("VERCEL_BLOB_READ_WRITE_TOKEN"),
  );
}

function blobToken() {
  return (
    env("BLOB_READ_WRITE_TOKEN") || env("VERCEL_BLOB_READ_WRITE_TOKEN") || undefined
  );
}

function blobPath(key: string) {
  return `tbs/${key.replace(/\\/g, "/")}`;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type BlobRead<T> =
  | { ok: true; value: T | undefined }
  | { ok: false };

export async function blobGet<T>(key: string): Promise<BlobRead<T>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await get(blobPath(key), {
        access: "private",
        useCache: false,
        token: blobToken(),
      });
      if (!result || result.statusCode === 304 || !result.stream) {
        return { ok: true, value: undefined };
      }
      const text = await new Response(result.stream).text();
      if (!text) return { ok: true, value: undefined };
      return { ok: true, value: JSON.parse(text) as T };
    } catch (err) {
      if (err instanceof BlobNotFoundError) {
        return { ok: true, value: undefined };
      }
      lastErr = err;
      await sleep(80 * (attempt + 1));
    }
  }
  console.error("Blob get failed", key, lastErr);
  return { ok: false };
}

export async function blobClearAll(): Promise<boolean> {
  if (!hasBlobStore()) return false;
  const token = blobToken();
  try {
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: "tbs/", token, cursor });
      const urls = page.blobs.map((b) => b.url);
      if (urls.length) await del(urls, { token });
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    return true;
  } catch (err) {
    console.error("Blob clear failed", err);
    return false;
  }
}

export async function blobSet(key: string, value: unknown): Promise<boolean> {
  try {
    await put(blobPath(key), JSON.stringify(value), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: "application/json",
      token: blobToken(),
    });
    return true;
  } catch (err) {
    console.error("Blob set failed", key, err);
    return false;
  }
}
