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
import { billGrandTotal } from "@/lib/tbs/billAmount";
import { displayBillNo } from "@/lib/tbs/billPrint";
import { needsPartyBill } from "@/lib/tbs/lrType";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import { shareBillPdfOnWhatsApp } from "@/lib/tbs/billPdf";
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
  const [lrCharges, setLrCharges] = useState(0);
  const [detention, setDetention] = useState(0);
  const [hamali, setHamali] = useState(0);
  const [doorDelivery, setDoorDelivery] = useState(0);
  const [doorCollection, setDoorCollection] = useState(0);
  const [other, setOther] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const billedLrIds = useMemo(() => {
    const ids = new Set<string>();
    for (const bill of data?.bills || []) {
      if (editId && bill.id === editId) continue;
      for (const id of bill.lrIds || []) ids.add(id);
    }
    return ids;
  }, [data, editId]);

  const partyLrs = useMemo(() => {
    const all = (data?.bookings || []).filter(
      (b) => !billedLrIds.has(b.id) && needsPartyBill(b.lrType),
    );
    const q = party.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (b) =>
        b.billingParty.toLowerCase() === q ||
        b.billingParty.toLowerCase().includes(q),
    );
  }, [data, party, billedLrIds]);

  const partyNames = useMemo(() => {
    const names = new Set<string>();
    for (const p of data?.parties || []) names.add(p.partyName);
    for (const b of data?.bookings || []) {
      if (b.billingParty) names.add(b.billingParty);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const total = useMemo(
    () =>
      partyLrs
        .filter((b) => selected.includes(b.id))
        .reduce((sum, b) => sum + Number(b.grandTotal || b.freight), 0),
    [partyLrs, selected],
  );

  const extras = {
    lrCharges,
    detention,
    hamali,
    doorDelivery,
    doorCollection,
    other,
  };
  const grand = billGrandTotal(total, extras);

  const billsFiltered = useMemo(() => {
    const q = search.trim();
    const list = data?.bills || [];
    if (!q) return list;
    return list.filter((b) => {
      const shown = displayBillNo(b.billNo, b.billDate);
      return b.billNo.includes(q) || shown.toLowerCase().includes(q.toLowerCase());
    });
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
    setLrCharges(Number(b.lrCharges) || 0);
    setDetention(Number(b.detention) || 0);
    setHamali(Number(b.hamali) || 0);
    setDoorDelivery(Number(b.doorDelivery) || 0);
    setDoorCollection(Number(b.doorCollection) || 0);
    setOther(Number(b.other) || 0);
  }

  function partyForSave() {
    const typed = party.trim();
    if (typed) return typed;
    const first = (data?.bookings || []).find((b) => selected.includes(b.id));
    return first?.billingParty || "";
  }

  async function save() {
    if (editId) {
      await update();
      return;
    }
    if (!partyForSave()) {
      setMsg("Please Enter Billing Party");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billNo: billNo || data?.nextBill,
        billDate,
        partyName: partyForSave(),
        totalAmount: grand,
        ...extras,
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
    const created = (await res.json()) as Bill;
    setMsg("Bill Created..");
    setEditId(created.id || null);
    setSelected([]);
    await reload();
    if (created.id && confirm("Do You want to print ??")) {
      openPrint("bill", created.id);
    }
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
        partyName: partyForSave(),
        totalAmount: grand,
        ...extras,
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
    setMsg("Updated successfully");
    await reload();
  }

  async function remove() {
    if (!editId) {
      setMsg("Select a record first, then Delete");
      return;
    }
    if (!confirm("Are You Sure To Delete This Record ???")) return;
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

  async function shareBill(bill?: Bill) {
    const row =
      bill ||
      (data?.bills || []).find((b) => b.id === editId);
    if (!row) {
      needSelectAlert("bill");
      return;
    }
    try {
      await shareBillPdfOnWhatsApp({
        bill: row,
        bookings: data?.bookings || [],
        parties: data?.parties || [],
      });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "WhatsApp PDF share failed");
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
          <input
            className="tbs-input w-full"
            value={party}
            onChange={(e) => {
              setParty(e.target.value);
              setSelected([]);
            }}
            placeholder="Type or select…"
            list="bill-party-suggestions"
            autoComplete="off"
          />
          <datalist id="bill-party-suggestions">
            {partyNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      </div>

      <DataGrid
        columns={[
          { key: "select", label: "Select" },
          { key: "loadFor", label: "Load For" },
          { key: "lrNo", label: "LR No" },
          { key: "lrDate", label: "LR Date" },
          { key: "billingParty", label: "Billing Party", width: "140px" },
          { key: "from", label: "From" },
          { key: "to", label: "To" },
          { key: "particulars", label: "Particulars" },
          { key: "weight", label: "Weight" },
          { key: "freight", label: "Freight" },
          { key: "lrType", label: "Lr Type" },
          { key: "haulting", label: "Haulting" },
          { key: "hamali", label: "Hamali" },
          { key: "other", label: "Other" },
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
          if (key === "lrDate") return fmtDate(row.lrDate);
          if (key === "loadFor") return row.bookingFrom || row.from;
          if (key === "weight") return row.chargedWt || row.actualWt;
          if (key === "freight") return row.freight;
          if (key === "haulting") return row.barrier || "";
          if (key === "hamali") return row.hamali || "";
          if (key === "other") {
            const n =
              Number(row.otherChrg) +
              Number(row.doorDelivery) +
              Number(row.doorColle) +
              Number(row.stCharges) +
              Number(row.lrCharges);
            return n || "";
          }
          return (row as unknown as Record<string, string>)[key];
        }}
      />

      <div className="tbs-actions">
        <ActionButtons
          onSave={save}
          onNew={() => {
            setEditId(null);
            setSelected([]);
            setRemark("");
            setBillNo("");
            setParty("");
            setLrCharges(0);
            setDetention(0);
            setHamali(0);
            setDoorDelivery(0);
            setDoorCollection(0);
            setOther(0);
            setMsg("");
          }}
          onUpdate={update}
          onDelete={remove}
          onPrint={() => {
            if (!editId) return needSelectAlert("bill");
            openPrint("bill", editId);
          }}
          onPrintList={() => openPrint("bills")}
          onWhatsApp={() => void shareBill()}
          canUpdate={!!editId}
          canDelete={!!editId}
          canPrint={!!editId}
          canWhatsApp={!!editId}
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
            { key: "wa", label: "WhatsApp" },
          ]}
          rows={billsFiltered}
          selectedId={editId}
          onSelect={loadBill}
          renderCell={(row, key) => {
            if (key === "billNo") return displayBillNo(row.billNo, row.billDate);
            if (key === "date") return fmtDate(row.billDate);
            if (key === "billAmount") return row.totalAmount;
            if (key === "print")
              return <PrintCellButton onClick={() => openPrint("bill", row.id)} />;
            if (key === "wa")
              return (
                <button
                  type="button"
                  className="tbs-btn tbs-btn-wa"
                  style={{ height: 24, minWidth: 64, padding: "0 8px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    void shareBill(row);
                  }}
                >
                  WhatsApp
                </button>
              );
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
          {(
            [
              ["lrCharges", "LR Charges", lrCharges, setLrCharges],
              ["detention", "Detention", detention, setDetention],
              ["hamali", "Hamali", hamali, setHamali],
              ["doorDelivery", "Door Delivery", doorDelivery, setDoorDelivery],
              ["doorCollection", "Door Collection", doorCollection, setDoorCollection],
              ["other", "Other", other, setOther],
            ] as const
          ).map(([key, label, value, setValue]) => (
            <div className="tbs-row" key={key}>
              <div className="tbs-field" style={{ flex: 1 }}>
                <label>{label}</label>
                <ManualAmountInput
                  className="tbs-input w-full"
                  syncKey={`${editId || "new"}-${key}`}
                  value={value}
                  onChange={setValue}
                />
              </div>
            </div>
          ))}
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Grand Total</label>
              <input className="tbs-input w-full" value={grand.toFixed(2)} readOnly />
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
