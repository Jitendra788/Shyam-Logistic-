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
import type { Booking, Masters, Party } from "@/lib/tbs/types";

type Payload = {
  bookings: Booking[];
  parties: Party[];
  masters: Masters;
  nextLr: string;
};

function blank(nextLr: string): Booking {
  return {
    id: "",
    bookingFrom: "Sangli",
    lrNo: nextLr,
    lrDate: todayISO(),
    from: "Sangli",
    to: "",
    vehicleNo: "",
    deliveryAt: "",
    billingParty: "",
    consignor: "",
    consignee: "",
    address: "",
    gstNo: "",
    noOfArticles: "",
    particulars: "",
    invNoDate: "",
    actualWt: 0,
    chargedWt: 0,
    rate: 0,
    freight: 0,
    hamali: 0,
    stCharges: 100,
    lrCharges: 0,
    doorDelivery: 0,
    doorColle: 0,
    barrier: 0,
    otherChrg: 0,
    total: 100,
    grandTotal: 100,
    gstPaidBy: "Consignor",
    ewayBillNo: "",
    validDate: todayISO(),
    lrType: "TBB",
    valueRs: 0,
    delivered: false,
  };
}

function calcTotal(b: Booking) {
  return (
    Number(b.freight) +
    Number(b.hamali) +
    Number(b.stCharges) +
    Number(b.lrCharges) +
    Number(b.doorDelivery) +
    Number(b.doorColle) +
    Number(b.barrier) +
    Number(b.otherChrg)
  );
}

function normalizeBooking(b: Booking): Booking {
  return {
    ...b,
    from: b.from || b.bookingFrom,
  };
}

