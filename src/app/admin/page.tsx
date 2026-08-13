"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdminAuth } from "@/components/tbs/useTbs";

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

type Dash = {
  persistent?: boolean;
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

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

const quickActions = [
  { href: "/admin/transport/booking", title: "New Booking", desc: "Create LR", tone: "red" },
  { href: "/admin/registration/parties", title: "Party", desc: "Add customer", tone: "navy" },
  { href: "/admin/transport/lhc", title: "LHC", desc: "Hire challan", tone: "amber" },
  { href: "/admin/transport/bill", title: "Bill", desc: "Party invoice", tone: "teal" },
  { href: "/admin/transport/money-receipt/new", title: "Receipt", desc: "Collect payment", tone: "ok" },
  { href: "/admin/website/enquiries", title: "Enquiries", desc: "Website leads", tone: "muted" },
];

export default function AdminMasterPage() {
  const ready = useAdminAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
      });
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Dashboard data failed to load",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    void loadDash();
  }, [ready]);

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

  return (
    <div className="tbs-dash">
      <section className="tbs-dash-hero">
        <div className="tbs-dash-hero-top">
          <span className="tbs-dash-eyebrow">Dashboard · {todayLabel()}</span>
          <button
            type="button"
            className="tbs-dash-refresh"
            onClick={() => void loadDash()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <h1>SHYAM LOGISTIC</h1>
        <p>Today’s work, collections, and pending LRs in one place.</p>
        {data && (
          <>
            <div className="tbs-dash-hero-stats tbs-dash-hero-stats-4">
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
                : `${donePct}% of LRs delivered and billed`}
            </p>
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
            <strong>{m.title}</strong>
            <span>{m.desc}</span>
          </Link>
        ))}
      </div>

      {data && data.persistent === false && (
        <details className="tbs-setup-compact">
          <summary>
            Save / Delete works in this browser until Redis is set
          </summary>
          <ol className="tbs-setup-steps">
            <li>
              Add, Update, and Delete are stored in this browser (Vercel disk is
              read-only).
            </li>
            <li>
              To share data across devices, add Redis at{" "}
              <a
                href="https://console.upstash.com"
                target="_blank"
                rel="noreferrer"
              >
                console.upstash.com
              </a>
            </li>
            <li>
              Vercel → Settings → Environment Variables:{" "}
              <code>UPSTASH_REDIS_REST_URL</code> +{" "}
              <code>UPSTASH_REDIS_REST_TOKEN</code> (Production) → Redeploy
            </li>
          </ol>
          <p>
            Take Excel Backup regularly — clearing browser cache can remove
            local data.
          </p>
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
        <div className="tbs-empty">Loading dashboard…</div>
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
                <h2>Pending</h2>
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
                <h3 className="tbs-pc-sub">Pending LRs</h3>
                {data.pendingList.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>No pending LRs.</p>
                    <Link href="/admin/transport/booking">Create booking →</Link>
                  </div>
                ) : (
                  <LrTable rows={data.pendingList} />
                )}
              </div>
            </section>

            <section className="tbs-pc-panel tbs-pc-done">
              <header className="tbs-pc-head">
                <h2>Completed</h2>
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
                <h3 className="tbs-pc-sub">Completed LRs</h3>
                {data.completedList.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>No completed LRs yet.</p>
                    <Link href="/admin/reports/booking">Open booking report →</Link>
                  </div>
                ) : (
                  <LrTable rows={data.completedList} completed />
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
                {data.outstandingTop.length === 0 ? (
                  <div className="tbs-empty-box">
                    <p>No outstanding bills.</p>
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
                        {data.outstandingTop.map((r) => (
                          <tr key={`${r.billNo}-${r.party}`}>
                            <td>{r.party}</td>
                            <td>{r.billNo}</td>
                            <td>{inr(r.amount)}</td>
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
              <td>{b.party}</td>
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
