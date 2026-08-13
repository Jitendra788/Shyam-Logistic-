import * as XLSX from "xlsx";
import { requireAuth } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getLhpPayments,
  getMasters,
  getMoneyReceipts,
  getNotes,
  getParties,
} from "@/lib/tbs/store";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const [parties, bookings, challans, payments, bills, receipts, notes, masters] =
    await Promise.all([
      getParties(),
      getBookings(),
      getChallans(),
      getLhpPayments(),
      getBills(),
      getMoneyReceipts(),
      getNotes(),
      getMasters(),
    ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      parties.map((p) => ({
        Code: p.partyCode,
        "Party Name": p.partyName,
        Contact: p.contactNo,
        Address: p.address,
        GST: p.gstTin,
        Type: p.partyType,
        PAN: p.panNo,
        "OP Balance": p.opBalance,
        "Ac From": p.accountStartFrom,
      })),
    ),
    "Parties",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      bookings.map((b) => ({
        "LR No": b.lrNo,
        "LR Date": b.lrDate,
        "Billing Party": b.billingParty,
        From: b.from,
        To: b.to,
        Vehicle: b.vehicleNo,
        Particulars: b.particulars,
        Weight: b.chargedWt || b.actualWt,
        Freight: b.freight,
        Total: b.grandTotal || b.total,
        "LR Type": b.lrType,
        Delivered: b.delivered ? "Yes" : "No",
        Eway: b.ewayBillNo,
      })),
    ),
    "Bookings",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      challans.map((c) => ({
        "Challan No": c.challanNo,
        Date: c.challanDate,
        Vehicle: c.vehicleNo,
        Broker: c.brokerOwner,
        From: c.fromStation,
        To: c.toStation,
        Freight: c.freight,
        Advance: c.advance,
        Balance: c.balance,
        Driver: c.driverName,
        "LR Ids": (c.lrIds || []).join(", "),
      })),
    ),
    "Challans",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      payments.map((p) => ({
        "Txn Date": p.transactionDate,
        "Challan No": p.challanNo,
        Date: p.date,
        Broker: p.broker,
        Vehicle: p.vehNo,
        Outstanding: p.outstanding,
        Paid: p.paidAmt,
        Deduction: p.deduction,
        Balance: p.balance,
        Narration: p.narration,
      })),
    ),
    "LHP Payments",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      bills.map((b) => ({
        "Bill No": b.billNo,
        Date: b.billDate,
        Party: b.partyName,
        Amount: b.totalAmount,
        Remark: b.remark,
        Submission: b.submissionDate,
        "LR Ids": (b.lrIds || []).join(", "),
      })),
    ),
    "Bills",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      receipts.map((r) => ({
        "MR No": r.mrNo,
        "Txn Date": r.transactionDate,
        "Bill No": r.billNo,
        Party: r.partyName,
        Outstanding: r.outstanding,
        Paid: r.paidAmt,
        Deduction: r.deduction,
        Balance: r.balance,
        Narration: r.narration,
      })),
    ),
    "Money Receipts",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      notes.map((n) => ({
        Type: n.type,
        "Voucher No": n.voucherNo,
        Date: n.date,
        Party: n.partyName,
        Amount: n.amount,
        Narration: n.narration,
      })),
    ),
    "Notes",
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet([
      { Category: "Stations", Values: (masters.stations || []).join(", ") },
      { Category: "Vehicles", Values: (masters.vehicles || []).join(", ") },
      { Category: "Brokers", Values: (masters.brokers || []).join(", ") },
      { Category: "Particulars", Values: (masters.particulars || []).join(", ") },
      { Category: "Party Types", Values: (masters.partyTypes || []).join(", ") },
      { Category: "GST Paid By", Values: (masters.gstPaidBy || []).join(", ") },
      { Category: "LR Types", Values: (masters.lrTypes || []).join(", ") },
    ]),
    "Masters",
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  const filename = `SHYAM_LOGISTIC_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
