"use client";

import { useMemo, useState } from "react";
import {
  DataGrid,
  FormWindow,
  ManualAmountInput,
  StatusBanner,
  fmtDate,
  readApiError,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { openPrint } from "@/lib/tbs/print";
import type { Challan, LhpPayment, Masters } from "@/lib/tbs/types";

type Payload = { payments: LhpPayment[]; challans: Challan[]; masters: Masters };

type Row = {
  id: string;
  challanNo: string;
  date: string;
  broker: string;
  vehNo: string;
  outstanding: number;
  paidAmt: number;
  deduction: number;
  balance: number;
  narration: string;
};

export default function LhpNewPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/lhp");
  const [txDate, setTxDate] = useState(todayISO());
  const [rows, setRows] = useState<Row[] | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const paidMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of data?.payments || []) {
      map.set(p.challanNo, (map.get(p.challanNo) || 0) + p.paidAmt + p.deduction);
    }
    return map;
  }, [data]);

  const grid: Row[] = useMemo(() => {
    if (rows) return rows;
    return (data?.challans || []).map((c) => {
      const paid = paidMap.get(c.challanNo) || 0;
      const out = Math.max(
        0,
        Number(c.freight) -
          Number(c.advance) -
          Number(c.transfer) -
          Number(c.cash) -
          Number(c.fuel) -
          paid,
      );
      return {
        id: c.id,
        challanNo: c.challanNo,
        date: c.challanDate,
        broker: c.brokerOwner,
        vehNo: c.vehicleNo,
        outstanding: out,
        paidAmt: 0,
        deduction: 0,
        balance: out,
        narration: "",
      };
    });
  }, [data, paidMap, rows]);

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
        challanNo: r.challanNo,
        date: r.date,
        broker: r.broker,
        vehNo: r.vehNo,
        outstanding: r.outstanding,
        paidAmt: r.paidAmt,
        deduction: r.deduction,
        narration: r.narration,
      }));
    if (!items.length) {
      setMsg("Enter Paid Amt or Deduction on at least one row");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/lhp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Save failed"));
      return;
    }
    setMsg("Added successfully — LHP payment save ho gaya");
    setRows(null);
    await reload();
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_BhadaChitti">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-row" style={{ justifyContent: "space-between" }}>
        <div className="tbs-field">
          <label>Transaction Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={txDate}
            onChange={(e) => setTxDate(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" className="tbs-btn" onClick={save} disabled={saving}>
            <span className="dot green">+</span> Save
          </button>
          <button
            type="button"
            className="tbs-btn tbs-btn-print"
            onClick={() => openPrint("lhp-list")}
          >
            <span className="dot print">🖨</span> Print List
          </button>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "challanNo", label: "Challan No" },
          { key: "date", label: "Date" },
          { key: "broker", label: "Broker", width: "160px" },
          { key: "vehNo", label: "Veh No" },
          { key: "outstanding", label: "Outstanding" },
          { key: "paidAmt", label: "Paid Amt" },
          { key: "deduction", label: "Deduction" },
          { key: "balance", label: "Balance" },
          { key: "narration", label: "Narration", width: "140px" },
        ]}
        rows={grid}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          if (key === "outstanding" || key === "balance") return row[key];
          if (key === "paidAmt" || key === "deduction")
            return (
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${row.id}-${key}`}
                value={row[key]}
                onChange={(n) => updateRow(row.id, { [key]: n })}
              />
            );
          if (key === "narration")
            return (
              <input
                className="tbs-input"
                style={{ width: 120 }}
                value={row.narration}
                onChange={(e) => updateRow(row.id, { narration: e.target.value })}
              />
            );
          return (row as unknown as Record<string, string>)[key];
        }}
      />
    </FormWindow>
  );
}
