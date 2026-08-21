"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { installTbsPersist } from "@/lib/tbs/tbsPersist";

if (typeof window !== "undefined") installTbsPersist();

export function useAdminAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
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

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!url || !ready) {
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    setError("");
    try {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to load");
      setData((await res.json()) as T);
    } catch (e) {
      if (!opts?.silent) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [url, ready]);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    if (!ready) return;
    void reload();
    const id = window.setInterval(() => void reload({ silent: true }), 10000);
    return () => window.clearInterval(id);
  }, [ready, reload, url]);

  return { ready, data, loading, error, reload, setData };
}
