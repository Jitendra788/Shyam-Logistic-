"use client";

import { useMemo, useState } from "react";
import {
  DataGrid,
  FormWindow,
  StatusBanner,
  apiDelete,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { openPrint } from "@/lib/tbs/print";
import type { LhpPayment, Masters } from "@/lib/tbs/types";

type Payload = { payments: LhpPayment[]; masters: Masters };

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function vehKey(v: string) {
  return String(v || "").replace(/\s+/g, "").toUpperCase();
}

function payDate(p: LhpPayment) {
  return p.transactionDate || p.date || "";
}

export default function LhpUpdatePage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/lhp");
  const [fromDate, setFromDate] = useState(() => daysAgoISO(50));
  const [toDate, setToDate] = useState(todayISO);
  const [vehicle, setVehicle] = useState("All");
  const [broker, setBroker] = useState("All");
  const [applied, setApplied] = useState(() => ({
    fromDate: daysAgoISO(50),
    toDate: todayISO(),
    vehicle: "All",
    broker: "All",
  }));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const payments = data?.payments || [];

  const vehicles = useMemo(() => {
    const set = new Set<string>();
    for (const p of payments) if (p.vehNo) set.add(p.vehNo);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [payments]);

  const brokers = useMemo(() => {
    const set = new Set<string>(["All"]);
    for (const p of payments) if (p.broker) set.add(p.broker);
    return Array.from(set);
  }, [payments]);

  const rows = useMemo(() => {
    return payments
      .filter((p) => {
        const d = payDate(p);
        if (applied.fromDate && d && d < applied.fromDate) return false;
        if (applied.toDate && d && d > applied.toDate) return false;
        if (applied.vehicle !== "All" && vehKey(p.vehNo) !== vehKey(applied.vehicle)) {
          return false;
        }
        if (applied.broker !== "All" && p.broker !== applied.broker) return false;
        return true;
      })
      .map((p) => ({
        id: p.id,
        challanNo: p.challanNo,
        date: payDate(p),
        broker: p.broker,
        vehNo: p.vehNo,
        paidAmt: Number(p.paidAmt) || 0,
        deduction: Number(p.deduction) || 0,
        narration: p.narration || "",
      }))
      .sort((a, b) => a.date.localeCompare(b.date) || Number(a.challanNo) - Number(b.challanNo));
  }, [payments, applied]);

  async function show(next = { fromDate, toDate, vehicle, broker }) {
    setMsg("");
    setApplied(next);
    await reload();
  }

  async function remove(id: string) {
    if (!confirm("Are You Sure to Delete ???")) return;
    setBusy(true);
    try {
      await apiDelete(`/api/tbs/lhp?id=${id}`);
      setMsg("Deleted successfully");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_BhadachittiDetails">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-row">
        <div className="tbs-field">
          <label>From Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="tbs-field">
          <label>To Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="tbs-field">
          <label>Select Vehicle No</label>
          <select
            className="tbs-select w-lg"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            {vehicles.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tbs-row">
        <div className="tbs-field" style={{ flex: 1 }}>
          <label>Select Broker</label>
          <select
            className="tbs-select w-xl"
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
          >
            {brokers.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="tbs-btn" onClick={() => void show()}>
          Show
        </button>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => {
            setVehicle("All");
            setBroker("All");
            void show({ fromDate, toDate, vehicle: "All", broker: "All" });
          }}
        >
          Show All
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={() => openPrint("lhp-list")}
        >
          <span className="dot print">🖨</span> Print List
        </button>
      </div>

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "challanNo", label: "Challan No" },
          { key: "date", label: "Date" },
          { key: "broker", label: "Broker", width: "180px" },
          { key: "vehNo", label: "Veh No" },
          { key: "paidAmt", label: "Paid Amt" },
          { key: "deduction", label: "Deduction" },
          { key: "narration", label: "Narration" },
          { key: "del", label: "" },
        ]}
        rows={rows}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          if (key === "paidAmt") return Number(row.paidAmt) || 0;
          if (key === "deduction") return Number(row.deduction).toFixed(2);
          if (key === "del")
            return (
              <button
                type="button"
                className="tbs-btn"
                style={{ height: 24, minWidth: 58, padding: "0 8px" }}
                disabled={busy}
                onClick={() => void remove(row.id)}
              >
                Delete
              </button>
            );
          return (row as unknown as Record<string, string | number>)[key];
        }}
      />
      {!loading && rows.length === 0 && (
        <div className="tbs-empty" style={{ marginTop: 12 }}>
          No Bhada Chitti payments in this range. Open LHP → New Payment, enter Paid Amt, then Show here.
        </div>
      )}
    </FormWindow>
  );
}