export default function BookingPage() {
  const { data, loading, error, reload } = useTbsApi<Payload>("/api/tbs/bookings");
  const [form, setForm] = useState<Booking | null>(null);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const current = form || blank(data?.nextLr || "1");
  const parties = data?.parties || [];
  const partyNames = parties.map((p) => p.partyName);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.bookings || [];
    if (!q) return list;
    return list.filter((b) => b.lrNo.includes(q) || b.billingParty.toLowerCase().includes(q));
  }, [data, search]);

  function patch(partial: Partial<Booking>) {
    const next = { ...current, ...partial };
    const total = calcTotal(next);
    setForm({ ...next, total, grandTotal: total });
  }

  function partyByName(name: string): Party | undefined {
    return data?.parties.find((x) => x.partyName === name);
  }

  /** Address / GST always from Consignee (preferred) or Consignor — never Billing Party. */
  function addressFromConsigneeOrConsignor(
    consignee: string,
    consignor: string,
  ): { address: string; gstNo: string } {
    const ce = partyByName(consignee);
    const cr = partyByName(consignor);
    const src = ce || cr;
    return {
      address: src?.address || "",
      gstNo: src?.gstTin || "",
    };
  }

  function pickBillingParty(name: string) {
    // Billing party only — do not overwrite Address with billing party data
    patch({
      billingParty: name,
      consignor: current.consignor || name,
    });
  }

  function pickConsignor(name: string) {
    const matched = partyByName(name);
    const filled = addressFromConsigneeOrConsignor(current.consignee, name);
    patch({
      consignor: name,
      address: matched ? filled.address || current.address : current.address,
      gstNo: matched ? filled.gstNo || current.gstNo : current.gstNo,
    });
  }

  function pickConsignee(name: string) {
    const matched = partyByName(name);
    const filled = addressFromConsigneeOrConsignor(name, current.consignor);
    patch({
      consignee: name,
      address: matched ? filled.address : current.address,
      gstNo: matched ? filled.gstNo || current.gstNo : current.gstNo,
    });
  }

  function fillAddressFromConsigneeOrConsignor() {
    const filled = addressFromConsigneeOrConsignor(
      current.consignee,
      current.consignor,
    );
    if (!current.consignee && !current.consignor) {
      setMsg("Select consignee or consignor first");
      return;
    }
    patch({
      address: filled.address,
      gstNo: filled.gstNo || current.gstNo,
    });
    setMsg(
      filled.address
        ? "Address filled from consignee/consignor"
        : "No saved address for this name — type Address and GST below",
    );
  }

  async function addParticular() {
    const p = current.particulars.trim();
    if (!p) {
      setMsg("Type Particulars first");
      return;
    }
    patch({ particulars: p });
    const res = await fetch("/api/tbs/masters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ particulars: p }),
    });
    if (!res.ok) {
      setMsg(await readApiError(res, "Could not add particulars"));
      return;
    }
    setMsg("Added successfully");
    await reload();
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/tbs/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeBooking(current)),
    });
    setSaving(false);
    if (!res.ok) {
      setMsg(
        await readApiError(
          res,
          "Save failed — set Upstash Redis on Vercel",
        ),
      );
      return;
    }
    setMsg("Added successfully");
    setForm(null);
    await reload();
  }

  async function update() {
    if (!current.id) return;
    setSaving(true);
    const res = await fetch("/api/tbs/bookings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeBooking(current)),
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
    if (!confirm("Delete booking?")) return;
    setSaving(true);
    try {
      await apiDelete(`/api/tbs/bookings?id=${current.id}`);
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
    <FormWindow title="Frm_Booking">
      <StatusBanner message={msg} onClear={() => setMsg("")} />
      <StatusBanner message={error} />

      <div className="tbs-split">
        <div>
          <div className="tbs-row">
            <div className="tbs-field">
              <label>Booking From</label>
              <select
                className="tbs-select w-md"
                value={current.bookingFrom}
                onChange={(e) => patch({ bookingFrom: e.target.value })}
              >
                {(data?.masters.stations || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="tbs-field">
              <label>LR No</label>
              <input
                className="tbs-input w-sm"
                value={current.lrNo}
                onChange={(e) => patch({ lrNo: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>LR Date</label>
              <input
                className="tbs-input w-md"
                type="date"
                value={current.lrDate}
                onChange={(e) => patch({ lrDate: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>From</label>
              <select
                className="tbs-select w-md"
                value={current.from}
                onChange={(e) => patch({ from: e.target.value })}
              >
                <option value="">Select</option>
                {(data?.masters.stations || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="tbs-field">
              <label>To</label>
              <select
                className="tbs-select w-md"
                value={current.to}
                onChange={(e) => patch({ to: e.target.value })}
              >
                <option value="">Select</option>
                {(data?.masters.stations || []).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>Vehicle No</label>
              <input
                className="tbs-input w-md"
                value={current.vehicleNo}
                onChange={(e) => patch({ vehicleNo: e.target.value.toUpperCase() })}
                placeholder="Type vehicle no…"
                list="booking-vehicle-suggestions"
              />
              <datalist id="booking-vehicle-suggestions">
                {(data?.masters.vehicles || []).map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div className="tbs-field">
              <label>Delivery at</label>
              <input
                className="tbs-input w-md"
                value={current.deliveryAt}
                onChange={(e) => patch({ deliveryAt: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>BILLING PARTY</label>
              <input
                className="tbs-input w-full"
                value={current.billingParty}
                onChange={(e) => pickBillingParty(e.target.value)}
                placeholder="Type or select…"
                list="booking-billing-party"
                autoComplete="off"
              />
              <datalist id="booking-billing-party">
                {partyNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <button type="button" className="tbs-btn" onClick={() => (window.location.href = "/admin/registration/parties")}>
              Add
            </button>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Consignor</label>
              <input
                className="tbs-input w-full"
                value={current.consignor}
                onChange={(e) => pickConsignor(e.target.value)}
                placeholder="Type or select…"
                list="booking-consignor"
              />
              <datalist id="booking-consignor">
                {partyNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Consignee</label>
              <input
                className="tbs-input w-full"
                value={current.consignee}
                onChange={(e) => pickConsignee(e.target.value)}
                placeholder="Type or select…"
                list="booking-consignee"
              />
              <datalist id="booking-consignee">
                {partyNames.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <button
              type="button"
              className="tbs-btn"
              onClick={fillAddressFromConsigneeOrConsignor}
            >
              Check
            </button>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Address</label>
              <input
                className="tbs-input w-full"
                value={current.address}
                onChange={(e) => patch({ address: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>GST No.</label>
              <input
                className="tbs-input w-full"
                value={current.gstNo}
                onChange={(e) => patch({ gstNo: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>No Of Articles</label>
              <input
                className="tbs-input w-sm"
                value={current.noOfArticles}
                onChange={(e) => patch({ noOfArticles: e.target.value })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Particulars</label>
              <input
                className="tbs-input w-full"
                value={current.particulars}
                onChange={(e) => patch({ particulars: e.target.value })}
                placeholder="Type or select…"
                list="booking-particulars"
                autoComplete="off"
              />
              <datalist id="booking-particulars">
                {(data?.masters.particulars || []).map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <button type="button" className="tbs-btn" onClick={() => void addParticular()}>
              Add
            </button>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label>Inv No. & Date</label>
              <input
                className="tbs-input w-full"
                value={current.invNoDate}
                onChange={(e) => patch({ invNoDate: e.target.value })}
              />
            </div>
            <div className="tbs-field">
              <label>Actual Wt.</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-actualWt`}
                value={current.actualWt}
                onChange={(n) => patch({ actualWt: n })}
              />
            </div>
            <div className="tbs-field">
              <label>Charged Wt.</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-chargedWt`}
                value={current.chargedWt}
                onChange={(n) => patch({ chargedWt: n })}
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field">
              <label>Rate</label>
              <ManualAmountInput
                className="tbs-input w-sm"
                syncKey={`${current.id}-rate`}
                value={current.rate}
                onChange={(n) => patch({ rate: n })}
              />
            </div>
          </div>
        </div>

        <div className="tbs-charges">
          {(
            [
              ["freight", "Freight"],
              ["hamali", "Hamali (Labour)"],
              ["stCharges", "St.Charges"],
              ["lrCharges", "L.R. Charges"],
              ["doorDelivery", "Door Delivery"],
              ["doorColle", "Door Colle."],
              ["barrier", "Barrier"],
              ["otherChrg", "Other Chrg."],
            ] as const
          ).map(([key, label]) => (
            <div key={key} style={{ display: "contents" }}>
              <label>{label}</label>
              <ManualAmountInput
                className="tbs-input"
                syncKey={`${current.id}-${key}`}
                value={current[key]}
                onChange={(n) => patch({ [key]: n })}
              />
            </div>
          ))}
          <label className="total-label">TOTAL</label>
          <input className="tbs-input" value={current.total.toFixed(2)} readOnly />
          <label className="total-label">Grand Total</label>
          <input className="tbs-input" value={current.grandTotal.toFixed(2)} readOnly />
          <label>GST Paid By</label>
          <select
            className="tbs-select"
            value={current.gstPaidBy}
            onChange={(e) => patch({ gstPaidBy: e.target.value })}
          >
            {(data?.masters.gstPaidBy || []).map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <label>Eway Bill No</label>
          <input
            className="tbs-input"
            value={current.ewayBillNo}
            onChange={(e) => patch({ ewayBillNo: e.target.value })}
          />
          <label>Valid Date</label>
          <input
            className="tbs-input"
            type="date"
            value={current.validDate}
            onChange={(e) => patch({ validDate: e.target.value })}
          />
          <label>Lr Type</label>
          <select
            className="tbs-select"
            value={current.lrType}
            onChange={(e) => patch({ lrType: e.target.value })}
          >
            {(data?.masters.lrTypes || []).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <label>Value Rs.</label>
          <ManualAmountInput
            className="tbs-input"
            syncKey={`${current.id}-valueRs`}
            value={current.valueRs}
            onChange={(n) => patch({ valueRs: n })}
          />
          <label>Delivered</label>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={Boolean(current.delivered)}
              onChange={(e) => patch({ delivered: e.target.checked })}
            />
            Mark Delivered
          </label>
        </div>
      </div>

      <div className="tbs-actions" style={{ borderTop: "1px solid #ccc", paddingTop: 10 }}>
        <ActionButtons
          onSave={save}
          onUpdate={update}
          onDelete={remove}
          onPrint={() => {
            if (!current.id) return needSelectAlert("booking / LR");
            openPrint("booking", current.id);
          }}
          onPrintList={() => openPrint("bookings")}
          canUpdate={!!current.id}
          canDelete={!!current.id}
          canPrint={!!current.id}
          saving={saving}
          printLabel="Print Bill"
          extra={
            <div className="tbs-search">
              <span>🔍</span>
              <span>Enter LR No For Search</span>
              <input
                className="tbs-input w-md"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          }
        />
      </div>

      <DataGrid
        columns={[
          { key: "sr", label: "Sr No" },
          { key: "lrNo", label: "LR No" },
          { key: "lrDate", label: "LR Date" },
          { key: "billingParty", label: "Billing Party", width: "160px" },
          { key: "from", label: "From" },
          { key: "to", label: "To" },
          { key: "particulars", label: "Particulars" },
          { key: "weight", label: "Weight" },
          { key: "freight", label: "Freight" },
          { key: "print", label: "Print" },
        ]}
        rows={filtered}
        selectedId={current.id || null}
        onSelect={(row) => setForm(row)}
        renderCell={(row, key, i) => {
          if (key === "sr") return i + 1;
          if (key === "lrDate") return fmtDate(row.lrDate);
          if (key === "weight") return row.chargedWt || row.actualWt;
          if (key === "freight") return row.freight;
          if (key === "print")
            return <PrintCellButton onClick={() => openPrint("booking", row.id)} />;
          return (row as unknown as Record<string, string>)[key];
        }}
      />
    </FormWindow>
  );
}
