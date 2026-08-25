"use client";

import { useEffect } from "react";
import { fmtDate } from "@/components/tbs/FormPrimitives";
import { DEFAULT_LR_COMPANY, LrPrintSheet } from "@/components/tbs/LrPrintSheet";
import { LrPdfFrame } from "@/components/tbs/LrPdfFrame";
import { ShyamStamp } from "@/components/tbs/ShyamStamp";
import { amountInWordsINR } from "@/lib/tbs/amountWords";
import {
  BILL_ADDRESS,
  BILL_BANK,
  billedPartyInfo,
  billCrystalCharges,
  billLrSum,
  billPrintTotal,
  buildBillLines,
  displayBillNo,
  fmtBillDate,
} from "@/lib/tbs/billPrint";
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
  const padRows = Math.max(12, 16 - lrs.length);
  const memoAmt = (n: number, cash = false) => {
    const v = Number(n) || 0;
    if (cash) return v.toFixed(2);
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  };

  useEffect(() => {
    document.documentElement.classList.add("lm-print-root");
    const style = document.createElement("style");
    style.id = "lm-page-size";
    style.textContent =
      "@media print { @page { size: letter portrait; margin: 8mm; } }";
    document.head.appendChild(style);
    return () => {
      document.documentElement.classList.remove("lm-print-root");
      style.remove();
    };
  }, []);

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

      <div className="lm-frame">
        <div className="lm-title">LORRY MEMO</div>

        <table className="lm-meta">
          <tbody>
            <tr>
              <th>Lorry No</th>
              <td>{challan.vehicleNo}</td>
              <th>Date</th>
              <td>{fmtBillDate(challan.challanDate)}</td>
              <th>Memo No</th>
              <td>{challan.challanNo}</td>
            </tr>
            <tr>
              <th>Broker Name</th>
              <td>{challan.brokerOwner}</td>
              <th>PAN No.</th>
              <td>{challan.brokerPan}</td>
              <th>Engine No.</th>
              <td>{challan.engine}</td>
            </tr>
            <tr>
              <th>Driver Name</th>
              <td>{challan.driverName}</td>
              <th>From</th>
              <td>{challan.fromStation}</td>
              <th>To</th>
              <td>{challan.toStation}</td>
            </tr>
            <tr>
              <th>Owner Name</th>
              <td>{challan.owner}</td>
              <th>PAN No.</th>
              <td>{challan.panNo}</td>
              <th>Chessy</th>
              <td>{challan.chessy}</td>
            </tr>
          </tbody>
        </table>

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
              ["Total Freight", memoAmt(challan.freight), true],
              ["Advance", memoAmt(challan.advance), false],
              ["Transfer", memoAmt(challan.transfer), false],
              ["Cash", memoAmt(challan.cash, true), false],
              ["Fuel", memoAmt(challan.fuel), false],
              ["Balance", memoAmt(challan.balance), false],
            ].map(([lab, val, first]) => (
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

        <div className="lm-foot">
          <div className="lm-driver">Driver Sign</div>
          <div className="lm-sign">
            <div>For Shyam Logistics</div>
            <ShyamStamp size="md" />
          </div>
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
  bill,
}: {
  partyName: string;
  billNo: string;
  billDate: string;
  lrs: Booking[];
  parties?: Party[];
  remark?: string;
  bill?: Bill;
}) {
  const { address, gstNo } = billedPartyInfo(partyName, lrs, parties);
  const lrSum = billLrSum(lrs);
  const total = bill ? billPrintTotal(bill, lrs) : lrSum;
  const lines = buildBillLines(lrs);
  const shownNo = displayBillNo(billNo, billDate);
  const extras = billCrystalCharges(bill).filter(([, n]) => n > 0);
  const padRows = Math.max(5, 8 - lines.length);

  useEffect(() => {
    document.documentElement.classList.add("tax-inv-print-root");
    const style = document.createElement("style");
    style.id = "tax-inv-page-size";
    style.textContent =
      "@media print { @page { size: letter landscape; margin: 7mm; } }";
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
          <div className="tax-inv-addr">
            {BILL_ADDRESS} E-mail :{co.email}
          </div>
          <div className="tax-inv-contact">
            Mobile : {co.phone} / {co.phone2}
          </div>
          <div className="tax-inv-gst">GST : {co.gstin}</div>
        </div>
      </div>

      <div className="tax-inv-frame">
        <div className="tax-inv-title-bar">Tax Invoice</div>

        <div className="tax-inv-party">
          <div className="tax-inv-party-l">
            <div className="tax-inv-line">
              <span className="tax-inv-lab">Party Name</span>
              <span className="tax-inv-val">{partyName}</span>
            </div>
            <div className="tax-inv-line">
              <span className="tax-inv-lab">Address</span>
              <span className="tax-inv-val">{address || ""}</span>
            </div>
            <div className="tax-inv-line">
              <span className="tax-inv-lab">GST No</span>
              <span className="tax-inv-val">{gstNo || ""}</span>
            </div>
          </div>
          <div className="tax-inv-party-r">
            <div className="tax-inv-line tax-inv-line-r">
              <span className="tax-inv-lab">Bill No</span>
              <span className="tax-inv-val">{shownNo}</span>
            </div>
            <div className="tax-inv-line tax-inv-line-r">
              <span className="tax-inv-lab">Date</span>
              <span className="tax-inv-val">{fmtBillDate(billDate)}</span>
            </div>
          </div>
        </div>
      </div>

      <table className="tax-inv-table">
        <colgroup>
          <col className="c-sr" />
          <col className="c-lr" />
          <col className="c-date" />
          <col className="c-inv" />
          <col className="c-wt" />
          <col className="c-veh" />
          <col className="c-from" />
          <col className="c-to" />
          <col className="c-frt" />
          <col className="c-halt" />
          <col className="c-ham" />
          <col className="c-oth" />
          <col className="c-tot" />
        </colgroup>
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
          {lines.map((row, i) => (
            <tr key={i} className={row.chargeLabel ? "tax-inv-charge" : undefined}>
              <td>{row.sr}</td>
              <td>{row.lrNo}</td>
              <td>{row.lrDate}</td>
              <td>{row.invNo}</td>
              <td>{row.weight}</td>
              <td>{row.vehicle}</td>
              <td>{row.from}</td>
              <td>{row.to}</td>
              <td>{row.freight}</td>
              <td>{row.halting}</td>
              <td>{row.hamali}</td>
              <td>{row.other}</td>
              <td>{row.total}</td>
            </tr>
          ))}
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
          <span>Total Freight : -</span>
          <span className="tax-inv-amt">{lrSum}</span>
        </div>
        <div className="tax-inv-total-r">
          <span className="tax-inv-freight-lab">Freight</span>
          <span className="tax-inv-freight-val">{lrSum}</span>
        </div>
      </div>

      {extras.length ? (
        <div className="tax-inv-charges">
          {extras.map(([lab, amt]) => (
            <div key={lab}>
              <span>{lab}</span>
              <b>{amt}</b>
            </div>
          ))}
          <div className="tax-inv-charges-grand">
            <span>Grand Total</span>
            <b>{total}</b>
          </div>
        </div>
      ) : null}

      <div className="tax-inv-words">
        <b>Amount in words:</b> {amountInWordsINR(total)}
      </div>

      <div className="tax-inv-bank">
        <div className="tax-inv-bank-title">Bank Details :</div>
        <div className="tax-inv-bank-grid">
          <div>Account Holder : {BILL_BANK.holder}</div>
          <div>Account No {BILL_BANK.accountNo}</div>
          <div>IFSC Code {BILL_BANK.ifsc}</div>
          <div>Branch : {BILL_BANK.branch}</div>
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
  autoPrint = false,
}: {
  booking: Booking;
  parties?: Party[];
  autoPrint?: boolean;
  showReferenceOverlay?: boolean;
}) {
  return <LrPdfFrame booking={booking} parties={parties} autoPrint={autoPrint} />;
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

  return (
    <TaxInvoicePrint
      partyName={bill.partyName}
      billNo={bill.billNo}
      billDate={bill.billDate}
      lrs={lrs}
      parties={parties}
      remark={bill.remark}
      bill={bill}
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
