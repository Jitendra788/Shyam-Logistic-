"use client";

import { useMemo, useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  StatusBanner,
  apiDelete,
  fmtDate,
  readApiError,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { openPrint } from "@/lib/tbs/print";
import type { DriverRegister, LorryMoneyLine } from "@/lib/tbs/types";

type Payload = {
  drivers: DriverRegister[];
  brokers: string[];
  driverNames: string[];
  vehicles: string[];
};

function emptyLine(): LorryMoneyLine {
  return { advance: 0, balance: 0, expense: 0 };
}

function linesOf(row: DriverRegister): LorryMoneyLine[] {
  if (row.moneyLines?.length) return row.moneyLines;
  return [
    {
      advance: Number(row.advance) || 0,
      balance: Number(row.balance) || 0,
      expense: Number(row.expense) || 0,
    },
  ];
}

function withLines(row: DriverRegister, moneyLines: LorryMoneyLine[]): DriverRegister {
  const lines = moneyLines.length ? moneyLines : [emptyLine()];
  const advance = lines.reduce((s, l) => s + (Number(l.advance) || 0), 0);
  const balance = lines.reduce((s, l) => s + (Number(l.balance) || 0), 0);
  const expense = lines.reduce((s, l) => s + (Number(l.expense) || 0), 0);
  return {
    ...row,
    moneyLines: lines,
    advance,
    balance,
    expense,
    totalBalance: advance + balance + expense,
  };
}

const empty = (): DriverRegister =>
  withLines(
    {
      id: "",
      date: todayISO(),
      driverName: "",
      brokerName: "",
      lrNo: "",
      lorryNo: "",
      mobileNo: "",
      advance: 0,
      balance: 0,
      expense: 0,
      challanNo: "",
    },
    [emptyLine()],
  );

function inDateRange(iso: string, from: string, to: string) {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function totalOf(row: DriverRegister) {
  const lines = linesOf(row);
  const advance = lines.reduce((s, l) => s + (Number(l.advance) || 0), 0);
  const balance = lines.reduce((s, l) => s + (Number(l.balance) || 0), 0);
  const expense = lines.reduce((s, l) => s + (Number(l.expense) || 0), 0);
  return row.totalBalance ?? advance + balance + expense;
}

export default function DriverRegisterPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/drivers");
  const [form, setForm] = useState<DriverRegister | null>(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const drivers = data?.drivers || [];
  const current = form || empty();
  const line = linesOf(current)[0] || emptyLine();
  const totalBalance = totalOf(current);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return drivers.filter((d) => {
      if (!inDateRange(d.date || "", fromDate, toDate)) return false;
      if (!q) return true;
      return (
        d.driverName.toLowerCase().includes(q) ||
        d.brokerName.toLowerCase().includes(q) ||
        d.lrNo.toLowerCase().includes(q) ||
        d.lorryNo.toLowerCase().includes(q) ||
        d.mobileNo.toLowerCase().includes(q) ||
        d.challanNo.toLowerCase().includes(q)
      );
    });
  }, [drivers, search, fromDate, toDate]);

  function set<K extends keyof DriverRegister>(key: K, value: DriverRegister[K]) {
    setForm({ ...current, [key]: value });
  }

  function patchAmt(key: keyof LorryMoneyLine, n: number) {
    setForm(withLines(current, [{ ...line, [key]: n }]));
  }

  async function save() {
    if (current.id) {
      await update();
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withLines(current, [line])),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(await readApiError(res, "Save failed"));
      return;
    }
    setMsg("Added successfully");
    setForm(null);
    await reload();
  }

  async function update() {
    if (!current.id) {
      setMsg("Select a record first, then Update");
      return;
    }
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/drivers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(withLines(current, [line])),
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
    if (!current.id) {
      setMsg("Select a record first, then Delete");
      return;
    }
    if (!confirm("Delete this lorry record?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/drivers?id=${current.id}`);
      setForm(null);
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
    <FormWindow title="Frm_LorryRecord">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-split-3">
        <div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={current.date}
                onChange={(e) => set("date", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Driver Name</label>
              <input
                className="tbs-input w-full"
                value={current.driverName}
                onChange={(e) => set("driverName", e.target.value)}
                list="drv-name-suggestions"
                autoComplete="off"
              />
              <datalist id="drv-name-suggestions">
                {(data?.driverNames || []).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Broker Name</label>
              <input
                className="tbs-input w-full"
                value={current.brokerName}
                onChange={(e) => set("brokerName", e.target.value)}
                list="drv-broker-suggestions"
                autoComplete="off"
              />
              <datalist id="drv-broker-suggestions">
                {(data?.brokers || []).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>LR No</label>
              <input
                className="tbs-input w-full"
                value={current.lrNo}
                onChange={(e) => set("lrNo", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Lorry No</label>
              <input
                className="tbs-input w-full"
                value={current.lorryNo}
                onChange={(e) => set("lorryNo", e.target.value)}
                list="drv-lorry-suggestions"
                autoComplete="off"
              />
              <datalist id="drv-lorry-suggestions">
                {(data?.vehicles || []).map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Challan No</label>
              <input
                className="tbs-input w-full"
                value={current.challanNo}
                onChange={(e) => set("challanNo", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 110 }}>Mobile No</label>
              <input
                className="tbs-input w-full"
                value={current.mobileNo}
                onChange={(e) => set("mobileNo", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 110 }}>Advance</label>
              <ManualAmountInput
                className="tbs-input w-full"
                syncKey={`${current.id}-adv`}
                value={line.advance}
                onChange={(n) => patchAmt("advance", n)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 110 }}>Balance</label>
              <ManualAmountInput
                className="tbs-input w-full"
                syncKey={`${current.id}-bal`}
                value={line.balance}
                onChange={(n) => patchAmt("balance", n)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 110 }}>Expense</label>
              <ManualAmountInput
                className="tbs-input w-full"
                syncKey={`${current.id}-exp`}
                value={line.expense}
                onChange={(n) => patchAmt("expense", n)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 110 }}>Total Balance</label>
              <input className="tbs-input w-full" readOnly value={totalBalance} />
            </div>
          </div>
        </div>
      </div>

      <div className="tbs-actions">
        <ActionButtons
          onSave={save}
          onNew={() => {
            setForm(null);
            setMsg("");
          }}
          onUpdate={update}
          onDelete={remove}
          onPrintList={() =>
            openPrint("lorry-records", undefined, { from: fromDate, to: toDate })
          }
          canUpdate={!!current.id}
          canDelete={!!current.id}
          saving={saving}
          extra={
            <div className="tbs-search" style={{ flexWrap: "wrap", gap: 8 }}>
              <span>From</span>
              <input
                className="tbs-input w-md"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span>To</span>
              <input
                className="tbs-input w-md"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <input
                className="tbs-input w-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search driver, LR, lorry, challan…"
              />
              <button
                type="button"
                className="tbs-btn tbs-btn-print"
                onClick={() =>
                  openPrint("lorry-records", undefined, { from: fromDate, to: toDate })
                }
              >
                Print A4
              </button>
              <button
                type="button"
                className="tbs-btn"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSearch("");
                }}
              >
                Clear
              </button>
            </div>
          }
        />
      </div>

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "date", label: "Date" },
          { key: "driverName", label: "Driver Name", width: "140px" },
          { key: "brokerName", label: "Broker Name", width: "140px" },
          { key: "lrNo", label: "LR No" },
          { key: "lorryNo", label: "Lorry No" },
          { key: "challanNo", label: "Challan No" },
          { key: "mobileNo", label: "Mobile No" },
          { key: "advance", label: "Advance" },
          { key: "balance", label: "Balance" },
          { key: "expense", label: "Expense" },
          { key: "totalBalance", label: "Total Balance" },
        ]}
        rows={filtered}
        selectedId={current.id || null}
        onSelect={(row) => setForm(withLines(row, linesOf(row)))}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          if (key === "advance" || key === "balance" || key === "expense") {
            return row[key] || 0;
          }
          if (key === "totalBalance") return totalOf(row);
          return (row as unknown as Record<string, string>)[key];
        }}
      />
    </FormWindow>
  );
}
