"use client";

import { useEffect, useState } from "react";
import {
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useAdminAuth } from "@/components/tbs/useTbs";
import { downloadAsExcel } from "@/lib/tbs/excel";

type ProfitRow = {
  sr: number;
  id: string;
  vehNo: string;
  date: string;
  freight: number;
  bookingAmt: number;
  difference: number;
  marginPct: number;
};

function firstOfPrevMonthISO() {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}-01`;
}

function fmtIntLike(n: number) {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 100) / 100;
  return Math.abs(r - Math.round(r)) < 0.001 ? String(Math.round(r)) : r.toFixed(2);
}

export default function ProfitReportPage() {
  const ready = useAdminAuth();
  const [from, setFrom] = useState(firstOfPrevMonthISO);
  const [to, setTo] = useState(todayISO);
  const [rows, setRows] = useState<ProfitRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ kind: "profit", from, to });
    const res = await fetch(`/api/tbs/reports?${q}`);
    setLoading(false);
    if (!res.ok) {
      setError("Failed to load profit report");
      return;
    }
    const json = await res.json();
    const next = (json.rows || []) as ProfitRow[];
    setRows(next);
    setSelectedId(next[0]?.id || null);
  }

  useEffect(() => {
    if (ready) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_ProfitReport">
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
              alert("Click Show first, then Generate as Excel.");
              return;
            }
            downloadAsExcel(
              `Profit_Report_${from}_to_${to}.xlsx`,
              ["Sr No", "Veh No", "Date", "Freight", "Booking Amt", "Difference", "Margin %"],
              rows.map((r) => [
                r.sr,
                r.vehNo,
                fmtDate(r.date),
                r.freight,
                r.bookingAmt,
                Number(r.difference.toFixed(2)),
                `${r.marginPct.toFixed(2)}%`,
              ]),
            );
          }}
        >
          Generate as Excel
        </button>
      </div>

      <div className="tbs-grid-wrap" style={{ maxHeight: 520 }}>
        <table className="tbs-grid">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Veh No</th>
              <th>Date</th>
              <th>Freight</th>
              <th>Booking Amt</th>
              <th>Difference</th>
              <th>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 28, color: "#666" }}>
                  {loading ? "Loading…" : "No records — click Show"}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className={selectedId === r.id ? "selected" : ""}
                  onClick={() => setSelectedId(r.id)}
                >
                  <td>{r.sr}</td>
                  <td>{r.vehNo}</td>
                  <td>{fmtDate(r.date)}</td>
                  <td>{fmtIntLike(r.freight)}</td>
                  <td>{fmtIntLike(r.bookingAmt)}</td>
                  <td>{r.difference.toFixed(2)}</td>
                  <td>{r.marginPct.toFixed(2)}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </FormWindow>
  );
}
