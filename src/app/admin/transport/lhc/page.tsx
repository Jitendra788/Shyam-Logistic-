"use client";

import { useMemo, useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  PrintCellButton,
  StatusBanner,
  fmtDate,
  readApiError,
  apiDelete,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import type { Booking, Challan, Masters } from "@/lib/tbs/types";

type Payload = {
  challans: Challan[];
  bookings: Booking[];
  masters: Masters;
  nextChallan: string;
};

function blank(next: string): Challan {
  return {
    id: "",
    challanNo: next,
    challanDate: todayISO(),
    vehicleNo: "",
    brokerOwner: "",
    brokerPan: "",
    fromStation: "",
    toStation: "",
    freight: 0,
    advance: 0,
    transfer: 0,
    cash: 0,
    fuel: 0,
    balance: 0,
    driverName: "",
    licenceNo: "",
    engine: "",
    chessy: "",
    insuNo: "",
    owner: "",
    panNo: "",
    lrIds: [],
  };
}

export default function LhcPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/challans");
  const [form, setForm] = useState<Challan | null>(null);
  const [selectedLrs, setSelectedLrs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const current = form || blank(data?.nextChallan || "1152");

  const lrRows = data?.bookings || [];

  const sideList = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.challans || [];
    if (!q) return list;
    return list.filter((c) => c.challanNo.includes(q));
  }, [data, search]);

  function patch(partial: Partial<Challan>) {
    const next = { ...current, ...partial };
    const balance =
      Number(next.freight) -
      Number(next.advance) -
      Number(next.transfer) -
      Number(next.cash) -
      Number(next.fuel);
    setForm({ ...next, balance });
  }

  function toggleLr(id: string) {
    setSelectedLrs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function pickLr(row: Booking) {
    const fromStation = row.from || row.bookingFrom || current.fromStation;
    const toStation = row.to || current.toStation;
    patch({
      vehicleNo: row.vehicleNo || current.vehicleNo,
      fromStation,
      toStation,
    });
    setSelectedLrs((prev) => (prev.includes(row.id) ? prev : [...prev, row.id]));
  }

  function loadChallan(c: Challan) {
    setForm(c);
    setSelectedLrs(c.lrIds || []);
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/challans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, lrIds: selectedLrs }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Save failed"));
      return;
    }
    setMsg("Added successfully — Challan save ho gaya");
    setForm(null);
    setSelectedLrs([]);
    await reload();
  }

  async function update() {
    if (!current.id) return;
    setSaving(true);
    const res = await fetch("/api/tbs/challans", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, lrIds: selectedLrs }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Update failed"));
      return;
    }
    setMsg("Updated successfully — Challan update ho gaya");
    await reload();
  }

  async function remove() {
    if (!current.id) {
      setMsg("Pehle list se challan select karo, phir Delete dabao");
      return;
    }
    if (!confirm("Delete challan?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/challans?id=${current.id}`);
      setForm(null);
      setSelectedLrs([]);
      setMsg("Deleted successfully");
      await reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_PartChallan">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-form-with-side">
        <div className="main">
          <div className="tbs-row">
            <div className="tbs-field">
              <label>Vehicle No.</label>
              <input
                className="tbs-input w-md"
                value={current.vehicleNo}
                onChange={(e) => patch({ vehicleNo: e.target.value.toUpperCase() })}
                placeholder="Type vehicle no…"
                list="lhc-vehicle-suggestions"
              />
              <datalist id="lhc-vehicle-suggestions">
                {(data?.masters.vehicles || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Broker/Owner Name</label>
              <select
                className="tbs-select w-full"
                value={current.brokerOwner}
                onChange={(e) =>
                  patch({ brokerOwner: e.target.value, owner: e.target.value })
                }
              >
                <option value="">Select</option>
                {(data?.masters.brokers || []).filter((b) => b !== "All").map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <button type="button" className="tbs-btn">
              Add
            </button>
            <button type="button" className="tbs-btn" onClick={() => reload()}>
              Refresh
            </button>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Broker Pan No</label>
              <input
                className="tbs-input w-full"
                value={current.brokerPan}
                onChange={(e) => patch({ brokerPan: e.target.value, panNo: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>From Station</label>
              <select
                className="tbs-select w-md"
                value={current.fromStation}
                onChange={(e) => patch({ fromStation: e.target.value })}
              >
                <option value="">Select</option>
                {(data?.masters.stations || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="tbs-field">
              <label>To Station</label>
              <select
                className="tbs-select w-md"
                value={current.toStation}
                onChange={(e) => patch({ toStation: e.target.value })}
              >
                <option value="">Select</option>
                {(data?.masters.stations || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="tbs-field">
              <label>Challan No.</label>
              <input
                className="tbs-input w-sm"
                value={current.challanNo}
                onChange={(e) => patch({ challanNo: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>Challan Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={current.challanDate}
                onChange={(e) => patch({ challanDate: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Freight</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-freight`}
                value={current.freight}
                onChange={(n) => patch({ freight: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Advance</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-advance`}
                value={current.advance}
                onChange={(n) => patch({ advance: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Transfer</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-transfer`}
                value={current.transfer}
                onChange={(n) => patch({ transfer: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Cash</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-cash`}
                value={current.cash}
                onChange={(n) => patch({ cash: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Fuel</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-fuel`}
                value={current.fuel}
                onChange={(n) => patch({ fuel: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Balance</label>
              <input className="tbs-input w-sm" value={current.balance.toFixed(2)} readOnly />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>Driver Name</label>
              <input
                className="tbs-input w-md"
                value={current.driverName}
                onChange={(e) => patch({ driverName: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Licence No</label>
              <input
                className="tbs-input w-md"
                value={current.licenceNo}
                onChange={(e) => patch({ licenceNo: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Engine</label>
              <input
                className="tbs-input w-md"
                value={current.engine}
                onChange={(e) => patch({ engine: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Chessy</label>
              <input
                className="tbs-input w-md"
                value={current.chessy}
                onChange={(e) => patch({ chessy: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>Insu.No.</label>
              <input
                className="tbs-input w-md"
                value={current.insuNo}
                onChange={(e) => patch({ insuNo: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Owner</label>
              <input
                className="tbs-input w-md"
                value={current.owner}
                onChange={(e) => patch({ owner: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>PAN No.</label>
              <input
                className="tbs-input w-md"
                value={current.panNo}
                onChange={(e) => patch({ panNo: e.target.value })}
              />
            </div>
          </div>

          <DataGrid
            columns={[
              { key: "select", label: "Select" },
              { key: "sr", label: "Sr No" },
              { key: "loadFor", label: "Load For" },
              { key: "lrNo", label: "LR No" },
              { key: "lrDate", label: "LR Date" },
              { key: "billingParty", label: "Billing Party", width: "140px" },
              { key: "from", label: "From" },
              { key: "to", label: "To" },
              { key: "particulars", label: "Particulars" },
              { key: "weight", label: "Weight" },
            ]}
            rows={lrRows}
            selectedId={selectedLrs[selectedLrs.length - 1] || null}
            onSelect={pickLr}
            renderCell={(row, key, i) => {
              if (key === "select")
                return (
                  <input
                    type="checkbox"
                    checked={selectedLrs.includes(row.id)}
                    onChange={() => toggleLr(row.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                );
              if (key === "sr") return i + 1;
              if (key === "loadFor") return row.bookingFrom;
              if (key === "lrDate") return fmtDate(row.lrDate);
              if (key === "weight") return row.chargedWt || row.actualWt;
              return (row as unknown as Record<string, string>)[key];
            }}
          />

          <ActionButtons
            onSave={save}
            onUpdate={update}
            onDelete={remove}
            onPrint={() => {
              if (!current.id) return needSelectAlert("challan");
              openPrint("challan", current.id);
            }}
            onPrintList={() => openPrint("challans")}
            canUpdate={!!current.id}
            canDelete={!!current.id}
            canPrint={!!current.id}
            saving={saving}
          />
        </div>

        <aside className="tbs-side-list">
          <div className="head">
            <span>🔍</span>
            <input
              className="tbs-input w-full"
              placeholder="Enter Challan N…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ overflow: "auto", flex: 1 }}>
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Challan</th>
                  <th>Print</th>
                </tr>
              </thead>
              <tbody>
                {sideList.map((c, i) => (
                  <tr
                    key={c.id}
                    className={current.id === c.id ? "selected" : ""}
                    onClick={() => loadChallan(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{i + 1}</td>
                    <td>{c.challanNo}</td>
                    <td>
                      <PrintCellButton onClick={() => openPrint("challan", c.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </FormWindow>
  );
}
