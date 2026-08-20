import { get, put } from "@vercel/blob";

function env(name: string) {
  const v = process.env[name]?.trim();
  if (!v) return "";
  return v.replace(/^["']|["']$/g, "");
}

export function hasBlobStore() {
  return Boolean(env("BLOB_READ_WRITE_TOKEN") || env("BLOB_STORE_ID"));
}

function blobPath(key: string) {
  return `tbs/${key.replace(/\\/g, "/")}`;
}

export async function blobGet<T>(key: string): Promise<T | undefined> {
  try {
    const result = await get(blobPath(key), {
      access: "private",
      useCache: false,
    });
    if (result.statusCode !== 200 || !result.stream) return undefined;
    const text = await new Response(result.stream).text();
    if (!text) return undefined;
    return JSON.parse(text) as T;
  } catch {
    return undefined;
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
    });
    return true;
  } catch (err) {
    console.error("Blob set failed", key, err);
    return false;
  }
}
