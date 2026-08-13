"use client";

import { useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  PrintCellButton,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import type { NoteVoucher, Party } from "@/lib/tbs/types";

type Payload = { notes: NoteVoucher[]; parties: Party[] };

export function NoteForm({
  type,
  title,
}: {
  type: "debit" | "credit" | "expense";
  title: string;
}) {
  const { data, loading, error, reload } = useTbsApi<Payload>(
    `/api/tbs/notes?type=${type}`,
  );
  const [form, setForm] = useState({
    id: "",
    date: todayISO(),
    partyName: "",
    amount: 0,
    narration: "",
    voucherNo: "",
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Save failed");
      return;
    }
    setMsg("Saved");
    setForm({ id: "", date: todayISO(), partyName: "", amount: 0, narration: "", voucherNo: "" });
    await reload();
  }

  async function update() {
    if (!form.id) return;
    setSaving(true);
    const res = await fetch("/api/tbs/notes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, type }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg("Update failed");
      return;
    }
    setMsg("Updated");
    await reload();
  }

  async function remove() {
    if (!form.id || !confirm("Delete?")) return;
    await fetch(`/api/tbs/notes?id=${form.id}`, { method: "DELETE" });
    setForm({ id: "", date: todayISO(), partyName: "", amount: 0, narration: "", voucherNo: "" });
    setMsg("Deleted");
    await reload();
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title={title}>
      {msg && <div className="tbs-msg">{msg}</div>}
      {error && <div className="tbs-msg err">{error}</div>}

      <div className="tbs-row">
        <div className="tbs-field">
          <label>Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="tbs-field" style={{ flex: 1 }}>
          <label>Party Name</label>
          <select
            className="tbs-select w-full"
            value={form.partyName}
            onChange={(e) => setForm({ ...form, partyName: e.target.value })}
          >
            <option value="">Select</option>
            {(data?.parties || []).map((p) => (
              <option key={p.id}>{p.partyName}</option>
            ))}
          </select>
        </div>
        <div className="tbs-field">
          <label>Amount</label>
          <ManualAmountInput
            className="tbs-input w-sm"
            syncKey={form.id || form.voucherNo}
            value={form.amount}
            onChange={(n) => setForm({ ...form, amount: n })}
          />
        </div>
      </div>
      <div className="tbs-row">
        <div className="tbs-field" style={{ flex: 1 }}>
          <label>Narration</label>
          <input
            className="tbs-input w-full"
            value={form.narration}
            onChange={(e) => setForm({ ...form, narration: e.target.value })}
          />
        </div>
      </div>

      <ActionButtons
        onSave={save}
        onUpdate={update}
        onDelete={remove}
        onPrint={() => {
          if (!form.id) return needSelectAlert("voucher");
          openPrint("note", form.id);
        }}
        onPrintList={() => openPrint("note", undefined, { noteType: type })}
        canUpdate={!!form.id}
        canDelete={!!form.id}
        canPrint={!!form.id}
        saving={saving}
      />

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "voucherNo", label: "Voucher No" },
          { key: "date", label: "Date" },
          { key: "partyName", label: "Party Name" },
          { key: "amount", label: "Amount" },
          { key: "narration", label: "Narration" },
          { key: "print", label: "Print" },
        ]}
        rows={data?.notes || []}
        selectedId={form.id || null}
        onSelect={(row) =>
          setForm({
            id: row.id,
            date: row.date,
            partyName: row.partyName,
            amount: row.amount,
            narration: row.narration,
            voucherNo: row.voucherNo,
          })
        }
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          if (key === "print")
            return <PrintCellButton onClick={() => openPrint("note", row.id)} />;
          return (row as unknown as Record<string, string | number>)[key];
        }}
      />
    </FormWindow>
  );
}
