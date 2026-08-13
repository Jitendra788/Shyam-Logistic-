"use client";

import type { Booking, Party } from "@/lib/tbs/types";
import { fmtDate } from "@/components/tbs/FormPrimitives";

const LOGO_SRC = "/brand/shyam-peacock-mark.webp";
const BRAND_LOGO = "/brand/shyam-brand-logo.webp";

export type LrCompany = {
  companyName: string;
  gstin: string;
  phone: string;
  phone2: string;
  email: string;
  address: string;
  blessing?: string;
};

export const DEFAULT_LR_COMPANY: LrCompany = {
  companyName: "SHYAM LOGISTICS",
  gstin: "27AXGPL2293R1ZP",
  phone: "8459858242",
  phone2: "9057420562",
  email: "shyamlogisticscompany535@gmail.com",
  address:
    "Gate No.295/2, B/1, Near Laxmi Tekadi, Shri Mahalaxmi Petrol Pump 5 Star MIDC Kagal, Kolhapur 416 216",
  blessing: "|| Shree Ganesh Prasanna ||",
};

function partyOf(parties: Party[], name: string) {
  return parties.find((p) => p.partyName === name);
}

function Copy({
  booking,
  parties,
  company,
  copyLabel,
}: {
  booking: Booking;
  parties: Party[];
  company: LrCompany;
  copyLabel: string;
}) {
  const consignor = partyOf(parties, booking.consignor);
  const consignee = partyOf(parties, booking.consignee);
  const lrType = (booking.lrType || "").toLowerCase();

  return (
    <div className="lr-copy">
      <div className="lr-topbar">
        <span>GST : {company.gstin}</span>
        <span className="lr-bless">{company.blessing}</span>
        <span className="lr-mob">
          Mob :{company.phone}
          <br />
          {company.phone2}
        </span>
      </div>

      <div className="lr-brand">
        <img src={LOGO_SRC} alt="" className="lr-logo-mark" />
        <div className="lr-brand-mid">
          <div className="lr-title">{company.companyName}</div>
          <div className="lr-addr">{company.address}</div>
          <div className="lr-email">E-mail :{company.email}</div>
        </div>
        <img src={BRAND_LOGO} alt="SHYAM LOGISTIC" className="lr-logo-full" />
      </div>

      <div className="lr-row lr-meta">
        <div>
          <b>Lorry No</b> {booking.vehicleNo || "—"}
        </div>
        <div className="lr-gst-pay">
          <b>GST Tax Payble by</b>
          <label>
            <input type="checkbox" readOnly checked={/consignor|consigner/i.test(booking.gstPaidBy)} />{" "}
            Consigner
          </label>
          <label>
            <input type="checkbox" readOnly checked={/consignee/i.test(booking.gstPaidBy)} /> Consignee
          </label>
          <label>
            <input type="checkbox" readOnly checked={/transport/i.test(booking.gstPaidBy)} />{" "}
            Transporter
          </label>
        </div>
        <div className="lr-copy-tag">{copyLabel}</div>
      </div>

      <table className="lr-table">
        <tbody>
          <tr>
            <td>
              <b>Booking Office .</b>
              <div>{booking.bookingFrom}</div>
            </td>
            <td>
              <b>Delievery At .</b>
              <div>{booking.deliveryAt || "—"}</div>
            </td>
            <td>
              <b>Cons.Note No.</b>
              <div className="lr-big">{booking.lrNo}</div>
            </td>
          </tr>
          <tr>
            <td>
              <b>From</b>
              <div>{booking.from}</div>
            </td>
            <td>
              <b>To</b>
              <div>{booking.to}</div>
            </td>
            <td>
              <b>Date</b>
              <div>{fmtDate(booking.lrDate)}</div>
            </td>
          </tr>
          <tr>
            <td colSpan={1}>
              <b>Consigner</b>
              <div className="lr-strong">{booking.consignor}</div>
              <div className="lr-small">
                {consignor?.address || booking.address || "—"}
              </div>
              <div className="lr-small">
                GST No. {consignor?.gstTin || booking.gstNo || "—"}
              </div>
            </td>
            <td colSpan={2}>
              <b>Consignee</b>
              <div className="lr-strong">{booking.consignee}</div>
              <div className="lr-small">{consignee?.address || "—"}</div>
              <div className="lr-small">GST No. {consignee?.gstTin || "—"}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="lr-body-grid">
        <table className="lr-table lr-goods">
          <thead>
            <tr>
              <th>No.of Art</th>
              <th>Description Said To Contents</th>
              <th>Inv.No &amp; Date</th>
              <th>Rate Freight Ch.</th>
              <th>Freight</th>
              <th>Remark</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{booking.noOfArticles || "—"}</td>
              <td>{booking.particulars || "—"}</td>
              <td>{booking.invNoDate || "—"}</td>
              <td>{booking.rate || "—"}</td>
              <td>{booking.freight || "—"}</td>
              <td rowSpan={2} className="lr-remark">
                {booking.lrType || ""}
              </td>
            </tr>
            <tr>
              <td colSpan={2}>
                <div>
                  <b>Act.weight</b> {booking.actualWt || "—"}
                </div>
                <div>
                  <b>Chg.Weight</b> {booking.chargedWt || booking.actualWt || "—"}
                </div>
              </td>
              <td colSpan={3}>AS PER INVOICE</td>
            </tr>
          </tbody>
        </table>

        <table className="lr-table lr-charges">
          <tbody>
            {(
              [
                ["Freight Rs.", booking.freight],
                ["Door Coll.", booking.doorColle],
                ["Door Del.", booking.doorDelivery],
                ["Hamali", booking.hamali],
                ["St.Chgs.", booking.stCharges],
                ["Total Amt", booking.total || booking.grandTotal],
                ["GST", 0],
                ["Advance", 0],
                ["Balance", booking.grandTotal || booking.total],
              ] as const
            ).map(([label, val]) => (
              <tr key={label}>
                <td>{label}</td>
                <td className="num">{Number(val) ? Number(val).toFixed(2) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lr-footer-row">
        <div>
          <div>
            <b>Value Rs.</b> {booking.valueRs || ""}
          </div>
          <div>
            <b>Eway Bill No</b> {booking.ewayBillNo || ""}
          </div>
          <div>
            <b>Valid Date</b> {booking.validDate ? fmtDate(booking.validDate) : ""}
          </div>
          <div className="lr-paytypes">
            <label>
              <input type="checkbox" readOnly checked={lrType.includes("to pay") || lrType.includes("topay")} />{" "}
              Topay
            </label>
            <label>
              <input type="checkbox" readOnly checked={lrType === "paid"} /> Paid
            </label>
            <label>
              <input type="checkbox" readOnly checked={lrType.includes("tbb")} /> TBB
            </label>
            <span className="lr-risk">OWNER&apos;S RISK</span>
          </div>
        </div>
        <div className="lr-sign">
          For Shyam Logistics
          <br />
          <br />
          _________________
        </div>
      </div>

      <div className="lr-disclaimer">
        Subject To Sangli Jurisdiction, Leakage &amp; Breakage carries not responsible.
        Do Not Pay Cash to Lorry Driver, Payble Check RTGS Only {company.companyName}
      </div>
    </div>
  );
}

export function LrPrintSheet({
  booking,
  parties,
  company = DEFAULT_LR_COMPANY,
}: {
  booking: Booking;
  parties: Party[];
  company?: LrCompany;
}) {
  return (
    <div className="lr-print-root">
      <Copy booking={booking} parties={parties} company={company} copyLabel="CONSIGNOR COPY" />
      <div className="lr-cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</div>
      <Copy booking={booking} parties={parties} company={company} copyLabel="CONSIGNEE / OFFICE COPY" />
    </div>
  );
}
