"use client";

import { useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  PrintCellButton,
  StatusBanner,
  fmtDate,
  readApiError,
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
      setMsg(await readApiError(res, "Update failed"));
      return;
    }
    setMsg("Updated successfully — Money receipt update ho gaya");
    await reload();
  }

  async function remove() {
    if (!selected || !confirm("Delete receipt?")) return;
    await fetch(`/api/tbs/money-receipts?id=${selected.id}`, { method: "DELETE" });
    setSelected(null);
    setMsg("Deleted successfully");
    await reload();
  }

  if (!data && loading) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_MR (Edit)">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      {selected && (
        <div className="tbs-row">
          <div className="tbs-field">
            <label>Paid Amt</label>
            <ManualAmountInput
              className="tbs-input w-sm"
              syncKey={`${selected.id}-paid`}
              value={selected.paidAmt}
              onChange={(n) =>
                setSelected({
                  ...selected,
                  paidAmt: n,
                  balance: selected.outstanding - n - selected.deduction,
                })
              }
            />
          </div>
          <div className="tbs-field">
            <label>Deduction</label>
            <ManualAmountInput
              className="tbs-input w-sm"
              syncKey={`${selected.id}-ded`}
              value={selected.deduction}
              onChange={(n) =>
                setSelected({
                  ...selected,
                  deduction: n,
                  balance: selected.outstanding - selected.paidAmt - n,
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
