"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/tbs/useTbs";
import { partyLabel } from "@/lib/tbs/partyLabel";

type BookingRow = {
  id: string;
  lrNo: string;
  lrDate: string;
  party: string;
  from: string;
  to: string;
  amount: number;
  delivered: boolean;
  billed: boolean;
};

type Bucket = { count: number; amount: number };

type Dash = {
  persistent?: boolean;
  storage?: "sqlite" | "redis" | "local";
  collectionPct?: number;
  todayWork?: {
    date: string;
    bookings: number;
    freight: number;
    bills: number;
    billAmt: number;
    collected: number;
    vehicles: number;
  };
  week?: {
    date: string;
    label: string;
    bookings: number;
    freight: number;
    collected: number;
  }[];
  aging?: {
    d0_15: Bucket;
    d16_30: Bucket;
    d30plus: Bucket;
  };
  topRoutes?: { from: string; to: string; count: number; freight: number }[];
  topParties?: { party: string; count: number; freight: number }[];
  counts: {
    parties: number;
    bookings: number;
    bills: number;
    challans: number;
    receipts: number;
  };
  pending: {
    delivery: number;
    bill: number;
    notDeliveredNotBilled: number;
    billedNotDelivered: number;
    deliveredNotBilled: number;
    deliveredBilled: number;
    outstandingAmt: number;
    outstandingBills: number;
    hireAmt: number;
    hireCount: number;
    enquiries: number;
    lrTotal: number;
  };
  completed: {
    lrs: number;
    billsPaid: number;
    billsPaidAmt: number;
    collected: number;
    hireDone: number;
    enquiries: number;
  };
  profit: {
    income: number;
    freight: number;
    billAmt: number;
    hirePaid: number;
    challanHire: number;
    expenseNotes: number;
    expense: number;
    profit: number;
    collected: number;
    outstanding: number;
  };
  outstandingTop: { party: string; billNo: string; amount: number }[];
  pendingList: BookingRow[];
  completedList: BookingRow[];
  recentBookings?: BookingRow[];
  months?: { key: string; label: string; bookings: number; freight: number }[];
  vehicles?: { total: number; onRoad: number; idle: number; list: string[] };
};

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);
}

function fmtDate(d: string) {
  if (!d) return "—";
  const x = new Date(d);
  if (!Number.isFinite(x.getTime())) return d;
  return x.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function weekdayParts() {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
  );
  const h = now.getHours();
  return {
    weekday: now.toLocaleDateString("en-IN", { weekday: "long" }),
    date: now.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    week,
    shift: h < 12 ? "Morning shift" : h < 17 ? "Afternoon shift" : "Evening shift",
  };
}

