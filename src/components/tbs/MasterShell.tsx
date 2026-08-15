"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { AdminChrome } from "@/components/tbs/AdminChrome";
import { downloadExcelBackup } from "@/lib/tbs/excel";
import { installTbsPersist } from "@/lib/tbs/tbsPersist";

if (typeof window !== "undefined") installTbsPersist();

type NavLeaf = { href: string; label: string };
type NavItem = NavLeaf & { children?: NavLeaf[] };
type NavGroup = { id: string; label: string; mark: string; links: NavItem[] };

const navGroups: NavGroup[] = [
  {
    id: "registration",
    label: "Registration",
    mark: "R",
    links: [{ href: "/admin/registration/parties", label: "Party Creation" }],
  },
  {
    id: "transport",
    label: "Transport",
    mark: "T",
    links: [
      { href: "/admin/transport/booking", label: "Booking" },
      { href: "/admin/transport/lhc", label: "LHC - Lorry Hire Contract" },
      {
        href: "/admin/transport/lhp/new",
        label: "LHP - Lorry Hire Payment",
        children: [
          { href: "/admin/transport/lhp/new", label: "New Payment" },
          { href: "/admin/transport/lhp/update", label: "Update Payment" },
        ],
      },
      { href: "/admin/transport/bill", label: "Bill Preparation" },
      {
        href: "/admin/transport/money-receipt/new",
        label: "Money Receipt",
        children: [
          { href: "/admin/transport/money-receipt/new", label: "New Money Receipt Entry" },
          { href: "/admin/transport/money-receipt/edit", label: "Edit Money Receipt Entry" },
        ],
      },
      {
        href: "/admin/transport/other-payments/debit-note",
        label: "Other Payments",
        children: [
          { href: "/admin/transport/other-payments/debit-note", label: "Debit Note" },
          { href: "/admin/transport/other-payments/credit-note", label: "Credit Note" },
        ],
      },
      { href: "/admin/transport/expense-voucher", label: "Expense Voucher" },
    ],
  },
  {
    id: "reports",
    label: "Reports",
    mark: "P",
    links: [
      { href: "/admin/reports/booking", label: "Booking Report" },
      {
        href: "/admin/reports/party-outstanding/billingwise",
        label: "Party Outstanding",
        children: [
          {
            href: "/admin/reports/party-outstanding/billingwise",
            label: "Billingwise Outstanding",
          },
          {
            href: "/admin/reports/party-outstanding/dayswise",
            label: "Dayswise Outstanding",
          },
          {
            href: "/admin/reports/party-outstanding/partywise",
            label: "Partywise Outstanding",
          },
        ],
      },
      {
        href: "/admin/reports/party-ledger/billwise",
        label: "Party Ledger",
        children: [
          {
            href: "/admin/reports/party-ledger/billwise",
            label: "Billwise Customer Ledger",
          },
        ],
      },
      { href: "/admin/reports/gst-summary", label: "GST Summary Report" },
      { href: "/admin/reports/profit", label: "Profit Report" },
    ],
  },
  {
    id: "website",
    label: "Website",
    mark: "W",
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

function itemIsActive(pathname: string, item: NavItem) {
  if (item.children?.length) {
    return item.children.some((c) => isActive(pathname, c.href));
  }
  return isActive(pathname, item.href);
}

function nestKey(groupId: string, label: string) {
  return `${groupId}:${label}`;
}

function pageMeta(pathname: string): { crumb: string; title: string } {
  if (pathname === "/admin") return { crumb: "Home", title: "Dashboard" };
  for (const group of navGroups) {
    for (const item of group.links) {
      if (item.children?.length) {
        const child = item.children.find((c) => isActive(pathname, c.href));
        if (child) return { crumb: item.label, title: child.label };
      } else if (isActive(pathname, item.href)) {
        return { crumb: group.label, title: item.label };
      }
    }
  }
  if (pathname.startsWith("/admin/reports"))
    return { crumb: "Reports", title: "Reports" };
  if (pathname.startsWith("/admin/transport"))
    return { crumb: "Transport", title: "Transport" };
  if (pathname.startsWith("/admin/website"))
    return { crumb: "Website", title: "Website" };
  return { crumb: "Admin", title: "SHYAM LOGISTICS" };
}

export function MasterShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    transport: true,
  });
  const [openNests, setOpenNests] = useState<Record<string, boolean>>({});
  const [backingUp, setBackingUp] = useState(false);
  const meta = useMemo(() => pageMeta(pathname), [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileNav(false);
    const id = groupOpenForPath(pathname);
    setOpenGroups({ [id]: true });
    const nests: Record<string, boolean> = {};
    for (const group of navGroups) {
      for (const item of group.links) {
        if (item.children?.some((c) => isActive(pathname, c.href))) {
          nests[nestKey(group.id, item.label)] = true;
        }
      }
    }
    setOpenNests(nests);
  }, [pathname]);

  useEffect(() => {
    const isShell =
      pathname !== "/admin/login" &&
      !pathname.startsWith("/admin/transport/booking/print") &&
      !pathname.startsWith("/admin/print");
    if (!isShell) return;

    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (
    pathname.startsWith("/admin/transport/booking/print") ||
    pathname.startsWith("/admin/print")
  ) {
    return <>{children}</>;
  }

  function toggleNest(key: string) {
    setOpenNests((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const closing = !!prev[id];
      if (closing) return { [id]: false };
      return { [id]: true };
    });
  }

  async function onBackup() {
    setBackingUp(true);
    try {
      await downloadExcelBackup();
      if (
        confirm(
          "Excel backup (.xlsx) downloaded to your Downloads folder. Exit admin?",
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
      <div className="tbs-nav-brand-block">
        <span className="tbs-nav-brand-label">Transport Billing</span>
        <strong>SHYAM LOGISTICS</strong>
      </div>

      <Link
        href="/admin"
        className={`tbs-nav-link tbs-nav-home ${pathname === "/admin" ? "active" : ""}`}
        onClick={() => setMobileNav(false)}
      >
        <span className="tbs-nav-dot" aria-hidden>
          ◆
        </span>
        Dashboard
      </Link>

      {navGroups.map((group) => {
        const open = Boolean(openGroups[group.id]);
        const groupActive = group.links.some((l) => itemIsActive(pathname, l));
        return (
          <div
            key={group.id}
            className={`tbs-nav-group ${open ? "open" : ""} ${groupActive ? "has-active" : ""}`}
          >
            <button
              type="button"
              className="tbs-nav-group-btn"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={open}
            >
              <span className="tbs-nav-group-left">
                <span className="tbs-nav-mark" aria-hidden>
                  {group.mark}
                </span>
                <span>{group.label}</span>
              </span>
              <span className="tbs-nav-chevron" aria-hidden>
                {open ? "▾" : "▸"}
              </span>
            </button>
            {open && (
              <div className="tbs-nav-links">
                {group.links.map((item) => {
                  if (item.children?.length) {
                    const key = nestKey(group.id, item.label);
                    const nestOpen = Boolean(openNests[key]);
                    const childActive = itemIsActive(pathname, item);
                    return (
                      <div
                        key={key}
                        className={`tbs-nav-nest ${nestOpen ? "open" : ""} ${childActive ? "active" : ""}`}
                      >
                        <button
                          type="button"
                          className="tbs-nav-nest-btn"
                          onClick={() => toggleNest(key)}
                          aria-expanded={nestOpen}
                        >
                          <span>{item.label}</span>
                          <span className="tbs-nav-chevron" aria-hidden>
                            {nestOpen ? "▾" : "▸"}
                          </span>
                        </button>
                        {nestOpen &&
                          item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={`tbs-nav-link tbs-nav-child ${isActive(pathname, child.href) ? "active" : ""}`}
                              onClick={() => setMobileNav(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`tbs-nav-link ${isActive(pathname, item.href) ? "active" : ""}`}
                      onClick={() => setMobileNav(false)}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="tbs-nav-footer">
        <a href="tel:8459858242" className="tbs-nav-phone">
          84598 58242
        </a>
        <p className="tbs-nav-tag">Admin · Live operations</p>
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
            <BrandLogo
              href="/admin"
              className="tbs-topbar-logo"
              companyName="SHYAM LOGISTICS"
              size="sm"
              variant="light"
            />
            <span className="tbs-admin-badge">Admin</span>
            <div className="tbs-page-meta" aria-live="polite">
              <span className="tbs-page-crumb">{meta.crumb}</span>
              <strong className="tbs-page-title">{meta.title}</strong>
            </div>
          </div>

          <AdminChrome
            backingUp={backingUp}
            onBackup={() => void onBackup()}
            onLogout={() => void onLogout()}
          />
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
