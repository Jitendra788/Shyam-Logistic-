"use client";

import { useEffect, useState } from "react";
import {
  FormWindow,
  fmtDate,
  todayISO,
} from "@/components/tbs/FormPrimitives";
import { useAdminAuth } from "@/components/tbs/useTbs";
import { downloadAsExcel } from "@/lib/tbs/excel";
import { ShyamStamp } from "@/components/tbs/ShyamStamp";

type ReportKind =
  | "booking"
  | "outstanding"
  | "billingwise"
  | "dayswise"
  | "ledger"
  | "gst"
  | "profit";

export function ReportScreen({
  title,
  kind,
  needParty = false,
}: {
  title: string;
  kind: ReportKind;
  needParty?: boolean;
}) {
  const ready = useAdminAuth();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(todayISO());
  const [party, setParty] = useState("");
  const [parties, setParties] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ kind, from, to });
    if (party) q.set("party", party);
    const res = await fetch(`/api/tbs/reports?${q}`);
    setLoading(false);
    if (!res.ok) {
      setError("Failed to load report");
      return;
    }
    const json = await res.json();
    setData(json);
    if (Array.isArray(json.parties)) setParties(json.parties);
    if (needParty && !party && json.party) setParty(json.party);
  }

  useEffect(() => {
    if (ready) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return <div className="tbs-empty">Loading…</div>;

  const rows = (data?.rows as Record<string, unknown>[]) || [];
  const totals = (data?.totals as Record<string, number>) || {};

  return (
    <FormWindow title={title}>
      {error && <div className="tbs-msg err">{error}</div>}

      <div className="tbs-row rpt-filters">
        <div className="tbs-field">
          <label>From Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="tbs-field">
          <label>To Date</label>
          <input
            className="tbs-input w-md"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        {(needParty ||
          kind === "outstanding" ||
          kind === "billingwise" ||
          kind === "dayswise" ||
          kind === "booking" ||
          kind === "gst") && (
          <div className="tbs-field" style={{ flex: 1 }}>
            <label>{needParty ? "Select Party" : "Party (optional)"}</label>
            <select
              className="tbs-select w-full"
              value={party}
              onChange={(e) => setParty(e.target.value)}
            >
              {!needParty && <option value="">All</option>}
              {parties.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        )}
        <button type="button" className="tbs-btn" onClick={() => load()} disabled={loading}>
          Show
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-excel"
          onClick={() => {
            if (!rows.length && kind !== "profit") {
              alert("Click Show first, then Generate as Excel.");
              return;
            }
            const headers =
              kind === "billingwise" || kind === "dayswise"
                ? ["Sr", "Bill No", "Date", "Party", "Bill Amt", "Paid", "Outstanding", "Days", "Age"]
                : kind === "ledger"
                  ? ["Sr", "Date", "Type", "Doc No", "Narration", "Debit", "Credit", "Balance"]
                  : kind === "gst"
                    ? ["Sr", "LR No", "Date", "Party", "GST No", "Taxable", "GST Paid By", "Eway"]
                    : kind === "profit"
                      ? ["Particulars", "Amount"]
                      : kind === "outstanding"
                        ? ["Sr", "Party", "Bills", "Bill Amt", "Paid", "Outstanding"]
                        : ["Sr", "Data"];
            const excelRows =
              kind === "profit"
                ? rows.map((r) => [String(r.label), Number(r.amount)])
                : kind === "billingwise" || kind === "dayswise"
                  ? rows.map((r) => [
                      String(r.sr),
                      String(r.billNo),
                      fmtDate(String(r.date)),
                      String(r.party),
                      Number(r.billAmt),
                      Number(r.paid),
                      Number(r.outstanding),
                      String(r.days),
                      String(r.age || ""),
                    ])
                  : kind === "ledger"
                    ? rows.map((r) => [
                        String(r.sr),
                        fmtDate(String(r.date)),
                        String(r.type),
                        String(r.docNo),
                        String(r.narr),
                        Number(r.debit),
                        Number(r.credit),
                        Number(r.balance),
                      ])
                    : kind === "gst"
                      ? rows.map((r) => [
                          String(r.sr),
                          String(r.lrNo),
                          fmtDate(String(r.date)),
                          String(r.party),
                          String(r.gstNo),
                          Number(r.taxable),
                          String(r.gstPaidBy),
                          String(r.eway),
                        ])
                      : kind === "outstanding"
                        ? rows.map((r) => [
                            String(r.sr),
                            String(r.party),
                            String(r.bills),
                            Number(r.billAmt),
                            Number(r.paid),
                            Number(r.outstanding),
                          ])
                        : rows.map((r) => [String(r.sr), JSON.stringify(r)]);
            downloadAsExcel(`${kind}_report_${from}_${to}.xlsx`, headers, excelRows);
          }}
        >
          Generate as Excel
        </button>
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={() => window.print()}
          disabled={!rows.length && kind !== "profit"}
        >
          <span className="dot print">🖨</span> Print
        </button>
      </div>

      <div className="rpt-print-area">
        <div className="rpt-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/shyam-peacock-mark-print.png" alt="" width={48} height={48} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>SHYAM LOGISTICS</div>
            <div style={{ fontSize: 12 }}>{title}</div>
            <div style={{ fontSize: 11 }}>
              Period: {fmtDate(from)} to {fmtDate(to)}
              {party ? ` · Party: ${party}` : ""}
            </div>
          </div>
        </div>

        {kind === "booking" && (
          <div className="tbs-grid-wrap">
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>LR No</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Particulars</th>
                  <th>Weight</th>
                  <th>Freight</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id || r.sr)}>
                    <td>{String(r.sr)}</td>
                    <td>{String(r.lrNo)}</td>
                    <td>{fmtDate(String(r.lrDate))}</td>
                    <td>{String(r.party)}</td>
                    <td>{String(r.from)}</td>
                    <td>{String(r.to)}</td>
                    <td>{String(r.particulars)}</td>
                    <td>{String(r.weight)}</td>
                    <td>{String(r.freight)}</td>
                    <td>{String(r.lrType)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(kind === "outstanding") && (
          <div className="tbs-grid-wrap">
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Party Name</th>
                  <th>Bills</th>
                  <th>Bill Amount</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.party)}>
                    <td>{String(r.sr)}</td>
                    <td>{String(r.party)}</td>
                    <td>{String(r.bills)}</td>
                    <td>{Number(r.billAmt).toFixed(2)}</td>
                    <td>{Number(r.paid).toFixed(2)}</td>
                    <td>
                      <b>{Number(r.outstanding).toFixed(2)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(kind === "billingwise" || kind === "dayswise") && (
          <div className="tbs-grid-wrap">
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Bill No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Bill Amount</th>
                  <th>Paid</th>
                  <th>Outstanding</th>
                  <th>Days</th>
                  {kind === "dayswise" && <th>Age</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id || r.billNo)}>
                    <td>{String(r.sr)}</td>
                    <td>{String(r.billNo)}</td>
                    <td>{fmtDate(String(r.date))}</td>
                    <td>{String(r.party)}</td>
                    <td>{Number(r.billAmt).toFixed(2)}</td>
                    <td>{Number(r.paid).toFixed(2)}</td>
                    <td>
                      <b>{Number(r.outstanding).toFixed(2)}</b>
                    </td>
                    <td>{String(r.days)}</td>
                    {kind === "dayswise" && <td>{String(r.age)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {kind === "ledger" && (
          <div className="tbs-grid-wrap">
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Doc No</th>
                  <th>Narration</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id || r.sr)}>
                    <td>{String(r.sr)}</td>
                    <td>{fmtDate(String(r.date))}</td>
                    <td>{String(r.type)}</td>
                    <td>{String(r.docNo)}</td>
                    <td>{String(r.narr)}</td>
                    <td>{Number(r.debit) ? Number(r.debit).toFixed(2) : ""}</td>
                    <td>{Number(r.credit) ? Number(r.credit).toFixed(2) : ""}</td>
                    <td>{Number(r.balance).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {kind === "gst" && (
          <div className="tbs-grid-wrap">
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>LR No</th>
                  <th>Date</th>
                  <th>Party</th>
                  <th>GST No</th>
                  <th>Taxable Amt</th>
                  <th>GST Paid By</th>
                  <th>Eway Bill</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id || r.sr)}>
                    <td>{String(r.sr)}</td>
                    <td>{String(r.lrNo)}</td>
                    <td>{fmtDate(String(r.date))}</td>
                    <td>{String(r.party)}</td>
                    <td>{String(r.gstNo)}</td>
                    <td>{Number(r.taxable).toFixed(2)}</td>
                    <td>{String(r.gstPaidBy)}</td>
                    <td>{String(r.eway)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {kind === "profit" && (
          <div className="tbs-grid-wrap" style={{ maxWidth: 520 }}>
            <table className="tbs-grid">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.label)}>
                    <td>{String(r.label)}</td>
                    <td>
                      <b>{Number(r.amount).toFixed(2)}</b>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!!Object.keys(totals).length && (
          <div style={{ marginTop: 10, fontWeight: 700 }}>
            {Object.entries(totals).map(([k, v]) => (
              <span key={k} style={{ marginRight: 16 }}>
                {k}: ₹ {Number(v).toFixed(2)}
              </span>
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && kind !== "profit" && (
          <div className="tbs-empty">No records for selected filters</div>
        )}

        <div className="rpt-sign">
          <div>For Shyam Logistics</div>
          <ShyamStamp size="md" />
        </div>
      </div>
    </FormWindow>
  );
}
