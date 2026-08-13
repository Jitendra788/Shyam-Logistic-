"use client";

import { fmtDate } from "@/components/tbs/FormPrimitives";
import { DEFAULT_LR_COMPANY, LrPrintSheet } from "@/components/tbs/LrPrintSheet";
import type {
  Bill,
  Booking,
  Challan,
  LhpPayment,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";

const LOGO = "/brand/shyam-peacock-mark.webp";
const co = DEFAULT_LR_COMPANY;

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
        <div>
          Subject To Sangli Jurisdiction
          <br />
          Do Not Pay Cash to Lorry Driver — Cheque / RTGS only
        </div>
        <div className="doc-sign">
          For Shyam Logistics
          <br />
          <br />
          _________________
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
  return (
    <Shell title="LORRY HIRE CONTRACT / CHALLAN" docNo={challan.challanNo}>
      <div className="doc-grid">
        <div>
          <b>Date:</b> {fmtDate(challan.challanDate)}
        </div>
        <div>
          <b>Vehicle:</b> {challan.vehicleNo}
        </div>
        <div>
          <b>Broker/Owner:</b> {challan.brokerOwner}
        </div>
        <div>
          <b>PAN:</b> {challan.brokerPan || challan.panNo}
        </div>
        <div>
          <b>From:</b> {challan.fromStation}
        </div>
        <div>
          <b>To:</b> {challan.toStation}
        </div>
        <div>
          <b>Driver:</b> {challan.driverName}
        </div>
        <div>
          <b>Licence:</b> {challan.licenceNo}
        </div>
        <div>
          <b>Freight:</b> {challan.freight}
        </div>
        <div>
          <b>Advance:</b> {challan.advance}
        </div>
        <div>
          <b>Cash / Fuel:</b> {challan.cash} / {challan.fuel}
        </div>
        <div>
          <b>Balance:</b> {challan.balance}
        </div>
      </div>
      <h4 style={{ margin: "10px 0 4px" }}>Attached LRs</h4>
      <Table
        columns={["LR No", "Date", "Party", "From", "To", "Freight"]}
        rows={lrs.map((b) => [
          b.lrNo,
          fmtDate(b.lrDate),
          b.billingParty,
          b.from,
          b.to,
          b.freight,
        ])}
      />
    </Shell>
  );
}

export function BillPrint({
  bill,
  bookings,
}: {
  bill: Bill;
  bookings: Booking[];
}) {
  const lrs = bookings.filter((b) => bill.lrIds.includes(b.id));
  return (
    <Shell title="TRANSPORT BILL" docNo={bill.billNo}>
      <div className="doc-grid">
        <div>
          <b>Bill Date:</b> {fmtDate(bill.billDate)}
        </div>
        <div>
          <b>Submission:</b> {fmtDate(bill.submissionDate)}
        </div>
        <div className="full">
          <b>Party:</b> {bill.partyName}
        </div>
        <div className="full">
          <b>Remark:</b> {bill.remark || "—"}
        </div>
      </div>
      <Table
        columns={["LR No", "Date", "From", "To", "Particulars", "Wt", "Freight"]}
        rows={lrs.map((b) => [
          b.lrNo,
          fmtDate(b.lrDate),
          b.from,
          b.to,
          b.particulars,
          b.chargedWt || b.actualWt,
          b.freight,
        ])}
      />
      <div className="doc-total">
        <b>Total Amount: ₹ {Number(bill.totalAmount).toFixed(2)}</b>
      </div>
    </Shell>
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
