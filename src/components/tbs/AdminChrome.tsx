"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Enquiry } from "@/lib/types";

const THEME_KEY = "tbs-theme";

function readTheme(): "light" | "dark" {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("tbs-theme-dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

type Me = {
  authenticated?: boolean;
  displayName?: string;
  username?: string;
  company?: string;
};

export function AdminChrome({
  backingUp,
  onBackup,
  onLogout,
}: {
  backingUp: boolean;
  onBackup: () => void;
  onLogout: () => void;
}) {
  const [me, setMe] = useState<Me>({
    displayName: "Admin User",
    company: "SHYAM LOGISTICS",
  });
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("tbs-theme-dark")
      ? "dark"
      : "light",
  );
  const [newEnquiries, setNewEnquiries] = useState<Enquiry[]>([]);
  const [open, setOpen] = useState<"user" | "bell" | null>(null);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTheme(readTheme());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, enqRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/enquiries", { cache: "no-store" }),
        ]);
        if (cancelled) return;
        if (meRes.ok) {
          const json = (await meRes.json()) as Me;
          if (json.authenticated) setMe(json);
        }
        if (enqRes.ok) {
          const list = (await enqRes.json()) as Enquiry[];
          setNewEnquiries((list || []).filter((e) => e.status === "new"));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(null);
        setPwOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  function openPassword() {
    setOpen(null);
    setPwError("");
    setPwOk("");
    setPwCurrent("");
    setPwNext("");
    setPwConfirm("");
    setPwOpen(true);
  }

  async function savePassword() {
    setPwError("");
    setPwOk("");
    if (!pwCurrent.trim()) {
      setPwError("Pehle current password likho");
      return;
    }
    if (pwNext.length < 8) {
      setPwError("Naya password kam se kam 8 characters ka hona chahiye");
      return;
    }
    if (pwNext !== pwConfirm) {
      setPwError("Naya password aur confirm match nahi karte");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwCurrent,
          newPassword: pwNext,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error || "Password change failed");
      setPwOk("Password change ho gaya. Agli baar naya password se login karo.");
      setPwCurrent("");
      setPwNext("");
      setPwConfirm("");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setPwSaving(false);
    }
  }

  const name = me.displayName || "Admin User";
  const company = me.company || "SHYAM LOGISTICS";
  const badge = newEnquiries.length;

  return (
    <>
    <div className="tbs-topbar-actions" ref={wrapRef}>
      <button
        type="button"
        className="tbs-top-btn tbs-top-btn-gold tbs-hide-narrow"
        disabled={backingUp}
        onClick={onBackup}
        aria-label="Download Excel backup"
      >
        <span className="tbs-btn-label-full">
          {backingUp ? "Saving…" : "Excel Backup"}
        </span>
        <span className="tbs-btn-label-short">{backingUp ? "…" : "Backup"}</span>
      </button>

      <button
        type="button"
        className="tbs-icon-btn tbs-hide-narrow"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="tbs-menu-anchor">
        <button
          type="button"
          className="tbs-icon-btn"
          aria-label="Notifications"
          aria-expanded={open === "bell"}
          onClick={() => setOpen(open === "bell" ? null : "bell")}
        >
          <BellIcon />
          {badge > 0 ? <span className="tbs-bell-badge">{badge > 9 ? "9+" : badge}</span> : null}
        </button>
        {open === "bell" ? (
          <div className="tbs-drop tbs-drop-bell" role="menu">
            <div className="tbs-drop-head">Notifications</div>
            {newEnquiries.length === 0 ? (
              <p className="tbs-drop-empty">No new enquiries</p>
            ) : (
              newEnquiries.slice(0, 6).map((e) => (
                <Link
                  key={e.id}
                  href="/admin/website/enquiries"
                  className="tbs-drop-item"
                  onClick={() => setOpen(null)}
                >
                  <span className="tbs-drop-item-title">{e.name || "Enquiry"}</span>
                  <span className="tbs-drop-item-sub">{e.phone || "New website lead"}</span>
                </Link>
              ))
            )}
            <Link
              href="/admin/website/enquiries"
              className="tbs-drop-foot"
              onClick={() => setOpen(null)}
            >
              All enquiries
            </Link>
          </div>
        ) : null}
      </div>

      <div className="tbs-menu-anchor">
        <button
          type="button"
          className="tbs-user-chip"
          aria-expanded={open === "user"}
          aria-label="Account menu"
          onClick={() => setOpen(open === "user" ? null : "user")}
        >
          <span className="tbs-user-avatar" aria-hidden>
            <UserIcon />
          </span>
          <span className="tbs-user-meta">
            <strong>{name}</strong>
            <small>{company}</small>
          </span>
          <span className="tbs-user-caret" aria-hidden>
            ▾
          </span>
        </button>
        {open === "user" ? (
          <div className="tbs-drop tbs-drop-user" role="menu">
            <div className="tbs-drop-head">{name}</div>
            <Link
              href="/admin/website/settings"
              className="tbs-drop-item"
              onClick={() => setOpen(null)}
            >
              Profile
            </Link>
            <button
              type="button"
              className="tbs-drop-item"
              onClick={openPassword}
            >
              <LockIcon />
              Change password
            </button>
            <button
              type="button"
              className="tbs-drop-item tbs-show-narrow"
              disabled={backingUp}
              onClick={() => {
                setOpen(null);
                onBackup();
              }}
            >
              {backingUp ? "Saving backup…" : "Excel Backup"}
            </button>
            <button
              type="button"
              className="tbs-drop-item"
              onClick={() => {
                toggleTheme();
                setOpen(null);
              }}
            >
              <MoonIcon />
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Link href="/" className="tbs-drop-item" onClick={() => setOpen(null)}>
              View site
            </Link>
            <button type="button" className="tbs-drop-item tbs-drop-danger" onClick={onLogout}>
              <LogoutIcon />
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
    {pwOpen && typeof document !== "undefined"
      ? createPortal(
      <div
        className="tbs-pw-backdrop"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setPwOpen(false);
        }}
      >
        <div
          className="tbs-pw-modal"
          role="dialog"
          aria-labelledby="tbs-pw-title"
          aria-modal="true"
        >
          <h2 id="tbs-pw-title">Change password</h2>
          <p className="tbs-pw-lead">Teen fields bharo: current, naya, confirm.</p>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={pwNext}
              onChange={(e) => setPwNext(e.target.value)}
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
            />
          </label>
          {pwError ? <p className="tbs-pw-err">{pwError}</p> : null}
          {pwOk ? <p className="tbs-pw-ok">{pwOk}</p> : null}
          <div className="tbs-pw-actions">
            <button type="button" className="tbs-btn" onClick={() => setPwOpen(false)}>
              Close
            </button>
            <button
              type="button"
              className="tbs-btn tbs-btn-print"
              disabled={pwSaving}
              onClick={() => void savePassword()}
            >
              {pwSaving ? "Saving…" : "Save password"}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
      : null}
    </>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 14.3A8.5 8.5 0 0 1 9.7 3 8.6 8.6 0 1 0 21 14.3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M6.2 17.8l1.4-1.4M16.4 7.6l1.4-1.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2h15L18 16Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M10 20a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 19c1.2-3.2 3.4-4.8 7-4.8s5.8 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15 12H4m0 0 3-3M4 12l3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
