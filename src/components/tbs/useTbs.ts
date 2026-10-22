"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { installTbsPersist } from "@/lib/tbs/tbsPersist";

if (typeof window !== "undefined") installTbsPersist();

let authOk: boolean | null = null;
let authInflight: Promise<boolean> | null = null;

function checkAdminAuth(): Promise<boolean> {
  if (authOk === true) return Promise.resolve(true);
  if (authInflight) return authInflight;
  authInflight = fetch("/api/auth/me", { cache: "no-store" })
    .then(async (res) => {
      const data = (await res.json()) as { authenticated?: boolean };
      authOk = Boolean(data.authenticated);
      return authOk;
    })
    .catch(() => false)
    .finally(() => {
      authInflight = null;
    });
  return authInflight;
}

export function useAdminAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(authOk === true);

  useEffect(() => {
    let cancelled = false;
    void checkAdminAuth().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        authOk = false;
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return ready;
}

export function useTbsApi<T>(url: string | null, opts?: { poll?: boolean }) {
  const router = useRouter();
  const ready = useAdminAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState("");
  const poll = opts?.poll !== false;
  const dataRef = useRef<T | null>(null);
  dataRef.current = data;

  const reload = useCallback(
    async (reloadOpts?: { silent?: boolean }) => {
      if (!url) {
        setLoading(false);
        return;
      }
      const silent = reloadOpts?.silent ?? Boolean(dataRef.current);
      if (!silent) setLoading(true);
      setError("");
      try {
        const res = await fetch(url, {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (res.status === 401) {
          authOk = false;
          router.replace("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load");
        setData((await res.json()) as T);
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Failed to load");
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [url, router],
  );

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }
    void reload({ silent: false });
    if (!poll) return undefined;
    const id = window.setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      void reload({ silent: true });
    }, 60000);
    return () => window.clearInterval(id);
    // poll is fixed per hook usage (print pages pass false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reload, url]);

  return { ready, data, loading, error, reload, setData };
}
