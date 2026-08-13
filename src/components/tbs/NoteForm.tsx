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
import type { NoteVoucher, Party } from "@/lib/tbs/types";

type Payload = { notes: NoteVoucher[]; parties: Party[] };

function blank() {
  return {
    id: "",
    date: todayISO(),
    partyName: "",
    amount: 0,
    narration: "",
    voucherNo: "",
  };
}

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
  const [form, setForm] = useState(blank);
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());
  const [filterOn, setFilterOn] = useState(false);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const isExpense = type === "expense";
  const noteNoLabel =
    type === "credit"
      ? "Credit Note No"
      : type === "debit"
        ? "Debit Note No"
        : "Voucher No";
  const amountLabel =
    type === "credit"
      ? "Credit Amount"
      : type === "debit"
        ? "Debit Amount"
        : "Transfer Amt.";
  const nameLabel = isExpense ? "Expense Name" : "Party Name";

  const nameSuggestions = useMemo(() => {
    const names = new Set<string>();
    for (const p of data?.parties || []) names.add(p.partyName);
    for (const n of data?.notes || []) {
      if (n.partyName) names.add(n.partyName);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const nextNo = useMemo(() => {
    const nums = (data?.notes || [])
      .map((n) => Number(n.voucherNo))
      .filter((n) => Number.isFinite(n));
    return String((nums.length ? Math.max(...nums) : 0) + 1);
  }, [data]);

  const rows = useMemo(() => {
    let list = data?.notes || [];
    if (filterOn && !isExpense) {
      list = list.filter((n) => {
        if (!n.date) return true;
        if (fromDate && n.date < fromDate) return false;
        if (toDate && n.date > toDate) return false;
        return true;
      });
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (n) =>
          n.voucherNo.toLowerCase().includes(q) ||
          n.partyName.toLowerCase().includes(q) ||
          n.narration.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, filterOn, fromDate, toDate, isExpense, search]);

  function patch(partial: Partial<typeof form>) {
    setForm((prev) => ({ ...prev, ...partial }));
  }

  async function save() {
    if (form.id) {
      await update();
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        voucherNo: form.voucherNo || nextNo,
        type,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Save failed"));
      return;
    }
    setMsg("Added successfully");
    setForm(blank());
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
      setMsg(await readApiError(res, "Update failed"));
      return;
    }
    setMsg("Updated successfully");
    await reload();
  }

  async function remove() {
    if (!form.id) {
      setMsg("Select a record first, then Delete");
      return;
    }
    if (!confirm("Delete?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/notes?id=${form.id}`);
      setForm(blank());
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
    <FormWindow title={title}>
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      {isExpense ? (
        <>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>{nameLabel}</label>
              <input
                className="tbs-input w-full"
                value={form.partyName}
                onChange={(e) => patch({ partyName: e.target.value })}
                placeholder="Type or select…"
                list={`note-name-${type}`}
                autoComplete="off"
              />
              <datalist id={`note-name-${type}`}>
                {nameSuggestions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="tbs-field">
              <label>Expense Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={form.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Narration</label>
              <input
                className="tbs-input w-full"
                value={form.narration}
                onChange={(e) => patch({ narration: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>{amountLabel}</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={form.id || form.voucherNo || "new"}
                value={form.amount}
                onChange={(n) => patch({ amount: n })}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="tbs-row">
            <div className="tbs-field">
              <label>{noteNoLabel}</label>
              <input
                className="tbs-input w-sm"
                value={form.voucherNo || (!form.id ? nextNo : "")}
                onChange={(e) => patch({ voucherNo: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={form.date}
                onChange={(e) => patch({ date: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>{amountLabel}</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={form.id || form.voucherNo || "new"}
                value={form.amount}
                onChange={(n) => patch({ amount: n })}
              />
            </div>
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>{nameLabel}</label>
              <input
                className="tbs-input w-full"
                value={form.partyName}
                onChange={(e) => patch({ partyName: e.target.value })}
                placeholder="Type or select…"
                list={`note-name-${type}`}
                autoComplete="off"
              />
              <datalist id={`note-name-${type}`}>
                {nameSuggestions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Narration</label>
              <input
                className="tbs-input w-full"
                value={form.narration}
                onChange={(e) => patch({ narration: e.target.value })}
              />
            </div>
          </div>
        </>
      )}

      <div className="tbs-actions">
        <ActionButtons
          onSave={save}
          onNew={() => {
            setForm(blank());
            setMsg("");
          }}
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
          extra={
            isExpense ? (
              <div className="tbs-search">
                <span>🔍</span>
                <span>Search for Updation</span>
                <input
                  className="tbs-input w-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                />
              </div>
            ) : (
              <div className="tbs-search" style={{ gap: 8 }}>
                <label>From Date</label>
                <input
                  className="tbs-input w-md"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <label>To Date</label>
                <input
                  className="tbs-input w-md"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                <button
                  type="button"
                  className="tbs-btn"
                  onClick={() => setFilterOn(true)}
                >
                  Show
                </button>
              </div>
            )
          }
        />
      </div>

      <DataGrid
        columns={
          isExpense
            ? [
                { key: "sr", label: "Sr No" },
                { key: "partyName", label: "Expense Name", width: "180px" },
                { key: "date", label: "Date" },
                { key: "narration", label: "Narration", width: "220px" },
                { key: "amount", label: "Amount" },
                { key: "print", label: "Print" },
              ]
            : [
                { key: "sr", label: "Sr No" },
                { key: "voucherNo", label: noteNoLabel },
                { key: "date", label: "Date" },
                { key: "partyName", label: "Party Name", width: "180px" },
                { key: "narration", label: "Narration", width: "200px" },
                { key: "amount", label: "Amount" },
                { key: "print", label: "Print" },
              ]
        }
        rows={rows}
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
