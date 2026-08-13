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

const modules = [
  { href: "/admin/transport/booking", title: "Booking", desc: "New LR entry" },
  { href: "/admin/transport/lhc", title: "LHC", desc: "Part challan" },
  { href: "/admin/transport/bill", title: "Bill", desc: "Party billing" },
  {
    href: "/admin/transport/money-receipt/new",
    title: "Money Receipt",
    desc: "Collections",
  },
  {
    href: "/admin/reports/booking",
    title: "Booking Report",
    desc: "Status & Excel",
  },
  { href: "/admin/reports/profit", title: "Profit Report", desc: "Full P&L" },
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
        throw new Error("Login expire — phir se login karo");
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
        e instanceof Error ? e.message : "Dashboard data load nahi hui",
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

  return (
    <div className="tbs-dash">
      <section className="tbs-dash-hero">
        <span className="tbs-dash-eyebrow">Transport Billing</span>
        <h1>SHYAM LOGISTIC</h1>
        <p>Pending aur completed work — mobile se bhi clear dikhega.</p>
        {data && (
          <div className="tbs-dash-hero-stats">
            <div>
              <strong>{p!.lrTotal}</strong>
              <span>Pending LR</span>
            </div>
            <div>
              <strong>{c!.lrs}</strong>
              <span>Completed LR</span>
            </div>
            <div>
              <strong>{donePct}%</strong>
              <span>Done</span>
            </div>
          </div>
        )}
      </section>

      {err && (
        <div className="tbs-msg err" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span>{err}</span>
          <button type="button" className="tbs-btn" onClick={() => void loadDash()} disabled={loading}>
            {loading ? "Loading…" : "Retry"}
          </button>
        </div>
      )}

      {!data && !err ? (
        <div className="tbs-empty">Dashboard load ho raha hai…</div>
      ) : !data ? null : (
        <>
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
                  <p className="tbs-dash-muted">Koi pending LR nahi.</p>
                ) : (
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
                        {data.pendingList.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div className="tbs-lr-cell">
                                <strong>{b.lrNo}</strong>
                                <small>
                                  {fmtDate(b.lrDate)} · {b.from || "—"}→
                                  {b.to || "—"}
                                </small>
                              </div>
                            </td>
                            <td>{b.party}</td>
                            <td>
                              <span
                                className={`tbs-status-pill ${statusClass(b)}`}
                              >
                                {statusLabel(b)}
                              </span>
                            </td>
                            <td>{inr(b.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
                  <p className="tbs-dash-muted">Abhi koi completed LR nahi.</p>
                ) : (
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
                        {data.completedList.map((b) => (
                          <tr key={b.id}>
                            <td>
                              <div className="tbs-lr-cell">
                                <strong>{b.lrNo}</strong>
                                <small>
                                  {fmtDate(b.lrDate)} · {b.from || "—"}→
                                  {b.to || "—"}
                                </small>
                              </div>
                            </td>
                            <td>{b.party}</td>
                            <td>
                              <span className="tbs-status-pill ok">
                                Completed
                              </span>
                            </td>
                            <td>{inr(b.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

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

          <section>
            <h2 className="tbs-dash-section">Top outstanding</h2>
            <div className="tbs-dash-table-wrap">
              {data.outstandingTop.length === 0 ? (
                <p className="tbs-dash-muted">Koi outstanding bill nahi.</p>
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

          <h2 className="tbs-dash-section">Masters snapshot</h2>
          <div className="tbs-snap-grid">
            <div className="tbs-snap">
              <strong>{data.counts.parties}</strong>
              <span>Parties</span>
            </div>
            <div className="tbs-snap">
              <strong>{data.counts.bookings}</strong>
              <span>Bookings</span>
            </div>
            <div className="tbs-snap">
              <strong>{data.counts.challans}</strong>
              <span>Challans</span>
            </div>
            <div className="tbs-snap">
              <strong>{data.counts.bills}</strong>
              <span>Bills</span>
            </div>
            <div className="tbs-snap">
              <strong>{data.counts.receipts}</strong>
              <span>Money receipts</span>
            </div>
            <div className="tbs-snap">
              <strong>{c!.lrs}</strong>
              <span>Completed LRs</span>
            </div>
          </div>
        </>
      )}

      <h2 className="tbs-dash-section">Quick open</h2>
      <div className="tbs-dash-grid">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} className="tbs-dash-card">
            <strong>{m.title}</strong>
            <span>{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
