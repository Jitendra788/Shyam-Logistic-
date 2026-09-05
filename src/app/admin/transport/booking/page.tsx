"use client";

import { useMemo, useState } from "react";
import {
  ActionButtons,
  DataGrid,
  FormWindow,
  ManualAmountInput,
  PrintCellButton,
  ReceiverEmailInput,
  StatusBanner,
  fmtDate,
  readApiError,
  apiDelete,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useTbsApi } from "@/components/tbs/useTbs";
import { oldDash } from "@/lib/tbs/legacySkdb";
import { LR_TYPES, normalizeLrType } from "@/lib/tbs/lrType";
import { needSelectAlert, openPrint } from "@/lib/tbs/print";
import { PartyShareChips } from "@/components/tbs/PartyShareChips";
import {
  bookingPdfBlob,
  bookingSharePeople,
  bookingSmsText,
  emailPdfTo,
  openSms,
  partyEmail,
  typedReceiverEmail,
  type SharePerson,
} from "@/lib/tbs/docShare";
import { sharePdfOnWhatsApp } from "@/lib/tbs/whatsapp";
import type { Bill, Booking, Challan, Masters, Party } from "@/lib/tbs/types";

type Payload = {
  bookings: Booking[];
  parties: Party[];
  masters: Masters;
  nextLr: string;
  bills?: Bill[];
  challans?: Challan[];
  billNoByLr?: Record<string, string>;
  challanNoByLr?: Record<string, string>;
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
    deliveryAt: "DOOR",
    expectedDelivery: "",
    payMode: "Credit",
    billingParty: "",
    consignor: "",
    consignee: "",
    receiverEmail: "",
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
    gstLabel: "GST @ 0%",
    gstAmt: 0,
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

function withTotals(b: Booking): Booking {
  const total = calcTotal(b);
  const gstAmt = Number(b.gstAmt) || 0;
  return { ...b, total, grandTotal: total + gstAmt };
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
  const sharePeople = useMemo(
    () => (current.id ? bookingSharePeople(current, parties) : []),
    [current, parties],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = data?.bookings || [];
    if (!q) return list;
    return list.filter((b) => b.lrNo.includes(q) || b.billingParty.toLowerCase().includes(q));
  }, [data, search]);

  const billNoByLr = useMemo(() => {
    const map: Record<string, string> = { ...(data?.billNoByLr || {}) };
    for (const bill of data?.bills || []) {
      for (const id of bill.lrIds || []) {
        if (!map[id]) map[id] = bill.billNo;
      }
    }
    return map;
  }, [data]);

  const challanNoByLr = useMemo(() => {
    const map: Record<string, string> = { ...(data?.challanNoByLr || {}) };
    for (const c of data?.challans || []) {
      for (const id of c.lrIds || []) {
        if (!map[id]) map[id] = c.challanNo;
      }
    }
    return map;
  }, [data]);

  function patch(partial: Partial<Booking>) {
    setForm(withTotals({ ...current, ...partial }));
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
    setForm((prev) => {
      const base = prev || blank(data?.nextLr || "1");
      // Never touch consignor / consignee / address when editing billing party
      return withTotals({
        ...base,
        billingParty: name,
        consignor: base.consignor,
        consignee: base.consignee,
        address: base.address,
        gstNo: base.gstNo,
        receiverEmail: base.receiverEmail || "",
      });
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

  async function emailBooking() {
    if (!current.id) return needSelectAlert("booking / LR");
    const to = typedReceiverEmail(current.receiverEmail);
    if (!to) {
      setMsg("Enter Receiver Email ID me email likho — PDF wahi jayegi.");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      const blob = await bookingPdfBlob(current, parties);
      const result = await emailPdfTo({
        to,
        subject: `SHYAM LOGISTICS LR ${current.lrNo}`,
        text: bookingSmsText(current),
        fileName: `LR-${current.lrNo || current.id}.pdf`,
        blob,
      });
      setMsg(
        result.sent
          ? `PDF emailed to ${result.to}`
          : `PDF downloaded — attach in email to ${result.to}`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Email failed");
    } finally {
      setSaving(false);
    }
  }

  function smsBooking(person?: SharePerson) {
    if (!current.id) return needSelectAlert("booking / LR");
    const target = person || sharePeople.find((p) => p.phone);
    if (!target?.phone) {
      setMsg("Party Creation me mobile save karein, phir SMS par click karein.");
      return;
    }
    openSms(target.phone, bookingSmsText(current));
  }

  async function shareBookingWhatsApp() {
    if (!current.id) return needSelectAlert("booking / LR");
    setSaving(true);
    try {
      const blob = await bookingPdfBlob(current, parties);
      await sharePdfOnWhatsApp(blob, `LR-${current.lrNo || current.id}.pdf`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "WhatsApp PDF failed");
    } finally {
      setSaving(false);
    }
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
    if (current.id) {
      await update();
      return;
    }
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
              <input
                className="tbs-input w-md"
                value={current.bookingFrom}
                onChange={(e) => patch({ bookingFrom: e.target.value })}
                placeholder="Type or select…"
                list="booking-station-suggestions"
                autoComplete="off"
              />
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
              <input
                className="tbs-input w-md"
                value={current.from}
                onChange={(e) => patch({ from: e.target.value })}
                placeholder="Type or select…"
                list="booking-station-suggestions"
                autoComplete="off"
              />
            </div>
            <div className="tbs-field">
              <label>To</label>
              <input
                className="tbs-input w-md"
                value={current.to}
                onChange={(e) => patch({ to: e.target.value })}
                placeholder="Type or select…"
                list="booking-station-suggestions"
                autoComplete="off"
              />
              <datalist id="booking-station-suggestions">
                {(data?.masters.stations || []).map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
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
                placeholder="DOOR"
                list="booking-delivery-at"
              />
              <datalist id="booking-delivery-at">
                <option value="DOOR" />
                <option value="GODOWN" />
              </datalist>
            </div>
            <div className="tbs-field">
              <label>Exp. Del.</label>
              <input
                className="tbs-input w-sm"
                value={current.expectedDelivery || ""}
                onChange={(e) => patch({ expectedDelivery: e.target.value })}
                placeholder="Days / date"
              />
            </div>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label htmlFor="fld-billing-party">BILLING PARTY</label>
              <input
                id="fld-billing-party"
                name="tbs-billing-party"
                className="tbs-input w-full"
                value={current.billingParty}
                onChange={(e) => pickBillingParty(e.target.value)}
                placeholder="Type or select…"
                list="booking-billing-party"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
              />
              <datalist id="booking-billing-party">
                {partyNames.map((n) => (
                  <option key={`bp-${n}`} value={n} />
                ))}
              </datalist>
            </div>
            <button type="button" className="tbs-btn" onClick={() => (window.location.href = "/admin/registration/parties")}>
              Add
            </button>
          </div>

          <div className="tbs-row">
            <div className="tbs-field" style={{ flex: 1 }}>
              <label htmlFor="fld-consignor">Consignor</label>
              <input
                id="fld-consignor"
                name="tbs-consignor"
                className="tbs-input w-full"
                value={current.consignor}
                onChange={(e) => pickConsignor(e.target.value)}
                placeholder="Type or select…"
                list="booking-consignor"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                data-lpignore="true"
                data-1p-ignore="true"
              />
              <datalist id="booking-consignor">
                {partyNames.map((n) => (
                  <option key={`cr-${n}`} value={n} />
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
              <label>Enter Receiver Email ID</label>
              <input
                className="tbs-input w-full"
                type="email"
                value={current.receiverEmail || ""}
                onChange={(e) => patch({ receiverEmail: e.target.value })}
                placeholder="receiver@email.com"
                list="booking-receiver-emails"
                autoComplete="off"
              />
              <datalist id="booking-receiver-emails">
                {parties
                  .map((p) => partyEmail(p))
                  .filter(Boolean)
                  .filter((email, i, arr) => arr.indexOf(email) === i)
                  .map((email) => (
                    <option key={email} value={email} />
                  ))}
              </datalist>
            </div>
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
          <label>GST</label>
          <div className="tbs-gst-row">
            <input
              className="tbs-input"
              value={current.gstLabel || ""}
              onChange={(e) => patch({ gstLabel: e.target.value })}
              placeholder="GST @ 0%"
              list="booking-gst-labels"
              autoComplete="off"
            />
            <ManualAmountInput
              className="tbs-input"
              syncKey={`${current.id}-gstAmt`}
              value={current.gstAmt || 0}
              onChange={(n) => patch({ gstAmt: n })}
            />
            <datalist id="booking-gst-labels">
              {(data?.masters.gstLabels || []).map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
          </div>
          <label className="total-label">Grand Total</label>
          <input className="tbs-input" value={current.grandTotal.toFixed(2)} readOnly />
          <label>GST Paid By</label>
          <select
            className="tbs-select"
            value={current.gstPaidBy}
            onChange={(e) => patch({ gstPaidBy: e.target.value })}
          >
            <option value="" />
            {Array.from(
              new Set([
                ...(data?.masters.gstPaidBy || []),
                current.gstPaidBy,
              ]),
            )
              .filter(Boolean)
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt.toLowerCase() === "consignor" ? "Consigner" : opt}
                </option>
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
          <label>Pay Mode</label>
          <select
            className="tbs-select"
            value={current.payMode || ""}
            onChange={(e) => patch({ payMode: e.target.value })}
          >
            <option value="" />
            <option value="NA">NA</option>
            <option value="Credit">Credit</option>
          </select>
          <label>Lr Type</label>
          <select
            className="tbs-select"
            value={normalizeLrType(current.lrType) || current.lrType}
            onChange={(e) => {
              const lrType = e.target.value;
              const payMode =
                lrType === "Paid"
                  ? "NA"
                  : current.payMode === "NA" || !current.payMode
                    ? "Credit"
                    : current.payMode;
              patch({ lrType, payMode });
            }}
          >
            {Array.from(
              new Set([
                ...LR_TYPES,
                normalizeLrType(current.lrType) || current.lrType,
              ]),
            )
              .filter(Boolean)
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
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

      <PartyShareChips
        people={sharePeople}
        busy={saving}
        onEmail={(p) => patch({ receiverEmail: p.email })}
        onSms={(p) => smsBooking(p)}
      />
      <div className="tbs-actions" style={{ borderTop: "1px solid #ccc", paddingTop: 10 }}>
        <ActionButtons
          onSave={save}
          onNew={() => {
            setForm(null);
            setMsg("");
          }}
          onUpdate={update}
          onDelete={remove}
          onPrint={() => {
            if (!current.id) return needSelectAlert("booking / LR");
            openPrint("booking", current.id);
          }}
          onPrintList={() => openPrint("bookings")}
          onWhatsApp={() => void shareBookingWhatsApp()}
          onEmail={() => void emailBooking()}
          onSms={() => smsBooking()}
          canUpdate={!!current.id}
          canDelete={!!current.id}
          canPrint={!!current.id}
          canWhatsApp={!!current.id}
          canEmail={!!current.id}
          canSms={!!current.id}
          saving={saving}
          printLabel="Print Bill"
          extra={
            <div className="tbs-toolbar-end">
              <ReceiverEmailInput
                value={current.receiverEmail || ""}
                onChange={(v) => patch({ receiverEmail: v })}
                listId="booking-receiver-emails-bar"
                emails={parties.map((p) => partyEmail(p))}
              />
              <div className="tbs-search">
                <span>🔍</span>
                <span>Enter LR No For Search</span>
                <input
                  className="tbs-input w-md"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
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
          { key: "receiverEmail", label: "Receiver Email", width: "180px" },
          { key: "from", label: "From" },
          { key: "to", label: "To" },
          { key: "particulars", label: "Particulars" },
          { key: "weight", label: "Weight" },
          { key: "freight", label: "Freight" },
          { key: "billNo", label: "Bill No" },
          { key: "challanNo", label: "Challan No" },
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
          if (key === "billNo") return oldDash(billNoByLr[row.id]);
          if (key === "challanNo") return oldDash(challanNoByLr[row.id]);
          if (key === "print")
            return <PrintCellButton onClick={() => openPrint("booking", row.id)} />;
          return (row as unknown as Record<string, string>)[key];
        }}
      />
    </FormWindow>
  );
}
