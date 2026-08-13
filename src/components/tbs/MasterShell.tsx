"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { downloadExcelBackup } from "@/lib/tbs/excel";

type NavLink = { href: string; label: string };
type NavGroup = { id: string; label: string; links: NavLink[] };

const navGroups: NavGroup[] = [
  {
    id: "registration",
    label: "Registration",
    links: [{ href: "/admin/registration/parties", label: "Party Creation" }],
  },
  {
    id: "transport",
    label: "Transport",
    links: [
      { href: "/admin/transport/booking", label: "Booking" },
      { href: "/admin/transport/lhc", label: "LHC — Lorry Hire Contract" },
      { href: "/admin/transport/lhp/new", label: "LHP — New Payment" },
      { href: "/admin/transport/lhp/update", label: "LHP — Update Payment" },
      { href: "/admin/transport/bill", label: "Bill Preparation" },
      { href: "/admin/transport/money-receipt/new", label: "Money Receipt — New" },
      { href: "/admin/transport/money-receipt/edit", label: "Money Receipt — Edit" },
      { href: "/admin/transport/other-payments/debit-note", label: "Debit Note" },
      { href: "/admin/transport/other-payments/credit-note", label: "Credit Note" },
      { href: "/admin/transport/expense-voucher", label: "Expense Voucher" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    links: [
      { href: "/admin/reports/booking", label: "Booking Report" },
      {
        href: "/admin/reports/party-outstanding/billingwise",
        label: "Outstanding — Billingwise",
      },
      {
        href: "/admin/reports/party-outstanding/dayswise",
        label: "Outstanding — Dayswise",
      },
      {
        href: "/admin/reports/party-ledger/billwise",
        label: "Party Ledger — Billwise",
      },
      { href: "/admin/reports/gst-summary", label: "GST Summary" },
      { href: "/admin/reports/profit", label: "Profit Report" },
    ],
  },
  {
    id: "website",
    label: "Website",
    links: [
      { href: "/admin/website/enquiries", label: "Enquiries" },
      { href: "/admin/website/blog", label: "Blog" },
      { href: "/admin/website/settings", label: "Site Settings" },
    ],
  },
];

function groupOpenForPath(pathname: string): string {
  if (pathname.startsWith("/admin/registration")) return "registration";
  if (pathname.startsWith("/admin/transport")) return "transport";
  if (pathname.startsWith("/admin/reports")) return "reports";
  if (pathname.startsWith("/admin/website")) return "website";
  return "transport";
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileNav(false);
    const id = groupOpenForPath(pathname);
    setOpenGroups((prev) => ({ ...prev, [id]: true }));
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNav]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (
    pathname.startsWith("/admin/transport/booking/print") ||
    pathname.startsWith("/admin/print")
  ) {
    return <>{children}</>;
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function onBackup() {
    setBackingUp(true);
    try {
      await downloadExcelBackup();
      if (
        confirm(
          "Excel backup (.xlsx) download ho gaya (Downloads folder). Exit admin?",
        )
      ) {
        router.push("/");
      }
    } catch {
      alert("Excel backup failed — please login again");
    } finally {
      setBackingUp(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="tbs-nav" aria-label="Admin">
      <Link
        href="/admin"
        className={`tbs-nav-link tbs-nav-home ${pathname === "/admin" ? "active" : ""}`}
        onClick={() => setMobileNav(false)}
      >
        Dashboard
      </Link>

      {navGroups.map((group) => {
        const open = openGroups[group.id] ?? group.id === "transport";
        return (
          <div key={group.id} className={`tbs-nav-group ${open ? "open" : ""}`}>
            <button
              type="button"
              className="tbs-nav-group-btn"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={open}
            >
              <span>{group.label}</span>
              <span className="tbs-nav-chevron" aria-hidden>
                {open ? "▾" : "▸"}
              </span>
            </button>
            {open && (
              <div className="tbs-nav-links">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`tbs-nav-link ${isActive(pathname, link.href) ? "active" : ""}`}
                    onClick={() => setMobileNav(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="tbs-nav-footer">
        <a href="tel:8459858242" className="tbs-nav-phone">
          84598 58242
        </a>
        <p className="tbs-nav-tag">Transport Billing · SHYAM LOGISTIC</p>
      </div>
    </nav>
  );

  if (!mounted) {
    return (
      <div className="tbs-root">
        <header className="tbs-topbar" style={{ minHeight: 64 }} />
        <div className="tbs-body">
          <aside className="tbs-sidebar" />
          <main className="tbs-workspace">
            <div className="tbs-empty">Loading…</div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="tbs-root">
      <header className="tbs-topbar">
        <div className="tbs-topbar-inner">
          <button
            type="button"
            className="tbs-mobile-toggle"
            aria-label={mobileNav ? "Close menu" : "Open menu"}
            aria-expanded={mobileNav}
            onClick={() => setMobileNav((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="tbs-topbar-brand">
            <BrandLogo companyName="SHYAM LOGISTIC" size="sm" variant="light" />
            <span className="tbs-admin-badge">Admin</span>
          </div>

          <div className="tbs-topbar-actions">
            <button
              type="button"
              className="tbs-top-btn tbs-top-btn-gold"
              disabled={backingUp}
              onClick={() => void onBackup()}
              aria-label="Download Excel backup"
            >
              <span className="tbs-btn-label-full">
                {backingUp ? "Saving…" : "Excel Backup"}
              </span>
              <span className="tbs-btn-label-short">
                {backingUp ? "…" : "Backup"}
              </span>
            </button>
            <Link href="/" className="tbs-top-btn tbs-top-btn-ghost">
              View site
            </Link>
            <button
              type="button"
              className="tbs-top-btn tbs-top-btn-navy"
              onClick={() => void onLogout()}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {mobileNav && (
        <button
          type="button"
          className="tbs-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileNav(false)}
        />
      )}

      <div className="tbs-body">
        <aside className={`tbs-sidebar ${mobileNav ? "open" : ""}`}>{nav}</aside>
        <main className="tbs-workspace">{children}</main>
      </div>
    </div>
  );
}
