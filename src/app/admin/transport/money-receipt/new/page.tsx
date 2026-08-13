"use client";

import { useMemo, useState } from "react";
import {
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { openPrint } from "@/lib/tbs/print";
import type { Bill, MoneyReceipt, Party } from "@/lib/tbs/types";

type Payload = {
  receipts: MoneyReceipt[];
  bills: Bill[];
  parties: Party[];
  nextMr: string;
};

type Row = {
  id: string;
  billNo: string;
  date: string;
  partyName: string;
  outstanding: number;
  mrNo: string;
  paidAmt: number;
  deduction: number;
  balance: number;
  narration: string;
};

export default function MoneyReceiptNewPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/money-receipts");
  const [txDate, setTxDate] = useState(todayISO());
  const [party, setParty] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const paidMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of data?.receipts || []) {
      map.set(r.billNo, (map.get(r.billNo) || 0) + r.paidAmt + r.deduction);
    }
    return map;
  }, [data]);

  const grid: Row[] = useMemo(() => {
    if (rows) return rows;
    let bills = data?.bills || [];
    if (!showAll && party) bills = bills.filter((b) => b.partyName === party);
    return bills.map((b) => {
      const paid = paidMap.get(b.billNo) || 0;
      const out = Math.max(0, Number(b.totalAmount) - paid);
      return {
        id: b.id,
        billNo: b.billNo,
        date: b.billDate,
        partyName: b.partyName,
        outstanding: out,
        mrNo: "",
        paidAmt: 0,
        deduction: 0,
        balance: out,
        narration: "",
      };
    });
  }, [data, paidMap, party, showAll, rows]);

  function updateRow(id: string, partial: Partial<Row>) {
    setRows(
      grid.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...partial };
        next.balance = Number(next.outstanding) - Number(next.paidAmt) - Number(next.deduction);
        return next;
      }),
    );
  }

  async function save() {
    const items = grid
      .filter((r) => r.paidAmt || r.deduction)
      .map((r) => ({
        transactionDate: txDate,
        billNo: r.billNo,
        date: r.date,
        partyName: r.partyName,
        outstanding: r.outstanding,
        paidAmt: r.paidAmt,
        deduction: r.deduction,
        narration: r.narration,
      }));
    if (!items.length) {
      setMsg("Enter Paid Amt or Deduction");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/tbs/money-receipts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Save failed");
      return;
    }
    setMsg("Money receipt saved");
    setRows(null);
    await reload();
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_MR">
      {msg && <div className="tbs-msg">{msg}</div>}
      {error && <div className="tbs-msg err">{error}</div>}

      <div className="tbs-row">
        <div className="tbs-field">
          <label>Transaction Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => {
            setShowAll(true);
            setParty("");
            setRows(null);
          }}
        >
          Show All
        </button>
        <div className="tbs-field" style={{ flex: 1 }}>
          <label>Enter Party Name</label>
          <select
            className="tbs-select w-full"
            value={party}
            onChange={(e) => {
              setParty(e.target.value);
              setShowAll(false);
              setRows(null);
            }}
          >
            <option value="">Select</option>
            {(data?.parties || []).map((p) => (
              <option key={p.id}>{p.partyName}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => {
            setShowAll(false);
            setRows(null);
          }}
        >
          Show
        </button>
        <button type="button" className="tbs-btn" onClick={save} disabled={saving}>
          <span className="dot green">+</span> Save
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={() => openPrint("mrs")}
        >
          <span className="dot print">🖨</span> Print List
        </button>
      </div>

      <div className="tbs-grid-wrap">
        <table className="tbs-grid">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Bill No</th>
              <th>Date</th>
              <th>Party Name</th>
              <th>Outstanding</th>
              <th>MR No</th>
              <th>Paid Amt</th>
              <th>Deduction</th>
              <th>Balance</th>
              <th>Narration</th>
            </tr>
          </thead>
          <tbody>
            {grid.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: 24 }}>
                  No records
                </td>
              </tr>
            ) : (
              grid.map((row, i) => (
                <tr key={row.id}>
                  <td>{i + 1}</td>
                  <td>{row.billNo}</td>
                  <td>{fmtDate(row.date)}</td>
                  <td>{row.partyName}</td>
                  <td>{row.outstanding}</td>
                  <td>{row.mrNo}</td>
                  <td>
                    <input
                      className="tbs-input w-sm"
                      type="number"
                      value={row.paidAmt}
                      onChange={(e) => updateRow(row.id, { paidAmt: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      className="tbs-input w-sm"
                      type="number"
                      value={row.deduction}
                      onChange={(e) => updateRow(row.id, { deduction: Number(e.target.value) })}
                    />
                  </td>
                  <td>{row.balance}</td>
                  <td>
                    <input
                      className="tbs-input"
                      style={{ width: 120 }}
                      value={row.narration}
                      onChange={(e) => updateRow(row.id, { narration: e.target.value })}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </FormWindow>
  );
}
