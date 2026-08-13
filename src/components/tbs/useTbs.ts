"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function useAdminAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (cancelled) return;
      if (!data.authenticated) {
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}

export function useTbsApi<T>(url: string | null) {
  const ready = useAdminAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!url || !ready) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load");
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [url, ready]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    if (ready) void reload();
  }, [ready, reload, url]);

  return { ready, data, loading, error, reload, setData };
}
