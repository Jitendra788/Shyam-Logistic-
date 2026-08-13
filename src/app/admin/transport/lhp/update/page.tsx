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
import type { Challan, LhpPayment, Masters } from "@/lib/tbs/types";

type Payload = { payments: LhpPayment[]; challans: Challan[]; masters: Masters };

type Row = LhpPayment & { _kind: "payment" | "challan" };

export default function LhpUpdatePage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/lhp");
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [vehicle, setVehicle] = useState("");
  const [broker, setBroker] = useState("All");
  const [filterOn, setFilterOn] = useState(false);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");

  const rows = useMemo(() => {
    let list: Row[] = [];
    if (!filterOn) {
      list = (data?.challans || []).map((c) => ({
        id: c.id,
        transactionDate: c.challanDate,
        challanNo: c.challanNo,
        date: c.challanDate,
        broker: c.brokerOwner,
        vehNo: c.vehicleNo,
        outstanding: c.balance,
        paidAmt: 0,
        deduction: 0,
        balance: c.balance,
        narration: "",
        _kind: "challan" as const,
      }));
    } else {
      list = (data?.payments || []).map((p) => ({
        ...p,
        _kind: "payment" as const,
      }));
    }
    return list.filter((r) => {
      if (vehicle && !r.vehNo.toUpperCase().includes(vehicle.toUpperCase()))
        return false;
      if (broker && broker !== "All" && r.broker !== broker) return false;
      if (r.date && (r.date < fromDate || r.date > toDate)) return false;
      return true;
    });
  }, [data, fromDate, toDate, vehicle, broker, filterOn]);

  async function removeRow(row: Row) {
    if (!confirm(`Delete ${row._kind === "payment" ? "payment" : "challan"} ${row.challanNo}?`))
      return;
    setBusyId(row.id);
    try {
      const url =
        row._kind === "payment"
          ? `/api/tbs/lhp?id=${row.id}`
          : `/api/tbs/challans?id=${row.id}`;
      await apiDelete(url);
      setMsg("Deleted successfully");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId("");
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
          <input
            className="tbs-input w-md"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value.toUpperCase())}
            placeholder="Type or leave blank = All"
            list="lhp-update-vehicles"
          />
          <datalist id="lhp-update-vehicles">
            {(data?.masters.vehicles || []).map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
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
            {(data?.masters.brokers || []).map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => setFilterOn(true)}
        >
          Show
        </button>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => {
            setFilterOn(true);
            setVehicle("");
            setBroker("All");
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
          { key: "del", label: "Delete" },
          { key: "sr", label: "Sr No" },
          { key: "challanNo", label: "Challan No" },
          { key: "date", label: "Date" },
          { key: "broker", label: "Broker", width: "160px" },
          { key: "vehNo", label: "Veh No" },
          { key: "paidAmt", label: "Paid Amt" },
          { key: "deduction", label: "Deduction" },
          { key: "narration", label: "Narration" },
        ]}
        rows={rows}
        renderCell={(row, key, i) => {
          if (key === "del")
            return (
              <button
                type="button"
                className="tbs-btn"
                style={{ height: 26, padding: "0 8px" }}
                disabled={busyId === row.id}
                onClick={(e) => {
                  e.stopPropagation();
                  void removeRow(row);
                }}
                title="Delete"
              >
                🗑
              </button>
            );
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          return (row as unknown as Record<string, string | number>)[key];
        }}
      />
    </FormWindow>
  );
}
