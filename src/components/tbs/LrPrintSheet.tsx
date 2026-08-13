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
  return parties.find(
    (p) => p.partyName.trim().toLowerCase() === name.trim().toLowerCase(),
  );
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
  const rateLabel = booking.rate ? String(booking.rate) : "";
  const charges: [string, string][] = [
    ["Freight Rs.", amt(booking.freight)],
    ["Door Coll.", amt(booking.doorColle)],
    ["Door Del.", amt(booking.doorDelivery)],
    ["Hamali", amt(booking.hamali)],
    ["St.Chgs.", amt(booking.stCharges)],
    ["Total Amt", amt(booking.total || booking.grandTotal)],
    ["GST", amt(booking.gstAmt)],
    ["Advance", ""],
    ["Balance", amt(booking.grandTotal || booking.total)],
  ];

  return (
    <div className="lr-copy">
      <header className="lr-head">
        <div className="lr-head-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="" className="lr-logo-mark" />
        </div>
        <div className="lr-head-mid">
          <div className="lr-bless">{company.blessing}</div>
          <div className="lr-title">{company.companyName}</div>
          <div className="lr-addr">{company.address}</div>
          <div className="lr-email">E-mail :{company.email}</div>
        </div>
        <div className="lr-head-right">
          <div>
            GST : {company.gstin}
          </div>
          <div>
            Mob :{company.phone}
            <br />
            {company.phone2}
          </div>
        </div>
      </header>

      <div className="lr-lorry-row">
        <div>
          <b>Lorry No</b> {booking.vehicleNo || ""}
        </div>
        <div className="lr-risk">OWNER&apos;S RISK</div>
        <div className="lr-gst-pay">
          GST Tax Payble by Consigner/Consignee/Transporter
          <span className="lr-gst-ticks">
            <label>
              <input
                type="checkbox"
                readOnly
                checked={/consign?or|consigner/.test(gstBy)}
              />
              Consigner
            </label>
            <label>
              <input
                type="checkbox"
                readOnly
                checked={gstBy.includes("consignee")}
              />
              Consignee
            </label>
            <label>
              <input
                type="checkbox"
                readOnly
                checked={
                  gstBy.includes("transport") ||
                  gstBy.includes("broker") ||
                  gstBy.includes("company")
                }
              />
              Transporter
            </label>
          </span>
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
        </tbody>
      </table>

      <table className="lr-table lr-parties">
        <tbody>
          <tr>
            <td>
              <b>Consigner</b>
              <div className="lr-strong">{booking.consignor}</div>
              <div className="lr-small">{consignor?.address || ""}</div>
              <div className="lr-small">
                GST No. {consignor?.gstTin || ""}
              </div>
            </td>
            <td>
              <b>Consignee</b>
              <div className="lr-strong">{booking.consignee || ""}</div>
              <div className="lr-small">
                {consignee?.address || booking.address || ""}
              </div>
              <div className="lr-small">
                GST No. {consignee?.gstTin || booking.gstNo || ""}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="lr-table lr-goods">
        <colgroup>
          <col className="c-art" />
          <col className="c-desc" />
          <col className="c-inv" />
          <col className="c-rate" />
          <col className="c-ch" />
          <col className="c-fr" />
          <col className="c-rm" />
        </colgroup>
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
            <td rowSpan={9} className="lr-rate-cell">
              <table className="lr-rate-inner">
                <tbody>
                  <tr>
                    <td className="lr-rate-fix">
                      {rateLabel || "FIX"}
                    </td>
                  </tr>
                  <tr>
                    <td className="lr-rate-wt">
                      <div className="lr-wt-label">Act.Weight</div>
                      <div className="lr-wt-val">
                        {booking.actualWt || ""}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="lr-rate-wt lr-rate-wt-last">
                      <div className="lr-wt-label">Chg.Weight</div>
                      <div className="lr-wt-val">
                        {booking.chargedWt || booking.actualWt || ""}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td>{charges[0][0]}</td>
            <td className="num">{charges[0][1]}</td>
            <td rowSpan={9} className="lr-remark"></td>
          </tr>
          <tr>
            <td>{charges[1][0]}</td>
            <td className="num">{charges[1][1]}</td>
          </tr>
          <tr>
            <td colSpan={3} rowSpan={7} className="lr-value">
              Value Rs. AS PER INVOICE
              {booking.valueRs ? ` ${Number(booking.valueRs)}` : ""}
            </td>
            <td>{charges[2][0]}</td>
            <td className="num">{charges[2][1]}</td>
          </tr>
          {charges.slice(3).map(([label, val]) => (
            <tr key={label}>
              <td>{label}</td>
              <td className="num">{val}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table className="lr-table lr-foot">
        <tbody>
          <tr>
            <td>
              <b>Eway Bill No.</b> {booking.ewayBillNo || ""}
            </td>
            <td>
              <b>Valid Date</b>{" "}
              {booking.validDate ? dmy(booking.validDate) : ""}
            </td>
            <td className="lr-sign-cell" rowSpan={3}>
              <div>For Shyam Logistics</div>
              <ShyamStamp size="sm" />
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <span className="lr-paytypes">
                <label>
                  <input
                    type="checkbox"
                    readOnly
                    checked={
                      lrType.includes("to pay") || lrType.includes("topay")
                    }
                  />{" "}
                  Topay
                </label>
                <label>
                  <input
                    type="checkbox"
                    readOnly
                    checked={lrType === "paid"}
                  />{" "}
                  Paid
                </label>
                <label>
                  <input
                    type="checkbox"
                    readOnly
                    checked={lrType.includes("tbb")}
                  />{" "}
                  TBB
                </label>
              </span>
              <span className="lr-legal">
                Subject To Sangli Jurisdiction, Leakage &amp; Breakage carries
                not responsible.
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="lr-warn">
              Do Not Pay Cash to Lorry Driver, Payble Check RTGS Only Shyam
              Logistics
            </td>
          </tr>
        </tbody>
      </table>
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
