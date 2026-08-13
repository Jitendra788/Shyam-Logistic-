"use client";

import { useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  PrintCellButton,
  fmtDate,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import type { MoneyReceipt } from "@/lib/tbs/types";

type Payload = { receipts: MoneyReceipt[] };

export default function MoneyReceiptEditPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/money-receipts");
  const [selected, setSelected] = useState<MoneyReceipt | null>(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function update() {
    if (!selected) return;
    setSaving(true);
    const res = await fetch("/api/tbs/money-receipts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
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
    if (!selected || !confirm("Delete receipt?")) return;
    await fetch(`/api/tbs/money-receipts?id=${selected.id}`, { method: "DELETE" });
    setSelected(null);
    setMsg("Deleted");
    await reload();
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_MR (Edit)">
      {msg && <div className="tbs-msg">{msg}</div>}
      {error && <div className="tbs-msg err">{error}</div>}

      {selected && (
        <div className="tbs-row">
          <div className="tbs-field">
            <label>Paid Amt</label>
            <input
              className="tbs-input w-sm"
              type="number"
              value={selected.paidAmt}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  paidAmt: Number(e.target.value),
                  balance:
                    selected.outstanding - Number(e.target.value) - selected.deduction,
                })
              }
            />
          </div>
          <div className="tbs-field">
            <label>Deduction</label>
            <input
              className="tbs-input w-sm"
              type="number"
              value={selected.deduction}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  deduction: Number(e.target.value),
                  balance: selected.outstanding - selected.paidAmt - Number(e.target.value),
                })
              }
            />
          </div>
          <div className="tbs-field" style={{ flex: 1 }}>
            <label>Narration</label>
            <input
              className="tbs-input w-full"
              value={selected.narration}
              onChange={(e) => setSelected({ ...selected, narration: e.target.value })}
            />
          </div>
        </div>
      )}

      <ActionButtons
        onUpdate={update}
        onDelete={remove}
        onPrint={() => {
          if (!selected) return needSelectAlert("money receipt");
          openPrint("mr", selected.id);
        }}
        onPrintList={() => openPrint("mrs")}
        canUpdate={!!selected}
        canDelete={!!selected}
        canPrint={!!selected}
        saving={saving}
      />

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "billNo", label: "Bill No" },
          { key: "date", label: "Date" },
          { key: "partyName", label: "Party Name" },
          { key: "outstanding", label: "Outstanding" },
          { key: "mrNo", label: "MR No" },
          { key: "paidAmt", label: "Paid Amt" },
          { key: "deduction", label: "Deduction" },
          { key: "balance", label: "Balance" },
          { key: "narration", label: "Narration" },
          { key: "print", label: "Print" },
        ]}
        rows={data?.receipts || []}
        selectedId={selected?.id}
        onSelect={setSelected}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "date") return fmtDate(row.date);
          if (key === "print")
            return <PrintCellButton onClick={() => openPrint("mr", row.id)} />;
          return (row as unknown as Record<string, string | number>)[key];
        }}
      />
    </FormWindow>
  );
}
