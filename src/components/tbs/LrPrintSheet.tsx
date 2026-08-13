"use client";

import type { Booking, Party } from "@/lib/tbs/types";
import { ShyamStamp } from "@/components/tbs/ShyamStamp";

const LOGO_SRC = "/brand/shyam-peacock-mark-print.png";

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
    "Gate No.295/2, B/1, Near Laxmi Tekadi, Shri Mahalaxmi Petrol Pump 5 Star MIDC Kagal, Kolhapur. 416216",
  blessing: "|| Shree Ganesh Prasanna ||",
};

function partyOf(parties: Party[], name: string) {
  return parties.find((p) => p.partyName === name);
}

function dmy(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (y && m && d) return `${d}-${m}-${y}`;
  return iso;
}

function amt(n: number | string | undefined) {
  const v = Number(n) || 0;
  return v ? v.toFixed(2) : "";
}

function Copy({
  booking,
  parties,
  company,
}: {
  booking: Booking;
  parties: Party[];
  company: LrCompany;
}) {
  const consignor = partyOf(parties, booking.consignor);
  const consignee = partyOf(parties, booking.consignee);
  const lrType = (booking.lrType || "").toLowerCase();
  const gstBy = (booking.gstPaidBy || "").toLowerCase();
  const fromStation = booking.from || booking.bookingFrom || "";
  const remark = booking.lrType || "";

  return (
    <div className="lr-copy">
      <header className="lr-head">
        <div className="lr-head-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="" className="lr-logo-mark" />
          <div className="lr-gst">GST : {company.gstin}</div>
        </div>
        <div className="lr-head-mid">
          <div className="lr-bless">{company.blessing}</div>
          <div className="lr-title">{company.companyName}</div>
          <div className="lr-addr">{company.address}</div>
          <div className="lr-email">E-mail :{company.email}</div>
        </div>
        <div className="lr-head-right">
          <b>Mob :</b>
          {company.phone}
          <br />
          {company.phone2}
        </div>
      </header>

      <div className="lr-lorry-row">
        <div>
          <b>Lorry No</b> {booking.vehicleNo || ""}
        </div>
        <div className="lr-risk">OWNER&apos;S RISK</div>
        <div className="lr-gst-pay">
          <b>GST Tax Payble by</b>
          <label>
            <input
              type="checkbox"
              readOnly
              checked={/consign?or|consigner/.test(gstBy)}
            />{" "}
            Consigner
          </label>
          <label>
            <input type="checkbox" readOnly checked={gstBy.includes("consignee")} />{" "}
            Consignee
          </label>
          <label>
            <input type="checkbox" readOnly checked={gstBy.includes("transport")} />{" "}
            Transporter
          </label>
        </div>
      </div>

      <table className="lr-table lr-info">
        <tbody>
          <tr>
            <td>
              <b>Booking Office .</b>
              <div>{booking.bookingFrom}</div>
            </td>
            <td>
              <b>Delievery At .</b>
              <div>{booking.deliveryAt || ""}</div>
            </td>
            <td>
              <b>Cons.Note No.</b>
              <div className="lr-big">{booking.lrNo}</div>
            </td>
          </tr>
          <tr>
            <td>
              <b>From</b>
              <div>{fromStation}</div>
            </td>
            <td>
              <b>To</b>
              <div>{booking.to}</div>
            </td>
            <td>
              <b>Date</b>
              <div>{dmy(booking.lrDate)}</div>
            </td>
          </tr>
          <tr>
            <td>
              <b>Consigner</b>
              <div className="lr-strong">{booking.consignor}</div>
              <div className="lr-small">
                {consignor?.address || booking.address || ""}
              </div>
              <div className="lr-small">
                GST No. {consignor?.gstTin || booking.gstNo || ""}
              </div>
            </td>
            <td colSpan={2}>
              <b>Consignee</b>
              <div className="lr-strong">{booking.consignee || ""}</div>
              <div className="lr-small">{consignee?.address || ""}</div>
              <div className="lr-small">
                GST No. {consignee?.gstTin || ""}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="lr-table lr-goods">
        <thead>
          <tr>
            <th>No.of Art</th>
            <th>Description Said To Contents</th>
            <th>Inv.No &amp; Date</th>
            <th>Rate</th>
            <th>Freight Ch.</th>
            <th>Freight</th>
            <th>Remark</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={2}>{booking.noOfArticles || ""}</td>
            <td rowSpan={2}>{booking.particulars || ""}</td>
            <td rowSpan={2}>{booking.invNoDate || ""}</td>
            <td rowSpan={2}>{booking.rate || ""}</td>
            <td>Freight Rs.</td>
            <td className="num">{amt(booking.freight)}</td>
            <td rowSpan={11} className="lr-remark">
              {remark}
            </td>
          </tr>
          <tr>
            <td>Door Coll.</td>
            <td className="num">{amt(booking.doorColle)}</td>
          </tr>
          <tr>
            <td colSpan={4} rowSpan={9} className="lr-value">
              Value Rs.{" "}
              {booking.valueRs ? `${Number(booking.valueRs)} ` : ""}
              AS PER INVOICE
            </td>
            <td>Act.Weight</td>
            <td className="num">{booking.actualWt || ""}</td>
          </tr>
          <tr>
            <td>Door Del.</td>
            <td className="num">{amt(booking.doorDelivery)}</td>
          </tr>
          <tr>
            <td>Hamali</td>
            <td className="num">{amt(booking.hamali)}</td>
          </tr>
          <tr>
            <td>St.Chgs.</td>
            <td className="num">{amt(booking.stCharges)}</td>
          </tr>
          <tr>
            <td>Chg.Weight</td>
            <td className="num">
              {booking.chargedWt || booking.actualWt || ""}
            </td>
          </tr>
          <tr>
            <td>Total Amt</td>
            <td className="num">{amt(booking.total || booking.grandTotal)}</td>
          </tr>
          <tr>
            <td>GST</td>
            <td className="num"></td>
          </tr>
          <tr>
            <td>Advance</td>
            <td className="num"></td>
          </tr>
          <tr>
            <td>Balance</td>
            <td className="num">{amt(booking.grandTotal || booking.total)}</td>
          </tr>
        </tbody>
      </table>

      <div className="lr-eway">
        <span>
          <b>Eway Bill No.</b> {booking.ewayBillNo || ""}
        </span>
        <span>
          <b>Valid Date</b> {booking.validDate ? dmy(booking.validDate) : ""}
        </span>
        <span className="lr-paytypes">
          <label>
            <input
              type="checkbox"
              readOnly
              checked={lrType.includes("to pay") || lrType.includes("topay")}
            />{" "}
            Topay
          </label>
          <label>
            <input type="checkbox" readOnly checked={lrType === "paid"} /> Paid
          </label>
          <label>
            <input type="checkbox" readOnly checked={lrType.includes("tbb")} /> TBB
          </label>
        </span>
      </div>

      <div className="lr-legal">
        Subject To Sangli Jurisdiction, Leakage &amp; Breakage carries not
        responsible.
      </div>

      <div className="lr-bottom">
        <div className="lr-warn">
          Do Not Pay Cash to Lorry Driver, Payble Check RTGS Only Shyam Logistics
        </div>
        <div className="lr-sign">
          <ShyamStamp size="sm" />
          <div>For Shyam Logistics</div>
        </div>
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
      <Copy booking={booking} parties={parties} company={company} />
      <Copy booking={booking} parties={parties} company={company} />
    </div>
  );
}
