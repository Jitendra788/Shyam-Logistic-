"use client";

import { useEffect } from "react";
import { fmtDate } from "@/components/tbs/FormPrimitives";
import { DEFAULT_LR_COMPANY, LrPrintSheet } from "@/components/tbs/LrPrintSheet";
import { LrPdfFrame } from "@/components/tbs/LrPdfFrame";
import { ShyamStamp } from "@/components/tbs/ShyamStamp";
import { amountInWordsINR } from "@/lib/tbs/amountWords";
import type {
  Bill,
  Booking,
  Challan,
  LhpPayment,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";

const LOGO = "/brand/shyam-peacock-mark.png";
const co = DEFAULT_LR_COMPANY;

/** Tax Invoice header address (matches sample bill PDF). */
const BILL_ADDRESS =
  "Jajal Petrol Pump, Pune-Bangalore Highway, Vikaswadi, Kolhapur 416 234(Mah.)";

const BANK = {
  holder: "Shyam Logistics",
  accountNo: "50200116108322",
  ifsc: "HDFC0005373",
  branch: "Sangli (Current A/c)",
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtLrDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  const mi = Number(m) - 1;
  if (!y || !m || !d || mi < 0 || mi > 11) return fmtDate(iso);
  return `${d}-${MONTHS_SHORT[mi]}-${y}`;
}

function partyOf(parties: Party[], name: string) {
  return parties.find((p) => p.partyName === name);
}

function blank(n: number) {
  return n ? n : "";
}

function Shell({
  title,
  docNo,
  children,
}: {
  title: string;
  docNo?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="doc-sheet">
      <div className="doc-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" className="doc-logo" />
        <div className="doc-brand">
          <div className="doc-co">{co.companyName}</div>
          <div className="doc-meta">GST: {co.gstin}</div>
          <div className="doc-meta">
            Mob: {co.phone} / {co.phone2}
          </div>
          <div className="doc-meta">{co.address}</div>
          <div className="doc-meta">E-mail: {co.email}</div>
        </div>
        <div className="doc-right">
          <div className="doc-title">{title}</div>
          {docNo ? <div className="doc-no">No. {docNo}</div> : null}
        </div>
      </div>
      {children}
      <div className="doc-foot">
        <div />
        <div className="doc-sign">
          <ShyamStamp size="md" />
          <div>For Shyam Logistics</div>
        </div>
      </div>
    </div>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="doc-table">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} style={{ textAlign: "center" }}>
              No records
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export function PartyPrint({ party }: { party: Party }) {
  return (
    <Shell title="PARTY MASTER" docNo={party.partyCode}>
      <div className="doc-grid">
        <div>
          <b>Party Name:</b> {party.partyName}
        </div>
        <div>
          <b>Type:</b> {party.partyType}
        </div>
        <div>
          <b>Contact:</b> {party.contactNo}
        </div>
        <div>
          <b>PAN:</b> {party.panNo}
        </div>
        <div className="full">
          <b>Address:</b> {party.address}
        </div>
        <div>
          <b>GST TIN:</b> {party.gstTin}
        </div>
        <div>
          <b>OP Balance:</b> {party.opBalance}
        </div>
        <div>
          <b>A/c From:</b> {fmtDate(party.accountStartFrom)}
        </div>
      </div>
    </Shell>
  );
}

export function PartiesListPrint({ parties }: { parties: Party[] }) {
  return (
    <Shell title="PARTY REGISTER">
      <Table
        columns={["Sr", "Code", "Party Name", "Contact", "GST", "OP Bal"]}
        rows={parties.map((p, i) => [
          i + 1,
          p.partyCode,
          p.partyName,
          p.contactNo,
          p.gstTin,
          p.opBalance,
        ])}
      />
    </Shell>
  );
}

export function ChallanPrint({
  challan,
  bookings,
}: {
  challan: Challan;
  bookings: Booking[];
}) {
  const lrs = bookings.filter((b) => challan.lrIds.includes(b.id));
  const pkgTotal = lrs.reduce((s, b) => s + (Number(b.noOfArticles) || 0), 0);
  const wtTotal = lrs.reduce(
    (s, b) => s + (Number(b.actualWt || b.chargedWt) || 0),
    0,
  );
  const padRows = Math.max(10, 14 - lrs.length);
  const money = (n: number) => {
    const v = Number(n) || 0;
    return v % 1 ? v.toFixed(2) : String(v);
  };

  useEffect(() => {
    document.documentElement.classList.add("lm-print-root");
    const style = document.createElement("style");
    style.id = "lm-page-size";
    style.textContent = "@media print { @page { size: A4 portrait; margin: 7mm; } }";
    document.head.appendChild(style);
    return () => {
      document.documentElement.classList.remove("lm-print-root");
      style.remove();
    };
  }, []);

  const kv = (label: string, value: string) => (
    <div className="lm-kv">
      <span className="lm-k">{label}</span>
      <span className="lm-v">{value}</span>
    </div>
  );

  return (
    <div className="lm">
      <div className="lm-top">
        <span>GST : {co.gstin}</span>
        <span>|| Shree Ganesh Prasanna ||</span>
        <span className="lm-mob">
          Mob :{co.phone}
          <br />
          {co.phone2}
        </span>
      </div>

      <div className="lm-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" className="lm-logo" />
        <div className="lm-co">SHYAM LOGISTICS</div>
      </div>
      <div className="lm-addr">
        {BILL_ADDRESS} E-mail :{co.email}
      </div>

      <div className="lm-title">LORRY MEMO</div>

      <div className="lm-meta">
        <div className="lm-meta-col">
          {kv("Lorry No", challan.vehicleNo)}
          {kv("Broker Name", challan.brokerOwner)}
          {kv("Driver Name", challan.driverName)}
          {kv("Owner Name", challan.owner)}
        </div>
        <div className="lm-meta-col">
          {kv("Date", fmtDate(challan.challanDate))}
          {kv("PAN No.", challan.brokerPan)}
          {kv("From", challan.fromStation)}
          {kv("PAN No.", challan.panNo)}
        </div>
        <div className="lm-meta-col">
          {kv("Memo No", challan.challanNo)}
          {kv("Engine No.", challan.engine)}
          {kv("To", challan.toStation)}
          {kv("Chessy", challan.chessy)}
        </div>
      </div>

      <div className="lm-main">
        <table className="lm-table">
          <thead>
            <tr>
              <th className="lm-c-sr">Sr</th>
              <th className="lm-c-lr">LR No</th>
              <th className="lm-c-pkg">No of Pkg.</th>
              <th className="lm-c-ct">Content</th>
              <th className="lm-c-wt">Act.Weight</th>
              <th className="lm-c-from">From</th>
              <th className="lm-c-to">To</th>
            </tr>
          </thead>
          <tbody>
            {lrs.map((b, i) => (
              <tr key={b.id || i}>
                <td>{i + 1}</td>
                <td>{b.lrNo}</td>
                <td>{b.noOfArticles || ""}</td>
                <td>{b.particulars}</td>
                <td>{blank(b.actualWt || b.chargedWt)}</td>
                <td>{b.from || b.bookingFrom}</td>
                <td>{b.to}</td>
              </tr>
            ))}
            {Array.from({ length: padRows }).map((_, i) => (
              <tr key={`pad-${i}`} className="lm-pad">
                <td>&nbsp;</td>
                <td />
                <td />
                <td />
                <td />
                <td />
                <td />
              </tr>
            ))}
            {[
              ["Total Freight", money(challan.freight), true],
              ["Advance", money(challan.advance), false],
              ["Transfer", money(challan.transfer), false],
              ["Cash", Number(challan.cash) ? money(challan.cash) : "0.00", false],
              ["Fuel", money(challan.fuel), false],
              ["Balance", money(challan.balance), false],
            ].map(([lab, val, first], i) => (
              <tr key={String(lab)} className="lm-ch">
                <td className="lm-tot">{first ? lrs.length || "" : ""}</td>
                <td />
                <td className="lm-tot">{first ? pkgTotal || "" : ""}</td>
                <td />
                <td className="lm-tot">{first ? wtTotal || "" : ""}</td>
                <td className="lm-ch-lab">{lab}</td>
                <td className="lm-ch-num">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lm-foot">
        <div className="lm-driver">Driver Sign</div>
        <div className="lm-sign">
          <div>For Shyam Logistics</div>
          <ShyamStamp size="md" />
        </div>
      </div>
    </div>
  );
}

export function TaxInvoicePrint({
  partyName,
  billNo,
  billDate,
  lrs,
  parties = [],
  remark,
  totalAmount,
}: {
  partyName: string;
  billNo: string;
  billDate: string;
  lrs: Booking[];
  parties?: Party[];
  remark?: string;
  totalAmount?: number;
}) {
  const party = partyOf(parties, partyName);
  const address = party?.address || lrs[0]?.address || "";
  const gstNo = party?.gstTin || lrs[0]?.gstNo || "";
  const total =
    Number(totalAmount) ||
    lrs.reduce((s, b) => s + Number(b.grandTotal || b.freight || 0), 0);

  const padRows = Math.max(0, 3 - lrs.length);

  useEffect(() => {
    document.documentElement.classList.add("tax-inv-print-root");
    const style = document.createElement("style");
    style.id = "tax-inv-page-size";
    style.textContent =
      "@media print { @page { size: A4 landscape; margin: 6mm; } }";
    document.head.appendChild(style);
    return () => {
      document.documentElement.classList.remove("tax-inv-print-root");
      style.remove();
    };
  }, []);

  return (
    <div className="tax-inv">
      <div className="tax-inv-bless">|| Shri Ganesh Prasanna ||</div>

      <div className="tax-inv-brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO} alt="" className="tax-inv-logo" />
        <div className="tax-inv-brand-mid">
          <div className="tax-inv-co">SHYAM LOGISTICS</div>
          <div className="tax-inv-addr">{BILL_ADDRESS}</div>
          <div className="tax-inv-contact">
            E-mail : {co.email}
            <span className="tax-inv-sep">|</span>
            Mobile : {co.phone} / {co.phone2}
          </div>
          <div className="tax-inv-gst">GST : {co.gstin}</div>
        </div>
      </div>

      <div className="tax-inv-title-bar">Tax Invoice</div>

      <div className="tax-inv-party">
        <div className="tax-inv-party-l">
          <div className="tax-inv-line">
            <span className="tax-inv-lab">Party Name</span>
            <span className="tax-inv-val">{partyName}</span>
          </div>
          <div className="tax-inv-line">
            <span className="tax-inv-lab">Address</span>
            <span className="tax-inv-val">{address || "—"}</span>
          </div>
          <div className="tax-inv-line">
            <span className="tax-inv-lab">GST No</span>
            <span className="tax-inv-val">{gstNo || "—"}</span>
          </div>
        </div>
        <div className="tax-inv-party-r">
          <div className="tax-inv-line">
            <span className="tax-inv-lab">Bill No</span>
            <span className="tax-inv-val">{billNo}</span>
          </div>
          <div className="tax-inv-line">
            <span className="tax-inv-lab">Date</span>
            <span className="tax-inv-val">{fmtDate(billDate)}</span>
          </div>
        </div>
      </div>

      <table className="tax-inv-table">
        <thead>
          <tr>
            <th>Sr No</th>
            <th>LR No</th>
            <th>LR Date</th>
            <th>Invoice No</th>
            <th>Weight</th>
            <th>Vehicle No.</th>
            <th>From</th>
            <th>To</th>
            <th>Freight</th>
            <th>Halting</th>
            <th>Hamali</th>
            <th>Other</th>
            <th>Total Bill</th>
          </tr>
        </thead>
        <tbody>
          {lrs.map((b, i) => {
            const fromStation = b.from || b.bookingFrom || "";
            const other =
              Number(b.otherChrg || 0) +
              Number(b.stCharges || 0) +
              Number(b.lrCharges || 0) +
              Number(b.doorDelivery || 0) +
              Number(b.doorColle || 0);
            const freight = Number(b.freight || 0);
            const hamali = Number(b.hamali || 0);
            const halting = Number(b.barrier || 0);
            const rowTotal =
              Number(b.grandTotal) || freight + hamali + halting + other;
            return (
              <tr key={b.id || i}>
                <td>{i + 1}</td>
                <td>{b.lrNo}</td>
                <td>{fmtLrDate(b.lrDate)}</td>
                <td>{b.invNoDate || ""}</td>
                <td>{blank(b.chargedWt || b.actualWt)}</td>
                <td>{b.vehicleNo}</td>
                <td>{fromStation}</td>
                <td>{b.to}</td>
                <td>{blank(freight)}</td>
                <td>{blank(halting)}</td>
                <td>{blank(hamali)}</td>
                <td>{blank(other)}</td>
                <td>{rowTotal || ""}</td>
              </tr>
            );
          })}
          {Array.from({ length: padRows }).map((_, i) => (
            <tr key={`pad-${i}`} className="tax-inv-pad">
              {Array.from({ length: 13 }).map((__, j) => (
                <td key={j}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tax-inv-total-bar">
        <div className="tax-inv-total-l">
          <b>Total Freight : -</b>
          <span className="tax-inv-amt">{total}</span>
        </div>
        <div className="tax-inv-total-r">
          <span className="tax-inv-freight-lab">Freight</span>
          <span className="tax-inv-freight-val">{total}</span>
        </div>
      </div>

      <div className="tax-inv-words">
        <b>Amount in words:</b> {amountInWordsINR(total)}
      </div>

      <div className="tax-inv-bank">
        <div className="tax-inv-bank-title">Bank Details :</div>
        <div className="tax-inv-bank-grid">
          <div>Account Holder : {BANK.holder}</div>
          <div>Account No {BANK.accountNo}</div>
          <div>IFSC Code {BANK.ifsc}</div>
          <div>Branch : {BANK.branch}</div>
        </div>
      </div>

      {remark ? (
        <div className="tax-inv-remark">
          <b>Remark:</b> {remark}
        </div>
      ) : null}

      <div className="tax-inv-signs">
        <div className="tax-inv-sign-l">Authorised Signature</div>
        <div className="tax-inv-sign-c">Reciever&apos;s Sign</div>
        <div className="tax-inv-sign-r">
          <ShyamStamp size="md" />
          <div className="tax-inv-for">For Shyam Logistics</div>
        </div>
      </div>
    </div>
  );
}

export function BookingBillPrint({
  booking,
  parties = [],
}: {
  booking: Booking;
  parties?: Party[];
  showReferenceOverlay?: boolean;
}) {
  // Original form PDF + pdf-lib fill (sends booking body so local IDB rows work).
  return <LrPdfFrame booking={booking} parties={parties} />;
}

export function BillPrint({
  bill,
  bookings,
  parties = [],
}: {
  bill: Bill;
  bookings: Booking[];
  parties?: Party[];
}) {
  const lrs = bookings.filter((b) => bill.lrIds.includes(b.id));
  const total =
    Number(bill.totalAmount) ||
    lrs.reduce((s, b) => s + Number(b.grandTotal || b.freight || 0), 0);

  return (
    <TaxInvoicePrint
      partyName={bill.partyName}
      billNo={bill.billNo}
      billDate={bill.billDate}
      lrs={lrs}
      parties={parties}
      remark={bill.remark}
      totalAmount={total}
    />
  );
}

export function MrPrint({ receipt }: { receipt: MoneyReceipt }) {
  return (
    <Shell title="MONEY RECEIPT" docNo={receipt.mrNo}>
      <div className="doc-grid">
        <div>
          <b>Date:</b> {fmtDate(receipt.transactionDate || receipt.date)}
        </div>
        <div>
          <b>Bill No:</b> {receipt.billNo}
        </div>
        <div className="full">
          <b>Party:</b> {receipt.partyName}
        </div>
        <div>
          <b>Outstanding:</b> {receipt.outstanding}
        </div>
        <div>
          <b>Paid Amt:</b> {receipt.paidAmt}
        </div>
        <div>
          <b>Deduction:</b> {receipt.deduction}
        </div>
        <div>
          <b>Balance:</b> {receipt.balance}
        </div>
        <div className="full">
          <b>Narration:</b> {receipt.narration || "—"}
        </div>
      </div>
      <p style={{ marginTop: 12 }}>
        Received with thanks the sum of <b>₹ {Number(receipt.paidAmt).toFixed(2)}</b>
      </p>
    </Shell>
  );
}

export function LhpPrint({ payment }: { payment: LhpPayment }) {
  return (
    <Shell title="LORRY HIRE PAYMENT" docNo={payment.challanNo}>
      <div className="doc-grid">
        <div>
          <b>Txn Date:</b> {fmtDate(payment.transactionDate)}
        </div>
        <div>
          <b>Challan Date:</b> {fmtDate(payment.date)}
        </div>
        <div>
          <b>Broker:</b> {payment.broker}
        </div>
        <div>
          <b>Vehicle:</b> {payment.vehNo}
        </div>
        <div>
          <b>Outstanding:</b> {payment.outstanding}
        </div>
        <div>
          <b>Paid:</b> {payment.paidAmt}
        </div>
        <div>
          <b>Deduction:</b> {payment.deduction}
        </div>
        <div>
          <b>Balance:</b> {payment.balance}
        </div>
        <div className="full">
          <b>Narration:</b> {payment.narration || "—"}
        </div>
      </div>
    </Shell>
  );
}

export function NotePrint({ note }: { note: NoteVoucher }) {
  const title =
    note.type === "debit"
      ? "DEBIT NOTE"
      : note.type === "credit"
        ? "CREDIT NOTE"
        : "EXPENSE VOUCHER";
  return (
    <Shell title={title} docNo={note.voucherNo}>
      <div className="doc-grid">
        <div>
          <b>Date:</b> {fmtDate(note.date)}
        </div>
        <div>
          <b>Amount:</b> ₹ {Number(note.amount).toFixed(2)}
        </div>
        <div className="full">
          <b>Party:</b> {note.partyName}
        </div>
        <div className="full">
          <b>Narration:</b> {note.narration || "—"}
        </div>
      </div>
    </Shell>
  );
}

export function RegisterPrint({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <Shell title={title}>
      <Table columns={columns} rows={rows} />
    </Shell>
  );
}

export { LrPrintSheet };
