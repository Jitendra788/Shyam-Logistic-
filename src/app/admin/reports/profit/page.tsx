"use client";

import { useMemo, useState } from "react";
import {
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { downloadAsExcel } from "@/lib/tbs/excel";
import { buildProfitReport } from "@/lib/tbs/profitReport";
import type { Booking, Challan, NoteVoucher } from "@/lib/tbs/types";

type ChallanPayload = { challans: Challan[]; bookings: Booking[] };
type NotesPayload = { notes: NoteVoucher[] };

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
  const ch = useTbsApi<ChallanPayload>("/api/tbs/challans");
  const exp = useTbsApi<NotesPayload>("/api/tbs/notes?type=expense");
  const [from, setFrom] = useState(firstOfPrevMonthISO);
  const [to, setTo] = useState(todayISO);
  const [applied, setApplied] = useState({ from: firstOfPrevMonthISO(), to: todayISO() });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { rows, totals } = useMemo(
    () =>
      buildProfitReport(
        ch.data?.challans || [],
        ch.data?.bookings || [],
        exp.data?.notes || [],
        applied.from,
        applied.to,
      ),
    [ch.data, exp.data, applied],
  );

  const loading = ch.loading || exp.loading;
  const error = ch.error || exp.error;

  async function show() {
    setApplied({ from, to });
    await Promise.all([ch.reload(), exp.reload()]);
  }

  if (!ch.data && !exp.data && loading) return <div className="tbs-empty">Loading…</div>;

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
        <button type="button" className="tbs-btn" onClick={() => void show()} disabled={loading}>
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
              `Profit_Report_${applied.from}_to_${applied.to}.xlsx`,
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

      <div className="tbs-grid-wrap" style={{ maxHeight: 420 }}>
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
                  {loading
                    ? "Loading…"
                    : "No part challan in this date range. Save LHC first, then Show."}
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

      <div className="tbs-row" style={{ marginTop: 12, flexWrap: "wrap", gap: 16 }}>
        <div className="tbs-field">
          <label>Total Freight</label>
          <input className="tbs-input w-sm" readOnly value={fmtIntLike(totals.freight)} />
        </div>
        <div className="tbs-field">
          <label>+ Total Expense</label>
          <input className="tbs-input w-sm" readOnly value={fmtIntLike(totals.expense)} />
        </div>
        <div className="tbs-field">
          <label>Total Booking</label>
          <input className="tbs-input w-sm" readOnly value={fmtIntLike(totals.bookingAmt)} />
        </div>
        <div className="tbs-field">
          <label>Difference</label>
          <input className="tbs-input w-sm" readOnly value={totals.difference.toFixed(2)} />
        </div>
        <div className="tbs-field">
          <label>Profit %</label>
          <input className="tbs-input w-sm" readOnly value={`${totals.profitPct.toFixed(2)}%`} />
        </div>
      </div>
    </FormWindow>
  );
}
