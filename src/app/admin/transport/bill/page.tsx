"use client";

import { useMemo, useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  PrintCellButton,
  StatusBanner,
  fmtDate,
  readApiError,
  apiDelete,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import type { Bill, Booking, Party } from "@/lib/tbs/types";

type Payload = {
  bills: Bill[];
  bookings: Booking[];
  parties: Party[];
  nextBill: string;
};

export default function BillPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/bills");
  const [billDate, setBillDate] = useState(todayISO());
  const [billNo, setBillNo] = useState("");
  const [party, setParty] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [remark, setRemark] = useState("");
  const [submissionDate, setSubmissionDate] = useState(todayISO());
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const partyLrs = useMemo(() => {
    if (!party) return data?.bookings || [];
    return (data?.bookings || []).filter((b) => b.billingParty === party);
  }, [data, party]);

  const total = useMemo(
    () =>
      partyLrs
        .filter((b) => selected.includes(b.id))
        .reduce((sum, b) => sum + Number(b.grandTotal || b.freight), 0),
    [partyLrs, selected],
  );

  const billsFiltered = useMemo(() => {
    const q = search.trim();
    const list = data?.bills || [];
    if (!q) return list;
    return list.filter((b) => b.billNo.includes(q));
  }, [data, search]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function loadBill(b: Bill) {
    setEditId(b.id);
    setBillNo(b.billNo);
    setBillDate(b.billDate);
    setParty(b.partyName);
    setSelected(b.lrIds || []);
    setRemark(b.remark);
    setSubmissionDate(b.submissionDate);
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billNo: billNo || data?.nextBill,
        billDate,
        partyName: party,
        totalAmount: total,
        remark,
        submissionDate,
        lrIds: selected,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Save failed"));
      return;
    }
    setMsg("Added successfully — Bill save ho gaya");
    setEditId(null);
    setSelected([]);
    setRemark("");
    setBillNo("");
    await reload();
  }

  async function update() {
    if (!editId) return;
    setSaving(true);
    const res = await fetch("/api/tbs/bills", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        billNo,
        billDate,
        partyName: party,
        totalAmount: total,
        remark,
        submissionDate,
        lrIds: selected,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Update failed"));
      return;
    }
    setMsg("Updated successfully — Bill update ho gaya");
    await reload();
  }

  async function remove() {
    if (!editId) {
      setMsg("Pehle list se bill select karo, phir Delete dabao");
      return;
    }
    if (!confirm("Delete bill?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/bills?id=${editId}`);
      setEditId(null);
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
    <FormWindow title="Frm_Bill">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-row">
        <div className="tbs-field">
          <label>Bill Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
          />
        </div>
        <div className="tbs-field">
          <label>Bill No.</label>
          <input
            className="tbs-input w-sm"
            value={billNo || data?.nextBill || ""}
            onChange={(e) => setBillNo(e.target.value)}
          />
        </div>
        <div className="tbs-field" style={{ flex: 1 }}>
          <label>Select Party</label>
          <select
            className="tbs-select w-full"
            value={party}
            onChange={(e) => {
              setParty(e.target.value);
              setSelected([]);
            }}
          >
            <option value="">Select</option>
            {(data?.parties || []).map((p) => (
              <option key={p.id}>{p.partyName}</option>
            ))}
          </select>
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
          { key: "freight", label: "Freight" },
        ]}
        rows={partyLrs}
        renderCell={(row, key, i) => {
          if (key === "select")
            return (
              <input
                type="checkbox"
                checked={selected.includes(row.id)}
                onChange={() => toggle(row.id)}
              />
            );
          if (key === "sr") return i + 1;
          if (key === "loadFor") return row.bookingFrom;
          if (key === "lrDate") return fmtDate(row.lrDate);
          if (key === "weight") return row.chargedWt || row.actualWt;
          if (key === "freight") return row.freight;
          return (row as unknown as Record<string, string>)[key];
        }}
      />

      <div className="tbs-actions">
        <ActionButtons
          onSave={save}
          onUpdate={update}
          onDelete={remove}
          onPrint={() => {
            if (!editId) return needSelectAlert("bill");
            openPrint("bill", editId);
          }}
          onPrintList={() => openPrint("bills")}
          canUpdate={!!editId}
          canDelete={!!editId}
          canPrint={!!editId}
          saving={saving}
          printLabel="Print Bill"
          extra={
            <div className="tbs-search">
              <span>🔍</span>
              <span>Enter Bill No For Search</span>
              <input
                className="tbs-input w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />
      </div>

      <div className="tbs-split">
        <DataGrid
          columns={[
            { key: "billNo", label: "Bill No" },
            { key: "date", label: "Date" },
            { key: "partyName", label: "Party Name", width: "180px" },
            { key: "billAmount", label: "Bill Amount" },
            { key: "print", label: "Print" },
          ]}
          rows={billsFiltered}
          selectedId={editId}
          onSelect={loadBill}
          renderCell={(row, key) => {
            if (key === "date") return fmtDate(row.billDate);
            if (key === "billAmount") return row.totalAmount;
            if (key === "print")
              return <PrintCellButton onClick={() => openPrint("bill", row.id)} />;
            return (row as unknown as Record<string, string | number>)[key];
          }}
        />
        <div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Total Amount</label>
              <input className="tbs-input w-full" value={total.toFixed(2)} readOnly />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field stack" style={{ flex: 1 }}>
              <label>Remark</label>
              <textarea
                className="tbs-textarea w-full"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field">
              <label>Submission Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </FormWindow>
  );
}
