import * as XLSX from "xlsx";

/** Download a real Excel .xlsx file (opens correctly in Microsoft Excel). */
export function downloadAsExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const aoa = [headers, ...rows.map((r) => r.map((c) => (c == null ? "" : c)))];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const outName = filename.toLowerCase().endsWith(".xlsx")
    ? filename
    : `${filename.replace(/\.xls$/i, "")}.xlsx`;
  XLSX.writeFile(wb, outName);
}

function sheetFromRows(
  wb: XLSX.WorkBook,
  name: string,
  rows: Record<string, unknown>[],
) {
  const ws =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([["(no records)"]]);
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
}

function workbookFromLegacyJson(data: {
  parties?: Record<string, unknown>[];
  bookings?: Record<string, unknown>[];
  challans?: Record<string, unknown>[];
  payments?: Record<string, unknown>[];
  bills?: Record<string, unknown>[];
  receipts?: Record<string, unknown>[];
  notes?: Record<string, unknown>[];
  masters?: Record<string, string[]>;
}) {
  const wb = XLSX.utils.book_new();
  const parties = data.parties || [];
  const bookings = data.bookings || [];
  const challans = data.challans || [];
  const payments = data.payments || [];
  const bills = data.bills || [];
  const receipts = data.receipts || [];
  const notes = data.notes || [];
  const masters = data.masters || {};

  sheetFromRows(
    wb,
    "Parties",
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
  );
  sheetFromRows(
    wb,
    "Bookings",
    bookings.map((b) => ({
      "LR No": b.lrNo,
      "LR Date": b.lrDate,
      "Billing Party": b.billingParty,
      "Receiver Email": b.receiverEmail,
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
  );
  sheetFromRows(
    wb,
    "Challans",
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
      "LR Ids": Array.isArray(c.lrIds) ? (c.lrIds as string[]).join(", ") : "",
    })),
  );
  sheetFromRows(
    wb,
    "LHP Payments",
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
  );
  sheetFromRows(
    wb,
    "Bills",
    bills.map((b) => ({
      "Bill No": b.billNo,
      Date: b.billDate,
      Party: b.partyName,
      "Receiver Email": b.receiverEmail,
      Amount: b.totalAmount,
      Remark: b.remark,
      Submission: b.submissionDate,
      "LR Ids": Array.isArray(b.lrIds) ? (b.lrIds as string[]).join(", ") : "",
    })),
  );
  sheetFromRows(
    wb,
    "Money Receipts",
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
  );
  sheetFromRows(
    wb,
    "Notes",
    notes.map((n) => ({
      Type: n.type,
      "Voucher No": n.voucherNo,
      Date: n.date,
      Party: n.partyName,
      Amount: n.amount,
      Narration: n.narration,
    })),
  );
  sheetFromRows(wb, "Masters", [
    { Category: "Stations", Values: (masters.stations || []).join(", ") },
    { Category: "Vehicles", Values: (masters.vehicles || []).join(", ") },
    { Category: "Brokers", Values: (masters.brokers || []).join(", ") },
    { Category: "Particulars", Values: (masters.particulars || []).join(", ") },
    { Category: "Party Types", Values: (masters.partyTypes || []).join(", ") },
    { Category: "GST Paid By", Values: (masters.gstPaidBy || []).join(", ") },
    { Category: "LR Types", Values: (masters.lrTypes || []).join(", ") },
  ]);
  return wb;
}

/**
 * Downloads full TBS backup as real Excel .xlsx (never as JSON).
 * Uses /api/tbs/backup; if a stale JSON response ever appears, converts it.
 */
export async function downloadExcelBackup(): Promise<void> {
  const res = await fetch(`/api/tbs/backup?t=${Date.now()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Backup failed");

  const buf = await res.arrayBuffer();
  const u8 = new Uint8Array(buf);
  const filename = `SHYAM_LOGISTIC_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`;

  // Real xlsx is a ZIP → starts with "PK"
  if (u8.length >= 2 && u8[0] === 0x50 && u8[1] === 0x4b) {
    const wb = XLSX.read(buf, { type: "array" });
    XLSX.writeFile(wb, filename);
    return;
  }

  // Legacy / mistaken JSON backup → convert to Excel in browser
  const text = new TextDecoder().decode(u8).trim();
  if (text.startsWith("{")) {
    const data = JSON.parse(text) as Parameters<typeof workbookFromLegacyJson>[0];
    XLSX.writeFile(workbookFromLegacyJson(data), filename);
    return;
  }

  throw new Error("Unexpected backup format");
}
