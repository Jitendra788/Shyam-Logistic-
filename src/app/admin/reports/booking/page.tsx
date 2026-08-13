"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useAdminAuth } from "@/components/tbs/useTbs";
import { downloadAsExcel } from "@/lib/tbs/excel";

type StatusKey =
  | ""
  | "not_delivered_not_billed"
  | "billed_not_delivered"
  | "delivered_not_billed"
  | "delivered_billed";

type Row = {
  sr: number;
  id: string;
  lrNo: string;
  lrDate: string;
  party: string;
  from: string;
  to: string;
  particulars: string;
  weight: number;
  freight: number;
  billNo: string;
  challanNo: string;
  status: Exclude<StatusKey, "">;
};

const STATUS_STYLE: Record<
  Exclude<StatusKey, "">,
  { bg: string; color: string; label: string }
> = {
  not_delivered_not_billed: {
    bg: "#2e7d32",
    color: "#fff",
    label: "Not Delivered and Not Billed",
  },
  billed_not_delivered: {
    bg: "#1565c0",
    color: "#fff",
    label: "Billed But Not Delivered",
  },
  delivered_not_billed: {
    bg: "#f9a825",
    color: "#000",
    label: "Delivered but not billed",
  },
  delivered_billed: {
    bg: "#ef9a9a",
    color: "#000",
    label: "Delivered Billed",
  },
};

function downloadExcel(rows: Row[], from: string, to: string) {
  downloadAsExcel(
    `Booking_Report_${from}_to_${to}.xlsx`,
    [
      "Sr No",
      "LR No",
      "LR Date",
      "Billing Party",
      "From",
      "To",
      "Particulars",
      "Weight",
      "Freight",
      "Bill No",
      "Challan No",
      "Status",
    ],
    rows.map((r) => [
      r.sr,
      r.lrNo,
      fmtDate(r.lrDate),
      r.party,
      r.from,
      r.to,
      r.particulars,
      r.weight,
      r.freight,
      r.billNo,
      r.challanNo,
      STATUS_STYLE[r.status].label,
    ]),
  );
}

const STATUS_KEYS: StatusKey[] = [
  "",
  "not_delivered_not_billed",
  "billed_not_delivered",
  "delivered_not_billed",
  "delivered_billed",
];

export default function BookingReportPage() {
  const ready = useAdminAuth();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status") || "";

  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 2);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayISO());
  const [party, setParty] = useState("");
  const [partyMode, setPartyMode] = useState("Billing Party wise");
  const [status, setStatus] = useState<StatusKey>(() =>
    STATUS_KEYS.includes(statusFromUrl as StatusKey)
      ? (statusFromUrl as StatusKey)
      : "",
  );
  const [parties, setParties] = useState<string[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(nextStatus: StatusKey = status) {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ kind: "booking", from, to });
    if (party) q.set("party", party);
    if (nextStatus) q.set("status", nextStatus);
    const res = await fetch(`/api/tbs/reports?${q}`);
    setLoading(false);
    if (!res.ok) {
      setError("Failed to load booking report");
      return;
    }
    const json = await res.json();
    setRows(json.rows || []);
    setParties(json.parties || []);
    setCounts(json.counts || {});
  }

  useEffect(() => {
    if (STATUS_KEYS.includes(statusFromUrl as StatusKey)) {
      setStatus(statusFromUrl as StatusKey);
    }
  }, [statusFromUrl]);

  useEffect(() => {
    if (ready) void load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, status]);

  if (!ready) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_Booking_Report">
      {error && <div className="tbs-msg err">{error}</div>}

      <div className="tbs-row rpt-filters" style={{ marginBottom: 10 }}>
        <div className="tbs-field">
          <label>From Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="tbs-field">
          <label>To Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button type="button" className="tbs-btn" onClick={() => load()} disabled={loading}>
          Show
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-excel"
          onClick={() => {
            if (!rows.length) {
              alert("Pehle Show dabao, phir Generate as Excel.");
              return;
            }
            downloadExcel(rows, from, to);
          }}
        >
          Generate as Excel
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={() => window.print()}
          disabled={!rows.length}
        >
          🖨 Print
        </button>
        <div className="tbs-field tbs-filter-end">
          <select
            className="tbs-select w-lg"
            value={partyMode}
            onChange={(e) => setPartyMode(e.target.value)}
          >
            <option>Billing Party wise</option>
            <option>All Parties</option>
          </select>
        </div>
        {partyMode === "Billing Party wise" && (
          <div className="tbs-field">
            <select
              className="tbs-select w-xl"
              value={party}
              onChange={(e) => setParty(e.target.value)}
            >
              <option value="">All Billing Parties</option>
              {parties.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="tbs-grid-wrap" style={{ maxHeight: 480 }}>
        <table className="tbs-grid">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>LR No</th>
              <th>LR Date</th>
              <th>Billing Party</th>
              <th>From</th>
              <th>To</th>
              <th>Particulars</th>
              <th>Weight</th>
              <th>Freight</th>
              <th>Bill No</th>
              <th>Challan No</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: "center", padding: 28, color: "#666" }}>
                  {loading ? "Loading…" : "No records — click Show"}
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const st = STATUS_STYLE[r.status];
                return (
                  <tr
                    key={r.id}
                    style={{ background: st.bg, color: st.color }}
                    title={st.label}
                  >
                    <td>{r.sr}</td>
                    <td>{r.lrNo}</td>
                    <td>{fmtDate(r.lrDate)}</td>
                    <td>{r.party}</td>
                    <td>{r.from}</td>
                    <td>{r.to}</td>
                    <td>{r.particulars}</td>
                    <td>{r.weight}</td>
                    <td>{r.freight}</td>
                    <td>{r.billNo}</td>
                    <td>{r.challanNo}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="booking-status-legend">
        {(Object.keys(STATUS_STYLE) as Exclude<StatusKey, "">[]).map((key) => {
          const st = STATUS_STYLE[key];
          const active = status === key;
          return (
            <button
              key={key}
              type="button"
              className="booking-status-chip"
              style={{
                background: st.bg,
                color: st.color,
                outline: active ? "3px solid #000" : "1px solid #666",
              }}
              onClick={() => {
                const next = status === key ? "" : key;
                setStatus(next);
                void load(next);
              }}
              title="Click to filter"
            >
              {st.label}
              {typeof counts[key] === "number" ? ` (${counts[key]})` : ""}
            </button>
          );
        })}
        {status && (
          <button
            type="button"
            className="tbs-btn"
            onClick={() => {
              setStatus("");
              void load("");
            }}
          >
            Clear Filter
          </button>
        )}
      </div>
    </FormWindow>
  );
}