function last6MonthShell() {
  const out: { key: string; label: string; bookings: number; freight: number }[] =
    [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const x = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`,
      label: x.toLocaleDateString("en-IN", { month: "short" }),
      bookings: 0,
      freight: 0,
    });
  }
  return out;
}

function matchRow(r: BookingRow, needle: string) {
  if (!needle) return true;
  return (
    String(r.lrNo).toLowerCase().includes(needle) ||
    partyLabel(r.party).toLowerCase().includes(needle) ||
    String(r.from).toLowerCase().includes(needle) ||
    String(r.to).toLowerCase().includes(needle)
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function statusLabel(b: BookingRow) {
  if (b.delivered && b.billed) return "Completed";
  if (b.delivered && !b.billed) return "Bill due";
  if (!b.delivered && b.billed) return "Delivery due";
  return "Pending";
}

function statusClass(b: BookingRow) {
  if (b.delivered && b.billed) return "ok";
  if (!b.delivered && !b.billed) return "warn";
  return "mid";
}

function MonthBars({
  months,
}: {
  months: { label: string; bookings: number; freight?: number }[];
}) {
  const max = Math.max(1, ...months.map((m) => m.bookings));
  const hasData = months.some((m) => m.bookings > 0);
  return (
    <>
      {!hasData ? (
        <p className="tbs-ov-empty">No data for this period</p>
      ) : null}
      <div className="tbs-ov-bars" role="img" aria-label="Bookings by month">
        {months.map((m) => (
          <div key={m.label} className="tbs-ov-bar-col">
            <div className="tbs-ov-bar-track">
              <div
                className="tbs-ov-bar"
                style={{
                  height: `${Math.max(4, Math.round((m.bookings / max) * 100))}%`,
                  opacity: m.bookings ? 1 : 0.38,
                }}
                title={`${m.label}: ${m.bookings} LR${m.freight ? ` · ${inr(m.freight)}` : ""}`}
              />
            </div>
            {hasData ? <strong>{m.bookings || ""}</strong> : null}
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function TrendLine({
  months,
}: {
  months: { label: string; bookings: number }[];
}) {
  const w = 320;
  const h = 118;
  const padX = 14;
  const padY = 18;
  const max = Math.max(1, ...months.map((m) => m.bookings));
  const hasData = months.some((m) => m.bookings > 0);
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;
  const pts = months.map((m, i) => {
    const x =
      padX +
      (months.length <= 1 ? innerW / 2 : (i * innerW) / (months.length - 1));
    const y = padY + innerH - (m.bookings / max) * innerH;
    return { x, y, label: m.label };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const last = pts[pts.length - 1];
  const first = pts[0];
  const area =
    first && last
      ? `${line} L ${last.x} ${h - padY} L ${first.x} ${h - padY} Z`
      : "";
  return (
    <>
      {!hasData ? (
        <p className="tbs-ov-empty">No monthly trend yet</p>
      ) : null}
      <svg
        className="tbs-ov-line"
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Monthly booking trend"
      >
        {area ? <path d={area} className="tbs-ov-area" /> : null}
        <path d={line} className="tbs-ov-polyline" />
        {hasData
          ? pts.map((p) => (
              <circle key={p.label} cx={p.x} cy={p.y} r="3.2" />
            ))
          : null}
      </svg>
      <div className="tbs-ov-x">
        {months.map((m) => (
          <span key={m.label}>{m.label}</span>
        ))}
      </div>
    </>
  );
}

function BillDonut({ billed, pending }: { billed: number; pending: number }) {
  const total = billed + pending;
  const r = 38;
  const c = 2 * Math.PI * r;
  const pendingLen = total ? (pending / total) * c : 0;
  const billedLen = total ? (billed / total) * c : 0;
  return (
    <div className="tbs-donut-wrap">
      <div className="tbs-donut">
        <svg viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r={r} className="tbs-donut-track" />
          {total > 0 ? (
            <>
              <circle
                cx="60"
                cy="60"
                r={r}
                className="tbs-donut-pending"
                strokeDasharray={`${pendingLen} ${c}`}
                strokeDashoffset={c / 4}
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                className="tbs-donut-billed"
                strokeDasharray={`${billedLen} ${c}`}
                strokeDashoffset={c / 4 - pendingLen}
              />
            </>
          ) : null}
        </svg>
        <div className="tbs-donut-center">
          <strong>{total}</strong>
          <span>Total</span>
        </div>
      </div>
      <ul className="tbs-donut-legend">
        <li>
          <i className="billed" /> Billed <b>{billed}</b>
        </li>
        <li>
          <i className="pending" /> Pending <b>{pending}</b>
        </li>
      </ul>
    </div>
  );
}

const quickActions = [
  { href: "/admin/transport/booking", title: "New Booking", desc: "Create LR", tone: "red", mark: "LR" },
  { href: "/admin/registration/parties", title: "Party", desc: "Add customer", tone: "navy", mark: "P" },
  { href: "/admin/transport/lhc", title: "LHC", desc: "Hire challan", tone: "amber", mark: "HC" },
  { href: "/admin/transport/bill", title: "Bill", desc: "Party invoice", tone: "teal", mark: "B" },
  { href: "/admin/transport/money-receipt/new", title: "Receipt", desc: "Collect payment", tone: "ok", mark: "MR" },
  { href: "/admin/website/enquiries", title: "Enquiries", desc: "Website leads", tone: "muted", mark: "E" },
];

export default function AdminMasterPage() {
  const ready = useAdminAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [wiping, setWiping] = useState(false);
  const [q, setQ] = useState("");
  const [clock, setClock] = useState("");

  async function loadDash() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/tbs/dashboard", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        throw new Error("Session expired — please log in again");
      }
      if (!res.ok) {
        throw new Error(`Dashboard API error (${res.status})`);
      }
      const json = (await res.json()) as Dash;
      setData({
        ...json,
        pendingList: json.pendingList || [],
        completedList: json.completedList || [],
        outstandingTop: json.outstandingTop || [],
        pending: json.pending || {
          delivery: 0,
          bill: 0,
          notDeliveredNotBilled: 0,
          billedNotDelivered: 0,
          deliveredNotBilled: 0,
          deliveredBilled: 0,
          outstandingAmt: 0,
          outstandingBills: 0,
          hireAmt: 0,
          hireCount: 0,
          enquiries: 0,
          lrTotal: 0,
        },
        completed: json.completed || {
          lrs: 0,
          billsPaid: 0,
          billsPaidAmt: 0,
          collected: 0,
          hireDone: 0,
          enquiries: 0,
        },
        profit: json.profit || {
          income: 0,
          freight: 0,
          billAmt: 0,
          hirePaid: 0,
          challanHire: 0,
          expenseNotes: 0,
          expense: 0,
          profit: 0,
          collected: 0,
          outstanding: 0,
        },
        counts: json.counts || {
          parties: 0,
          bookings: 0,
          bills: 0,
          challans: 0,
          receipts: 0,
        },
        months: json.months || [],
        vehicles: json.vehicles || { total: 0, onRoad: 0, idle: 0, list: [] },
        recentBookings: json.recentBookings || [],
      });
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Dashboard data failed to load",
      );
    } finally {
      setLoading(false);
    }
  }

  async function wipeAllData() {
    if (
      !confirm(
        "Delete ALL admin data?\n\nParties, bookings, bills, challans, receipts, and notes will be cleared. This cannot be undone.",
      )
    ) {
      return;
    }
    if (!confirm("Final confirm: wipe everything?")) return;
    setWiping(true);
    setErr("");
    try {
      const res = await fetch("/api/tbs/wipe", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || `Wipe failed (${res.status})`);
      }
      await loadDash();
      alert("All TBS data cleared. Page will reload.");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Wipe failed");
    } finally {
      setWiping(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void loadDash();
    const refresh = window.setInterval(() => void loadDash(), 60000);
    return () => window.clearInterval(refresh);
  }, [ready]);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!ready) return <div className="tbs-empty">Loading…</div>;

  const p = data?.pending;
  const c = data?.completed;
  const pr = data?.profit;
  const profitPositive = (pr?.profit ?? 0) >= 0;
  const totalLr = data?.counts.bookings || 0;
  const donePct =
    totalLr > 0 ? Math.round(((c?.lrs || 0) / totalLr) * 100) : 0;
  const isFresh =
    data &&
    data.counts.parties === 0 &&
    data.counts.bookings === 0 &&
    data.counts.bills === 0;
  const today = weekdayParts();
  const tw = data?.todayWork;
  const week = data?.week || [];
  const aging = data?.aging;
  const months =
    data?.months && data.months.length > 0
      ? data.months
      : last6MonthShell();
  const vehicles = data?.vehicles || { total: 0, onRoad: 0, idle: 0, list: [] };
  const needle = q.trim().toLowerCase();
  const recentBookings = (data?.recentBookings || []).filter((r) =>
    matchRow(r, needle),
  );
  const pendingRows = (data?.pendingList || []).filter((r) =>
    matchRow(r, needle),
  );
  const completedRows = (data?.completedList || []).filter((r) =>
    matchRow(r, needle),
  );
  const outstandingRows = (data?.outstandingTop || []).filter((r) => {
    if (!needle) return true;
    return (
      partyLabel(r.party).toLowerCase().includes(needle) ||
      String(r.billNo).toLowerCase().includes(needle)
    );
  });
  const nextMove = !data
    ? null
    : data.counts.parties === 0
      ? { href: "/admin/registration/parties", label: "Add a party" }
      : data.counts.bookings === 0
        ? { href: "/admin/transport/booking", label: "Create the first LR" }
        : (p?.deliveredNotBilled || 0) > 0
          ? { href: "/admin/transport/bill", label: "Prepare pending bills" }
          : (p?.outstandingAmt || 0) > 0
            ? {
                href: "/admin/transport/money-receipt/new",
                label: "Collect outstanding",
              }
            : (p?.hireCount || 0) > 0
              ? { href: "/admin/transport/lhp/new", label: "Pay lorry hire" }
              : (p?.enquiries || 0) > 0
                ? { href: "/admin/website/enquiries", label: "Follow website leads" }
                : { href: "/admin/transport/booking", label: "New booking" };
  const pipeTotal =
    (p?.notDeliveredNotBilled || 0) +
    (p?.deliveredNotBilled || 0) +
    (p?.billedNotDelivered || 0) +
    (c?.lrs || 0);
  const pipeOpen = p?.notDeliveredNotBilled || 0;
  const pipeBill = p?.deliveredNotBilled || 0;
  const pipeDel = p?.billedNotDelivered || 0;
  const pipeDone = c?.lrs || 0;
  const pipeDonePct = pipeTotal ? Math.round((pipeDone / pipeTotal) * 100) : 0;
  const weekLr = week.reduce((s, d) => s + d.bookings, 0);
  const weekColl = week.reduce((s, d) => s + d.collected, 0);
  const weekBarMax = Math.max(1, ...week.map((d) => d.bookings));
  const weekCollMax = Math.max(1, ...week.map((d) => d.collected));
  const ageAmt =
    (aging?.d0_15.amount || 0) +
    (aging?.d16_30.amount || 0) +
    (aging?.d30plus.amount || 0);
  const ageCount =
    (aging?.d0_15.count || 0) +
    (aging?.d16_30.count || 0) +
    (aging?.d30plus.count || 0);

  const attention: { href: string; label: string; value: string; tone: string }[] = [];
  if (p) {
    if (p.outstandingAmt > 0)
      attention.push({
        href: "/admin/reports/party-outstanding/billingwise",
        label: "Outstanding",
        value: inr(p.outstandingAmt),
        tone: "red",
      });
    if (p.deliveredNotBilled > 0)
      attention.push({
        href: "/admin/reports/booking?status=delivered_not_billed",
        label: "Bill pending",
        value: String(p.deliveredNotBilled),
        tone: "amber",
      });
    if (p.billedNotDelivered > 0)
      attention.push({
        href: "/admin/reports/booking?status=billed_not_delivered",
        label: "Delivery pending",
        value: String(p.billedNotDelivered),
        tone: "navy",
      });
    if (p.hireCount > 0)
      attention.push({
        href: "/admin/transport/lhp/new",
        label: "Hire due",
        value: inr(p.hireAmt),
        tone: "muted",
      });
    if (p.enquiries > 0)
      attention.push({
        href: "/admin/website/enquiries",
        label: "New enquiries",
        value: String(p.enquiries),
        tone: "navy",
      });
  }

  return (
    <div className="tbs-dash">
      <section className="tbs-dash-hero">
        <div className="tbs-dash-hero-top">
          <div>
            <span className="tbs-dash-eyebrow">
              Live operations · {today.date}
            </span>
            <h1>
              {greeting()}
              <span className="tbs-dash-brand"> · SHYAM LOGISTICS</span>
            </h1>
            <p>
              {today.shift}. Track bookings, collections, hire, and pending LRs
              from one desk.
            </p>
          </div>
          <div className="tbs-dash-today" aria-label={`Today is ${today.weekday}`}>
            <span className="tbs-dash-today-kicker">
              Today · Live IST
            </span>
            <strong>{today.weekday}</strong>
            <span className="tbs-dash-today-clock">{clock || "—"}</span>
            <span>
              {today.date} · Week {today.week}
            </span>
          </div>
          <div className="tbs-dash-hero-actions">
            <Link href="/admin/transport/booking" className="tbs-dash-cta">
              + New Booking
            </Link>
            <button
              type="button"
              className="tbs-dash-refresh"
              onClick={() => void loadDash()}
              disabled={loading || wiping}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>
            <button
              type="button"
              className="tbs-dash-wipe"
              onClick={() => void wipeAllData()}
              disabled={loading || wiping}
            >
              {wiping ? "Deleting…" : "Clear all data"}
            </button>
          </div>
        </div>
        {data && (
          <>
            <div className="tbs-dash-hero-stats tbs-dash-hero-stats-6">
              <div>
                <strong>{p!.lrTotal}</strong>
                <span>Pending LR</span>
              </div>
              <div>
                <strong>{c!.lrs}</strong>
                <span>Completed LR</span>
              </div>
              <div>
                <strong>{inr(p!.outstandingAmt)}</strong>
                <span>Outstanding</span>
              </div>
              <div>
                <strong className={profitPositive ? "" : "neg"}>
                  {inr(pr!.profit)}
                </strong>
                <span>Gross profit</span>
              </div>
              <div>
                <strong>{tw?.bookings ?? 0}</strong>
                <span>Today LR</span>
              </div>
              <div>
                <strong>{inr(tw?.collected ?? 0)}</strong>
                <span>Today collection</span>
              </div>
            </div>
            <div className="tbs-hero-pulse">
              <div>
                <span>Today freight</span>
                <strong>{inr(tw?.freight ?? 0)}</strong>
              </div>
              <div>
                <span>Today bills</span>
                <strong>
                  {tw?.bills ?? 0}
                  <small> {inr(tw?.billAmt ?? 0)}</small>
                </strong>
              </div>
              <div>
                <span>Vehicles on road</span>
                <strong>{tw?.vehicles ?? 0}</strong>
              </div>
              <div>
                <span>Collection rate</span>
                <strong>{data.collectionPct ?? 0}%</strong>
              </div>
            </div>
            <div className="tbs-dash-progress" aria-hidden>
              <div
                className="tbs-dash-progress-bar"
                style={{ width: `${donePct}%` }}
              />
            </div>
            <p className="tbs-dash-progress-label">
              {totalLr === 0
                ? "No bookings yet — start with a party, then create an LR."
                : `${donePct}% of LRs delivered and billed · ${totalLr} total · Today ${tw?.bookings || 0} LR / ${inr(tw?.collected || 0)} collected`}
            </p>
            {nextMove ? (
              <Link href={nextMove.href} className="tbs-next-move">
                Next action · {nextMove.label} →
              </Link>
            ) : null}
          </>
        )}
      </section>

      <div className="tbs-quick-grid">
        {quickActions.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`tbs-quick-card tbs-quick-${m.tone}`}
          >
            <span className="tbs-quick-mark" aria-hidden>
              {m.mark}
            </span>
            <strong>{m.title}</strong>
            <span>{m.desc}</span>
          </Link>
        ))}
      </div>

      {data ? (
        <section className="tbs-cmd" aria-label="Dashboard controls">
          <label className="tbs-cmd-search">
            <span>Jump LR / party / station</span>
            <input
              className="tbs-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type LR no, party, From or To…"
              autoComplete="off"
            />
          </label>
          <div className="tbs-cmd-chips">
            <span className="tbs-chip tbs-chip-ok">
              DB · {(data.storage || "local").toUpperCase()}
            </span>
            <span className="tbs-chip">
              Collection {data.collectionPct ?? 0}%
            </span>
            <span className="tbs-chip">
              Today vehicles {tw?.vehicles ?? 0}
            </span>
            <span className="tbs-chip">Auto-refresh 60s</span>
          </div>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="tbs-overview" aria-label="Booking charts">
            <article className="tbs-ov-card">
              <header className="tbs-ov-head">
                <h2>Booking Overview</h2>
                <Link href="/admin/reports/booking">View list</Link>
              </header>
              <MonthBars months={months} />
            </article>

            <article className="tbs-ov-card">
              <header className="tbs-ov-head">
                <h2>Pending Bills</h2>
                <Link href="/admin/transport/bill">View list</Link>
              </header>
              <BillDonut
                billed={c?.billsPaid || 0}
                pending={p?.outstandingBills || 0}
              />
            </article>

            <article className="tbs-ov-card">
              <header className="tbs-ov-head">
                <h2>Monthly Booking Trend</h2>
              </header>
              <TrendLine months={months} />
            </article>
          </section>

          <section className="tbs-ov-row2" aria-label="Vehicles and recent bookings">
            <article className="tbs-ov-card">
              <header className="tbs-ov-head">
                <h2>Vehicle Status</h2>
                <Link href="/admin/transport/lhc">View list</Link>
              </header>
              {vehicles.total === 0 ? (
                <p className="tbs-ov-empty">No vehicles recorded yet</p>
              ) : (
                <>
                  <div className="tbs-veh-stats">
                    <div className="tbs-veh-stat on">
                      <span>On road</span>
                      <strong>{vehicles.onRoad}</strong>
                    </div>
                    <div className="tbs-veh-stat idle">
                      <span>Idle</span>
                      <strong>{vehicles.idle}</strong>
                    </div>
                  </div>
                  {vehicles.list.length > 0 ? (
                    <div className="tbs-veh-list">
                      {vehicles.list.map((v) => (
                        <span key={v} className="tbs-veh-tag">
                          {v}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="tbs-ov-empty">No vehicles moving today</p>
                  )}
                </>
              )}
            </article>

            <article className="tbs-ov-card">
              <header className="tbs-ov-head">
                <h2>Recent Booking</h2>
                <Link href="/admin/transport/booking">View list</Link>
              </header>
              {recentBookings.length === 0 ? (
                <p className="tbs-ov-empty">No bookings yet</p>
              ) : (
                <ul className="tbs-recent-list">
                  {recentBookings.slice(0, 6).map((r) => (
                    <li key={r.id}>
                      <div>
                        <Link href="/admin/transport/booking" className="tbs-recent-lr">
                          {r.lrNo}
                        </Link>
                        <span>
                          {partyLabel(r.party)} · {r.from} → {r.to}
                        </span>
                      </div>
                      <div className="tbs-recent-meta">
                        <strong>{inr(r.amount)}</strong>
                        <em className={`tbs-recent-st ${statusClass(r)}`}>
                          {statusLabel(r)}
                        </em>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      ) : null}

      {data ? (
        <section className="tbs-adv-row" aria-label="Operations snapshot">
          <article className="tbs-adv-card">
            <header className="tbs-adv-head">
              <div>
                <h2>LR pipeline</h2>
                <p>Open work vs completed</p>
              </div>
              <div className="tbs-adv-kpi">
                <strong>{pipeDonePct}%</strong>
                <span>done</span>
              </div>
            </header>
            {pipeTotal === 0 ? (
              <p className="tbs-adv-empty">No LRs yet — pipeline fills after the first booking.</p>
            ) : (
              <>
                <div className="tbs-pipe" role="img" aria-label="LR status mix">
                  <span
                    className="tbs-pipe-seg warn"
                    style={{ flex: Math.max(pipeOpen, 0) || 0 }}
                    title={`Open ${pipeOpen}`}
                  />
                  <span
                    className="tbs-pipe-seg amber"
                    style={{ flex: Math.max(pipeBill, 0) || 0 }}
                    title={`Bill due ${pipeBill}`}
                  />
                  <span
                    className="tbs-pipe-seg navy"
                    style={{ flex: Math.max(pipeDel, 0) || 0 }}
                    title={`Delivery due ${pipeDel}`}
                  />
                  <span
                    className="tbs-pipe-seg ok"
                    style={{ flex: Math.max(pipeDone, 0) || 0 }}
                    title={`Done ${pipeDone}`}
                  />
                </div>
                <p className="tbs-adv-meta">
                  {pipeOpen + pipeBill + pipeDel} open · {pipeDone} completed · {pipeTotal} total
                </p>
                <div className="tbs-pipe-grid">
                  <Link
                    href="/admin/reports/booking?status=not_delivered_not_billed"
                    className="tbs-pipe-tile warn"
                  >
                    <span>Open</span>
                    <strong>{pipeOpen}</strong>
                    <small>{pipeTotal ? Math.round((pipeOpen / pipeTotal) * 100) : 0}%</small>
                  </Link>
                  <Link
                    href="/admin/reports/booking?status=delivered_not_billed"
                    className="tbs-pipe-tile amber"
                  >
                    <span>Bill due</span>
                    <strong>{pipeBill}</strong>
                    <small>{pipeTotal ? Math.round((pipeBill / pipeTotal) * 100) : 0}%</small>
                  </Link>
                  <Link
                    href="/admin/reports/booking?status=billed_not_delivered"
                    className="tbs-pipe-tile navy"
                  >
                    <span>Delivery due</span>
                    <strong>{pipeDel}</strong>
                    <small>{pipeTotal ? Math.round((pipeDel / pipeTotal) * 100) : 0}%</small>
                  </Link>
                  <Link href="/admin/reports/booking" className="tbs-pipe-tile ok">
                    <span>Done</span>
                    <strong>{pipeDone}</strong>
                    <small>{pipeDonePct}%</small>
                  </Link>
                </div>
              </>
            )}
          </article>

          <article className="tbs-adv-card">
            <header className="tbs-adv-head">
              <div>
                <h2>Last 7 days</h2>
                <p>Bookings and collection</p>
              </div>
              <div className="tbs-adv-kpi">
                <strong>{weekLr}</strong>
                <span>LR</span>
              </div>
            </header>
            {weekLr === 0 && weekColl === 0 ? (
              <p className="tbs-adv-empty">No movement this week yet.</p>
            ) : null}
            <div className="tbs-week" role="img" aria-label="Last 7 days bookings">
              {week.map((d) => {
                const isToday = d.date === tw?.date;
                return (
                  <div
                    key={d.date}
                    className={`tbs-week-col${isToday ? " today" : ""}`}
                    title={`${d.date}: ${d.bookings} LR · ${inr(d.collected)} collected`}
                  >
                    <em>{d.bookings}</em>
                    <div className="tbs-week-bar-wrap">
                      <div
                        className="tbs-week-bar"
                        style={{
                          height: `${Math.max(6, Math.round((d.bookings / weekBarMax) * 78))}px`,
                          opacity: d.bookings ? 1 : 0.28,
                        }}
                      />
                      <div
                        className="tbs-week-bar coll"
                        style={{
                          height: `${d.collected ? Math.max(4, Math.round((d.collected / weekCollMax) * 78)) : 4}px`,
                          opacity: d.collected ? 1 : 0.22,
                        }}
                      />
                    </div>
                    <span>{isToday ? "Today" : d.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="tbs-week-foot">
              <span>
                <i className="lr" /> Bookings
              </span>
              <span>
                <i className="rs" /> Collection {inr(weekColl)}
              </span>
            </div>
          </article>

          <article className="tbs-adv-card">
            <header className="tbs-adv-head">
              <div>
                <h2>Outstanding aging</h2>
                <p>Unpaid bills by age</p>
              </div>
              <div className="tbs-adv-kpi">
                <strong>{inr(ageAmt)}</strong>
                <span>{ageCount} bills</span>
              </div>
            </header>
            {ageAmt === 0 ? (
              <p className="tbs-adv-empty">No unpaid bills — collection is clear.</p>
            ) : (
              <>
                <div className="tbs-age-mix" aria-hidden>
                  <span
                    className="a0"
                    style={{ flex: Math.max(aging?.d0_15.amount || 0, 0.01) }}
                  />
                  <span
                    className="a1"
                    style={{ flex: Math.max(aging?.d16_30.amount || 0, 0.01) }}
                  />
                  <span
                    className="a2"
                    style={{ flex: Math.max(aging?.d30plus.amount || 0, 0.01) }}
                  />
                </div>
                <div className="tbs-age">
                  <Link href="/admin/reports/party-outstanding/dayswise" className="tbs-age-cell">
                    <span>0–15 days</span>
                    <strong>{inr(aging?.d0_15.amount || 0)}</strong>
                    <div className="tbs-age-bar">
                      <i
                        style={{
                          width: `${ageAmt ? Math.round(((aging?.d0_15.amount || 0) / ageAmt) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <small>
                      {aging?.d0_15.count || 0} bills ·{" "}
                      {ageAmt ? Math.round(((aging?.d0_15.amount || 0) / ageAmt) * 100) : 0}%
                    </small>
                  </Link>
                  <Link href="/admin/reports/party-outstanding/dayswise" className="tbs-age-cell mid">
                    <span>16–30 days</span>
                    <strong>{inr(aging?.d16_30.amount || 0)}</strong>
                    <div className="tbs-age-bar">
                      <i
                        style={{
                          width: `${ageAmt ? Math.round(((aging?.d16_30.amount || 0) / ageAmt) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <small>
                      {aging?.d16_30.count || 0} bills ·{" "}
                      {ageAmt ? Math.round(((aging?.d16_30.amount || 0) / ageAmt) * 100) : 0}%
                    </small>
                  </Link>
                  <Link href="/admin/reports/party-outstanding/dayswise" className="tbs-age-cell hot">
                    <span>30+ days</span>
                    <strong>{inr(aging?.d30plus.amount || 0)}</strong>
                    <div className="tbs-age-bar">
                      <i
                        style={{
                          width: `${ageAmt ? Math.round(((aging?.d30plus.amount || 0) / ageAmt) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <small>
                      {aging?.d30plus.count || 0} bills ·{" "}
                      {ageAmt ? Math.round(((aging?.d30plus.amount || 0) / ageAmt) * 100) : 0}%
                    </small>
                  </Link>
                </div>
              </>
            )}
          </article>
        </section>
      ) : null}

      {data && attention.length > 0 && !isFresh ? (
        <section className="tbs-attention" aria-label="Needs attention">
          <div className="tbs-attention-head">
            <h2>Needs attention</h2>
            <span>{attention.length} item{attention.length === 1 ? "" : "s"}</span>
          </div>
          <div className="tbs-attention-grid">
            {attention.map((a) => (
              <Link
                key={a.href + a.label}
                href={a.href}
                className={`tbs-attention-card tbs-att-${a.tone}`}
              >
                <span>{a.label}</span>
                <strong>{a.value}</strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {data && data.storage === "local" && data.persistent === false && (
        <details className="tbs-setup-compact" open>
          <summary>
            Data is only in this browser until cloud SQLite is connected
          </summary>
          <ol className="tbs-setup-steps">
            <li>
              Vercel cannot keep a SQLite file on disk. That is why bookings stay
              in one browser today.
            </li>
            <li>
              Create a free SQLite database at{" "}
              <a href="https://turso.tech" target="_blank" rel="noreferrer">
                turso.tech
              </a>
              , then copy the URL and token.
            </li>
            <li>
              Vercel → Settings → Environment Variables (Production):{" "}
              <code>TURSO_DATABASE_URL</code> + <code>TURSO_AUTH_TOKEN</code> →
              Redeploy
            </li>
            <li>
              After redeploy, dashboard chip should show <strong>DB · SQLITE</strong>.
              Then every login sees the same parties, LRs, and bills.
            </li>
          </ol>
        </details>
      )}

      {err && (
        <div
          className="tbs-msg err"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
        >
          <span>{err}</span>
          <button
            type="button"
            className="tbs-btn"
            onClick={() => void loadDash()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Retry"}
          </button>
        </div>
      )}

      {!data && !err ? (
        <div className="tbs-dash-skel" aria-busy>
          <div className="tbs-skel-block" />
          <div className="tbs-skel-row">
            <div className="tbs-skel-block" />
            <div className="tbs-skel-block" />
          </div>
        </div>
      ) : !data ? null : (
        <>
          {isFresh ? (
            <section className="tbs-start">
              <h2>Start here</h2>
              <p>Records are empty. Follow these three steps to begin billing.</p>
              <ol>
                <li>
                  <Link href="/admin/registration/parties">Add a party</Link>
                  <span>Consignor, consignee, or both — with address and GST.</span>
                </li>
                <li>
                  <Link href="/admin/transport/booking">Create a booking / LR</Link>
                  <span>From, To, vehicle, freight, and charges.</span>
                </li>
                <li>
                  <Link href="/admin/transport/bill">Prepare a bill</Link>
                  <span>Then collect with Money Receipt when payment comes in.</span>
                </li>
              </ol>
            </section>
          ) : null}

          <div className="tbs-pc-grid">
            <section className="tbs-pc-panel tbs-pc-pending">
              <header className="tbs-pc-head">
                <div>
                  <h2>Pending</h2>
                  <p className="tbs-pc-subline">Work still open</p>
                </div>
                <span className="tbs-pc-badge warn">{p!.lrTotal} LR</span>
              </header>
              <div className="tbs-pc-kpis">
                <Link
                  href="/admin/reports/booking?status=not_delivered_not_billed"
                  className="tbs-kpi tbs-kpi-warn"
                >
                  <span className="tbs-kpi-label">Not delivered / not billed</span>
                  <strong className="tbs-kpi-value">
                    {p!.notDeliveredNotBilled}
                  </strong>
                </Link>
                <Link
                  href="/admin/reports/booking?status=delivered_not_billed"
                  className="tbs-kpi tbs-kpi-amber"
                >
                  <span className="tbs-kpi-label">Bill pending</span>
                  <strong className="tbs-kpi-value">
                    {p!.deliveredNotBilled}
                  </strong>
                </Link>
                <Link
                  href="/admin/reports/booking?status=billed_not_delivered"
                  className="tbs-kpi"
                >
                  <span className="tbs-kpi-label">Delivery pending</span>
                  <strong className="tbs-kpi-value">
                    {p!.billedNotDelivered}
                  </strong>
                </Link>
                <Link
                  href="/admin/reports/party-outstanding/billingwise"
                  className="tbs-kpi tbs-kpi-red"
                >
                  <span className="tbs-kpi-label">Outstanding</span>
                  <strong className="tbs-kpi-value tbs-kpi-value-sm">
                    {inr(p!.outstandingAmt)}
                  </strong>
                  <span className="tbs-kpi-hint">
                    {p!.outstandingBills} bills
                  </span>
                </Link>
                <Link href="/admin/transport/lhp/new" className="tbs-kpi">
                  <span className="tbs-kpi-label">Hire due</span>
                  <strong className="tbs-kpi-value tbs-kpi-value-sm">
                    {inr(p!.hireAmt)}
                  </strong>
                  <span className="tbs-kpi-hint">{p!.hireCount} challans</span>
                </Link>
                <Link
                  href="/admin/website/enquiries"
                  className="tbs-kpi tbs-kpi-navy"
                >
                  <span className="tbs-kpi-label">New enquiries</span>
                  <strong className="tbs-kpi-value">{p!.enquiries}</strong>
                </Link>
              </div>
              <div className="tbs-dash-table-wrap">
                <div className="tbs-pc-table-head">
                  <h3 className="tbs-pc-sub">Pending LRs</h3>
                  <Link href="/admin/reports/booking" className="tbs-pc-more">
                    View all →
                  </Link>
                </div>
                {pendingRows.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>{needle ? "No pending LRs match search." : "No pending LRs."}</p>
                    <Link href="/admin/transport/booking">Create booking →</Link>
                  </div>
                ) : (
                  <LrTable rows={pendingRows} />
                )}
              </div>
            </section>

            <section className="tbs-pc-panel tbs-pc-done">
              <header className="tbs-pc-head">
                <div>
                  <h2>Completed</h2>
                  <p className="tbs-pc-subline">Delivered and billed</p>
                </div>
                <span className="tbs-pc-badge ok">{c!.lrs} LR</span>
              </header>
              <div className="tbs-pc-kpis">
                <Link
                  href="/admin/reports/booking?status=delivered_billed"
                  className="tbs-kpi tbs-kpi-ok"
                >
                  <span className="tbs-kpi-label">Delivered &amp; billed</span>
                  <strong className="tbs-kpi-value">{c!.lrs}</strong>
                </Link>
                <div className="tbs-kpi tbs-kpi-ok">
                  <span className="tbs-kpi-label">Bills fully paid</span>
                  <strong className="tbs-kpi-value">{c!.billsPaid}</strong>
                  <span className="tbs-kpi-hint">{inr(c!.billsPaidAmt)}</span>
                </div>
                <Link
                  href="/admin/transport/money-receipt/new"
                  className="tbs-kpi tbs-kpi-ok"
                >
                  <span className="tbs-kpi-label">Collected (MR)</span>
                  <strong className="tbs-kpi-value tbs-kpi-value-sm">
                    {inr(c!.collected)}
                  </strong>
                </Link>
                <div className="tbs-kpi tbs-kpi-ok">
                  <span className="tbs-kpi-label">Hire settled</span>
                  <strong className="tbs-kpi-value">{c!.hireDone}</strong>
                  <span className="tbs-kpi-hint">challans</span>
                </div>
                <Link
                  href="/admin/website/enquiries"
                  className="tbs-kpi tbs-kpi-ok"
                >
                  <span className="tbs-kpi-label">Enquiries handled</span>
                  <strong className="tbs-kpi-value">{c!.enquiries}</strong>
                </Link>
                <Link
                  href="/admin/reports/profit"
                  className="tbs-kpi tbs-kpi-ok"
                >
                  <span className="tbs-kpi-label">Gross profit</span>
                  <strong
                    className={`tbs-kpi-value tbs-kpi-value-sm ${profitPositive ? "pos" : "neg"}`}
                  >
                    {inr(pr!.profit)}
                  </strong>
                </Link>
              </div>
              <div className="tbs-dash-table-wrap">
                <div className="tbs-pc-table-head">
                  <h3 className="tbs-pc-sub">Completed LRs</h3>
                  <Link
                    href="/admin/reports/booking?status=delivered_billed"
                    className="tbs-pc-more"
                  >
                    View all →
                  </Link>
                </div>
                {completedRows.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>{needle ? "No completed LRs match search." : "No completed LRs yet."}</p>
                    <Link href="/admin/reports/booking">Open booking report →</Link>
                  </div>
                ) : (
                  <LrTable rows={completedRows} completed />
                )}
              </div>
            </section>
          </div>

          <div className="tbs-dash-split">
            <section>
              <h2 className="tbs-dash-section">Profit &amp; cash</h2>
              <div className="tbs-profit-panel">
                <div className="tbs-profit-main">
                  <span className="tbs-kpi-label">Gross profit</span>
                  <strong
                    className={`tbs-profit-big ${profitPositive ? "pos" : "neg"}`}
                  >
                    {inr(pr!.profit)}
                  </strong>
                  <span className="tbs-kpi-hint">
                    Income {inr(pr!.income)} − Expense {inr(pr!.expense)}
                  </span>
                  <Link href="/admin/reports/profit" className="tbs-profit-link">
                    Open profit report →
                  </Link>
                </div>
                <div className="tbs-profit-breakdown">
                  <div>
                    <span>Bill income</span>
                    <strong>{inr(pr!.billAmt)}</strong>
                  </div>
                  <div>
                    <span>Booking freight</span>
                    <strong>{inr(pr!.freight)}</strong>
                  </div>
                  <div>
                    <span>Collected (MR)</span>
                    <strong>{inr(pr!.collected)}</strong>
                  </div>
                  <div>
                    <span>Lorry hire</span>
                    <strong>{inr(pr!.hirePaid || pr!.challanHire)}</strong>
                  </div>
                  <div>
                    <span>Expense vouchers</span>
                    <strong>{inr(pr!.expenseNotes)}</strong>
                  </div>
                  <div>
                    <span>Still outstanding</span>
                    <strong className="neg-text">{inr(pr!.outstanding)}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="tbs-dash-section">Top outstanding</h2>
              <div className="tbs-dash-table-wrap tbs-dash-table-card">
                {outstandingRows.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>{needle ? "No matching bills." : "No outstanding bills."}</p>
                    <Link href="/admin/transport/bill">Prepare a bill →</Link>
                  </div>
                ) : (
                  <div className="tbs-table-scroll">
                    <table className="tbs-grid tbs-dash-table">
                      <thead>
                        <tr>
                          <th>Party</th>
                          <th>Bill</th>
                          <th>Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingRows.map((r) => (
                          <tr key={`${r.billNo}-${r.party}`}>
                            <td>{partyLabel(r.party)}</td>
                            <td>{r.billNo}</td>
                            <td className="tbs-amt-due">{inr(r.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Link
                  href="/admin/reports/party-outstanding/billingwise"
                  className="tbs-profit-link"
                >
                  Full outstanding →
                </Link>
              </div>
            </section>
          </div>

          <div className="tbs-dash-split">
            <section>
              <h2 className="tbs-dash-section">Top lanes</h2>
              <div className="tbs-dash-table-wrap tbs-dash-table-card">
                {(data.topRoutes || []).length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>No routes yet.</p>
                    <Link href="/admin/transport/booking">Create booking →</Link>
                  </div>
                ) : (
                  <div className="tbs-table-scroll">
                    <table className="tbs-grid tbs-dash-table">
                      <thead>
                        <tr>
                          <th>From → To</th>
                          <th>LRs</th>
                          <th>Freight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.topRoutes || []).map((r) => (
                          <tr key={`${r.from}-${r.to}`}>
                            <td>
                              {r.from} → {r.to}
                            </td>
                            <td>{r.count}</td>
                            <td>{inr(r.freight)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
            <section>
              <h2 className="tbs-dash-section">Top billing parties</h2>
              <div className="tbs-dash-table-wrap tbs-dash-table-card">
                {(data.topParties || []).length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>No party freight yet.</p>
                  </div>
                ) : (
                  <div className="tbs-table-scroll">
                    <table className="tbs-grid tbs-dash-table">
                      <thead>
                        <tr>
                          <th>Party</th>
                          <th>LRs</th>
                          <th>Freight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data.topParties || []).map((r) => (
                          <tr key={r.party}>
                            <td>{r.party}</td>
                            <td>{r.count}</td>
                            <td>{inr(r.freight)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          <h2 className="tbs-dash-section">Masters snapshot</h2>
          <div className="tbs-snap-grid">
            <Link href="/admin/registration/parties" className="tbs-snap">
              <strong>{data.counts.parties}</strong>
              <span>Parties</span>
            </Link>
            <Link href="/admin/transport/booking" className="tbs-snap">
              <strong>{data.counts.bookings}</strong>
              <span>Bookings</span>
            </Link>
            <Link href="/admin/transport/lhc" className="tbs-snap">
              <strong>{data.counts.challans}</strong>
              <span>Challans</span>
            </Link>
            <Link href="/admin/transport/bill" className="tbs-snap">
              <strong>{data.counts.bills}</strong>
              <span>Bills</span>
            </Link>
            <Link href="/admin/transport/money-receipt/new" className="tbs-snap">
              <strong>{data.counts.receipts}</strong>
              <span>Money receipts</span>
            </Link>
            <Link href="/admin/reports/booking" className="tbs-snap">
              <strong>{c!.lrs}</strong>
              <span>Completed LRs</span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function LrTable({
  rows,
  completed,
}: {
  rows: BookingRow[];
  completed?: boolean;
}) {
  return (
    <div className="tbs-table-scroll">
      <table className="tbs-grid tbs-dash-table">
        <thead>
          <tr>
            <th>LR</th>
            <th>Party</th>
            <th>Status</th>
            <th>Amt</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.id}>
              <td>
                <Link href="/admin/transport/booking" className="tbs-lr-link">
                  <div className="tbs-lr-cell">
                    <strong>{b.lrNo}</strong>
                    <small>
                      {fmtDate(b.lrDate)} · {b.from || "—"}→{b.to || "—"}
                    </small>
                  </div>
                </Link>
              </td>
              <td>{partyLabel(b.party)}</td>
              <td>
                <span
                  className={`tbs-status-pill ${completed ? "ok" : statusClass(b)}`}
                >
                  {completed ? "Completed" : statusLabel(b)}
                </span>
              </td>
              <td>{inr(b.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
