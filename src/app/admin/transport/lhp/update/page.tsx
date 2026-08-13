"use client";

import { useMemo, useState } from "react";
import {
  DataGrid,
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { openPrint } from "@/lib/tbs/print";
import type { Challan, LhpPayment, Masters } from "@/lib/tbs/types";

type Payload = { payments: LhpPayment[]; challans: Challan[]; masters: Masters };

export default function LhpUpdatePage() {
  const { data, loading, error } = useTbsApi<Payload>("/api/tbs/lhp");
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [vehicle, setVehicle] = useState("");
  const [broker, setBroker] = useState("All");
  const [filterOn, setFilterOn] = useState(false);

  const rows = useMemo(() => {
    let list = data?.payments || [];
    if (!filterOn) {
      // show outstanding challans as in screenshot details view when filtering
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
      }));
    }
    return list.filter((r) => {
      if (vehicle && r.vehNo !== vehicle) return false;
      if (broker && broker !== "All" && r.broker !== broker) return false;
      if (r.date && (r.date < fromDate || r.date > toDate)) return false;
      return true;
    });
  }, [data, fromDate, toDate, vehicle, broker, filterOn]);

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_BhadachittiDetails">
      {error && <div className="tbs-msg err">{error}</div>}

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
            className="tbs-select w-md"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
          >
            <option value="">All</option>
            {(data?.masters.vehicles || []).map((v) => (
              <option key={v}>{v}</option>
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
            {(data?.masters.brokers || []).map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>
        <button type="button" className="tbs-btn" onClick={() => setFilterOn(true)}>
          Show
        </button>
        <button
          type="button"
          className="tbs-btn"
          onClick={() => {
            setFilterOn(false);
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
          if (key === "del") return "🗑";
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          return (row as unknown as Record<string, string | number>)[key];
        }}
      />
    </FormWindow>
  );
}
