"use client";

import { useMemo, useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  PrintCellButton,
  StatusBanner,
  readApiError,
  apiDelete,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import type { Masters, Party } from "@/lib/tbs/types";

type Payload = { parties: Party[]; masters: Masters; nextCode: string };

const empty = (code: string): Party => ({
  id: "",
  partyCode: code,
  partyName: "",
  contactNo: "",
  address: "",
  gstTin: "",
  partyType: "Customer",
  panNo: "",
  opBalance: 0,
  accountStartFrom: todayISO(),
});

export default function PartyCreationPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/parties");
  const [form, setForm] = useState<Party | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const parties = data?.parties || [];
  const current = form || empty(data?.nextCode || "1");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter(
      (p) =>
        p.partyName.toLowerCase().includes(q) ||
        p.partyCode.includes(q) ||
        p.contactNo.includes(q),
    );
  }, [parties, search]);

  function set<K extends keyof Party>(key: K, value: Party[K]) {
    setForm({ ...current, [key]: value });
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/parties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
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
    if (!current.id) return;
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/parties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(current),
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
    if (!confirm("Delete this party?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/parties?id=${current.id}`);
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
    <FormWindow title="Frm_PartyCreation">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-split-3">
        <div>
          <div className="tbs-row">
            <div className="tbs-field w-full" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Party Name</label>
              <input
                className="tbs-input w-full"
                value={current.partyName}
                onChange={(e) => set("partyName", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Contact No</label>
              <input
                className="tbs-input w-full"
                value={current.contactNo}
                onChange={(e) => set("contactNo", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>OP.Balance</label>
              <ManualAmountInput
                className="tbs-input w-full"
                syncKey={current.id || current.partyCode}
                value={current.opBalance}
                onChange={(n) => set("opBalance", n)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 120 }}>Account Start From</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={current.accountStartFrom}
                onChange={(e) => set("accountStartFrom", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1, alignItems: "flex-start" }}>
              <label style={{ width: 90 }}>Address</label>
              <textarea
                className="tbs-textarea w-full"
                value={current.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 90 }}>GST TIN</label>
              <input
                className="tbs-input w-full"
                value={current.gstTin}
                onChange={(e) => set("gstTin", e.target.value)}
              />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field">
              <label style={{ width: 90 }}>Party Type</label>
              <select
                className="tbs-select w-md"
                value={current.partyType}
                onChange={(e) => set("partyType", e.target.value)}
              >
                {(data?.masters.partyTypes || []).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field">
              <label style={{ width: 90 }}>Party Code</label>
              <input className="tbs-input w-sm" value={current.partyCode} readOnly />
            </div>
          </div>
          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label style={{ width: 90 }}>PAN No.</label>
              <input
                className="tbs-input w-full"
                value={current.panNo}
                onChange={(e) => set("panNo", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="tbs-actions">
        <ActionButtons
          onSave={save}
          onUpdate={update}
          onDelete={remove}
          onPrint={() => {
            if (!current.id) return needSelectAlert("party");
            openPrint("party", current.id);
          }}
          onPrintList={() => openPrint("parties")}
          canUpdate={!!current.id}
          canDelete={!!current.id}
          canPrint={!!current.id}
          saving={saving}
          extra={
            <div className="tbs-search">
              <span>🔍</span>
              <span>Search for Updation</span>
              <input
                className="tbs-input w-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search party…"
              />
            </div>
          }
        />
      </div>

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "partyName", label: "Party Name", width: "180px" },
          { key: "address", label: "Address", width: "160px" },
          { key: "contactNo", label: "Contact No" },
          { key: "gstTin", label: "GST TIN" },
          { key: "opBalance", label: "OP Bal" },
          { key: "partyType", label: "Party Type" },
          { key: "accountStartFrom", label: "Start Date" },
          { key: "partyCode", label: "Party Code" },
          { key: "panNo", label: "PAN No." },
          { key: "print", label: "Print" },
        ]}
        rows={filtered}
        selectedId={current.id || null}
        onSelect={(row) => setForm(row)}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "opBalance") return row.opBalance;
          if (key === "accountStartFrom") {
            const d = row.accountStartFrom || "";
            if (!d) return "";
            const [y, m, day] = d.split("-");
            return y && m && day ? `${day}-${m}-${y}` : d;
          }
          if (key === "print")
            return <PrintCellButton onClick={() => openPrint("party", row.id)} />;
          return (row as unknown as Record<string, string>)[key];
        }}
      />
    </FormWindow>
  );
}
