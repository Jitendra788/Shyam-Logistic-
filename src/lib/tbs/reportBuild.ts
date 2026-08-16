import { lrCountsAsBilled, normalizeLrType } from "@/lib/tbs/lrType";
import { buildProfitReport } from "@/lib/tbs/profitReport";
import type {
  Bill,
  Booking,
  Challan,
  MoneyReceipt,
  NoteVoucher,
  Party,
} from "@/lib/tbs/types";

export type ReportCollections = {
  parties: Party[];
  bookings: Booking[];
  bills: Bill[];
  receipts: MoneyReceipt[];
  challans: Challan[];
  notes: NoteVoucher[];
};

export type ReportQuery = {
  from?: string;
  to?: string;
  party?: string;
  asOf?: string;
  status?: string;
};

function inRange(date: string, from: string, to: string) {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function partyNames(parties: Party[], extra: string[] = []) {
  const set = new Set(parties.map((p) => p.partyName).filter(Boolean));
  for (const n of extra) if (n) set.add(n);
  return Array.from(set);
}

export function buildTbsReport(
  kind: string,
  cols: ReportCollections,
  q: ReportQuery = {},
): Record<string, unknown> | null {
  const from = q.from || "";
  const to = q.to || "";
  const party = q.party || "";
  const { parties, bookings, bills, receipts, challans, notes } = cols;

  if (kind === "booking") {
    const billByLr = new Map<string, string>();
    for (const bill of bills) {
      for (const lrId of bill.lrIds || []) {
        billByLr.set(lrId, bill.billNo);
      }
    }
    const challanByLr = new Map<string, string>();
    for (const c of challans) {
      for (const lrId of c.lrIds || []) {
        challanByLr.set(lrId, c.challanNo);
      }
    }
    const mapped = bookings
      .filter((b) => inRange(b.lrDate, from, to))
      .filter((b) => !party || b.billingParty === party)
      .map((b) => {
        const billed = lrCountsAsBilled(b.lrType, billByLr.has(b.id));
        const delivered = Boolean(b.delivered);
        let status:
          | "not_delivered_not_billed"
          | "billed_not_delivered"
          | "delivered_not_billed"
          | "delivered_billed";
        if (!delivered && !billed) status = "not_delivered_not_billed";
        else if (!delivered && billed) status = "billed_not_delivered";
        else if (delivered && !billed) status = "delivered_not_billed";
        else status = "delivered_billed";
        return {
          sr: 0,
          lrNo: b.lrNo,
          lrDate: b.lrDate,
          party: b.billingParty,
          from: b.from,
          to: b.to,
          particulars: b.particulars,
          weight: b.chargedWt || b.actualWt,
          freight: b.freight,
          total: b.grandTotal || b.total,
          lrType: b.lrType,
          billNo:
            billByLr.get(b.id) ||
            (normalizeLrType(b.lrType) === "Paid"
              ? "PAID"
              : normalizeLrType(b.lrType) === "Cancel"
                ? "CANCEL"
                : ""),
          challanNo: challanByLr.get(b.id) || "",
          delivered,
          billed,
          status,
          id: b.id,
        };
      });
    const filtered = q.status ? mapped.filter((r) => r.status === q.status) : mapped;
    const finalRows = filtered.map((r, i) => ({ ...r, sr: i + 1 }));
    return {
      kind,
      parties: partyNames(
        parties,
        bookings.map((b) => b.billingParty),
      ),
      rows: finalRows,
      counts: {
        not_delivered_not_billed: mapped.filter((r) => r.status === "not_delivered_not_billed").length,
        billed_not_delivered: mapped.filter((r) => r.status === "billed_not_delivered").length,
        delivered_not_billed: mapped.filter((r) => r.status === "delivered_not_billed").length,
        delivered_billed: mapped.filter((r) => r.status === "delivered_billed").length,
      },
      totals: {
        freight: finalRows.reduce((s, b) => s + Number(b.freight || 0), 0),
        count: finalRows.length,
      },
    };
  }

  if (
    kind === "outstanding" ||
    kind === "billingwise" ||
    kind === "dayswise" ||
    kind === "outstanding-partywise"
  ) {
    const paidByBill = new Map<string, number>();
    for (const r of receipts) {
      paidByBill.set(
        r.billNo,
        (paidByBill.get(r.billNo) || 0) + Number(r.paidAmt || 0) + Number(r.deduction || 0),
      );
    }
    const today = new Date();
    const billRows = bills
      .filter((b) => {
        if (party && b.partyName !== party) return false;
        if (kind !== "dayswise" && !inRange(b.billDate, from, to)) return false;
        return true;
      })
      .map((b) => {
        const paid = paidByBill.get(b.billNo) || 0;
        const outstanding = Math.max(0, Number(b.totalAmount) - paid);
        const billDate = new Date(b.billDate);
        const days = Number.isFinite(billDate.getTime())
          ? Math.max(0, Math.floor((today.getTime() - billDate.getTime()) / 86400000))
          : 0;
        return {
          id: b.id,
          billNo: b.billNo,
          date: b.billDate,
          party: b.partyName,
          billAmt: Number(b.totalAmount),
          paid,
          outstanding,
          days,
        };
      })
      .filter((r) => r.outstanding > 0);

    if (kind === "dayswise") {
      const asOfParam = q.asOf || today.toISOString().slice(0, 10);
      const asOf = new Date(asOfParam);
      const asOfTime = Number.isFinite(asOf.getTime()) ? asOf.getTime() : today.getTime();
      const asOfISO = Number.isFinite(asOf.getTime())
        ? asOf.toISOString().slice(0, 10)
        : today.toISOString().slice(0, 10);
      const bookingById = new Map(bookings.map((b) => [b.id, b]));
      const dayRows = bills
        .filter((b) => {
          if (party && b.partyName !== party) return false;
          if (b.billDate && b.billDate > asOfISO) return false;
          return true;
        })
        .map((b) => {
          const paid = paidByBill.get(b.billNo) || 0;
          const outstanding = Math.max(0, Number(b.totalAmount) - paid);
          const billDate = new Date(b.billDate);
          const days = Number.isFinite(billDate.getTime())
            ? Math.max(0, Math.floor((asOfTime - billDate.getTime()) / 86400000))
            : 0;
          const linked = (b.lrIds || [])
            .map((id) => bookingById.get(id))
            .filter(Boolean) as Booking[];
          return {
            id: b.id,
            billDate: b.billDate,
            party: b.partyName,
            cnsDate: linked[0]?.lrDate || "",
            cnsNo: linked.map((x) => x.lrNo).filter(Boolean).join(", "),
            d0to30: days <= 30 ? outstanding : 0,
            d31to60: days > 30 && days <= 60 ? outstanding : 0,
            d61to90: days > 60 && days <= 90 ? outstanding : 0,
            d91above: days > 90 ? outstanding : 0,
            subDate: b.submissionDate || "",
            billNo: b.billNo,
            outstanding,
            days,
          };
        })
        .filter((r) => r.outstanding > 0)
        .sort((a, b) => b.days - a.days || a.party.localeCompare(b.party))
        .map((r, i) => ({ sr: i + 1, ...r }));
      return {
        kind: "dayswise",
        asOf: asOfISO,
        parties: partyNames(parties, bills.map((b) => b.partyName)),
        rows: dayRows,
        totals: {
          d0to30: dayRows.reduce((s, r) => s + r.d0to30, 0),
          d31to60: dayRows.reduce((s, r) => s + r.d31to60, 0),
          d61to90: dayRows.reduce((s, r) => s + r.d61to90, 0),
          d91above: dayRows.reduce((s, r) => s + r.d91above, 0),
          outstanding: dayRows.reduce((s, r) => s + r.outstanding, 0),
        },
      };
    }

    billRows.sort((a, b) => a.party.localeCompare(b.party) || a.billNo.localeCompare(b.billNo));
    const rows = billRows.map((r, i) => ({ sr: i + 1, ...r }));

    if (kind === "outstanding") {
      const creditBy = new Map<string, number>();
      const debitBy = new Map<string, number>();
      for (const n of notes) {
        const name = n.partyName || "";
        if (!name) continue;
        if (n.type === "credit") {
          creditBy.set(name, (creditBy.get(name) || 0) + Number(n.amount || 0));
        }
        if (n.type === "debit") {
          debitBy.set(name, (debitBy.get(name) || 0) + Number(n.amount || 0));
        }
      }
      const byParty = new Map<
        string,
        { party: string; billAmt: number; paid: number; outstanding: number; bills: number }
      >();
      for (const r of billRows) {
        const cur = byParty.get(r.party) || {
          party: r.party,
          billAmt: 0,
          paid: 0,
          outstanding: 0,
          bills: 0,
        };
        cur.billAmt += r.billAmt;
        cur.paid += r.paid;
        cur.outstanding += r.outstanding;
        cur.bills += 1;
        byParty.set(r.party, cur);
      }
      for (const [name, amt] of creditBy) {
        const cur = byParty.get(name) || {
          party: name,
          billAmt: 0,
          paid: 0,
          outstanding: 0,
          bills: 0,
        };
        cur.outstanding = Math.max(0, cur.outstanding - amt);
        byParty.set(name, cur);
      }
      for (const [name, amt] of debitBy) {
        const cur = byParty.get(name) || {
          party: name,
          billAmt: 0,
          paid: 0,
          outstanding: 0,
          bills: 0,
        };
        cur.outstanding += amt;
        byParty.set(name, cur);
      }
      const partyRows = [...byParty.values()]
        .sort((a, b) => b.outstanding - a.outstanding)
        .map((r, i) => ({ sr: i + 1, ...r }));
      return {
        kind,
        parties: partyNames(parties, bills.map((b) => b.partyName)),
        rows: partyRows,
        totals: {
          outstanding: partyRows.reduce((s, r) => s + r.outstanding, 0),
          billAmt: partyRows.reduce((s, r) => s + r.billAmt, 0),
          paid: partyRows.reduce((s, r) => s + r.paid, 0),
        },
      };
    }

    return {
      kind: kind === "outstanding-partywise" ? "billingwise" : kind,
      parties: partyNames(parties, bills.map((b) => b.partyName)),
      rows,
      totals: {
        outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
        billAmt: rows.reduce((s, r) => s + r.billAmt, 0),
        paid: rows.reduce((s, r) => s + r.paid, 0),
      },
    };
  }

  if (kind === "ledger") {
    const name = party || parties[0]?.partyName || bills[0]?.partyName || "";
    const billRows = bills
      .filter((b) => b.partyName === name && inRange(b.billDate, from, to))
      .map((b) => ({
        id: b.id,
        date: b.billDate,
        docNo: b.billNo,
        type: "Bill",
        debit: Number(b.totalAmount),
        credit: 0,
        narr: b.remark || "Transport Bill",
      }));
    const mrRows = receipts
      .filter((r) => r.partyName === name && inRange(r.transactionDate || r.date, from, to))
      .map((r) => ({
        id: r.id,
        date: r.transactionDate || r.date,
        docNo: r.mrNo,
        type: "MR",
        debit: 0,
        credit: Number(r.paidAmt) + Number(r.deduction),
        narr: r.narration || `Against Bill ${r.billNo}`,
      }));
    const noteRows = notes
      .filter(
        (n) =>
          n.partyName === name &&
          inRange(n.date, from, to) &&
          (n.type === "debit" || n.type === "credit"),
      )
      .map((n) => ({
        id: n.id,
        date: n.date,
        docNo: n.voucherNo,
        type: n.type === "debit" ? "Debit Note" : "Credit Note",
        debit: n.type === "debit" ? Number(n.amount || 0) : 0,
        credit: n.type === "credit" ? Number(n.amount || 0) : 0,
        narr: n.narration || "",
      }));
    const lines = [...billRows, ...mrRows, ...noteRows].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    let bal = 0;
    const rows = lines.map((l, i) => {
      bal += l.debit - l.credit;
      return { sr: i + 1, ...l, balance: bal };
    });
    return {
      kind,
      party: name,
      parties: partyNames(parties, bills.map((b) => b.partyName)),
      rows,
      totals: {
        debit: rows.reduce((s, r) => s + r.debit, 0),
        credit: rows.reduce((s, r) => s + r.credit, 0),
        balance: bal,
      },
    };
  }

  if (kind === "gst") {
    const billByLr = new Map<string, string>();
    for (const bill of bills) {
      for (const lrId of bill.lrIds || []) {
        if (!billByLr.has(lrId)) billByLr.set(lrId, bill.billNo);
      }
    }
    const challanByLr = new Map<string, string>();
    for (const c of challans) {
      for (const lrId of c.lrIds || []) {
        if (!challanByLr.has(lrId)) challanByLr.set(lrId, c.challanNo);
      }
    }
    const partyByName = new Map(
      parties.map((p) => [p.partyName.trim().toLowerCase(), p] as const),
    );
    const mapped = bookings
      .filter((b) => inRange(b.lrDate, from, to))
      .filter((b) => !party || b.billingParty === party)
      .map((b, i) => {
        const gstAmt = Number(b.gstAmt) || 0;
        const beforeTax =
          Number(b.total) ||
          Math.max(0, Number(b.grandTotal || b.freight || 0) - gstAmt);
        const rateMatch = String(b.gstLabel || "").match(/(\d+(?:\.\d+)?)\s*%/);
        const rate = rateMatch
          ? Number(rateMatch[1])
          : gstAmt && beforeTax
            ? Math.round((gstAmt / beforeTax) * 1000) / 10
            : 0;
        const halfPct = rate ? rate / 2 : 0;
        const halfAmt = gstAmt ? Math.round((gstAmt / 2) * 100) / 100 : 0;
        const pInfo =
          partyByName.get(b.billingParty.trim().toLowerCase()) ||
          partyByName.get(b.consignor.trim().toLowerCase());
        return {
          sr: i + 1,
          date: b.lrDate,
          party: b.billingParty,
          partyCode: pInfo?.partyCode || "",
          panNo: pInfo?.panNo || "",
          gstNo: b.gstNo || pInfo?.gstTin || "",
          billNo: billByLr.get(b.id) || "",
          challanNo: challanByLr.get(b.id) || "",
          from: b.from || b.bookingFrom || "",
          to: b.to || "",
          lrNo: b.lrNo,
          beforeTax,
          cgstPct: halfPct,
          cgstAmt: halfAmt,
          sgstPct: halfPct,
          sgstAmt: halfAmt,
          igstPct: 0,
          igstAmt: 0,
          id: b.id,
        };
      });
    return {
      kind,
      parties: partyNames(
        parties,
        bookings.map((b) => b.billingParty),
      ),
      rows: mapped,
      totals: {
        beforeTax: mapped.reduce((s, r) => s + r.beforeTax, 0),
        cgstAmt: mapped.reduce((s, r) => s + r.cgstAmt, 0),
        sgstAmt: mapped.reduce((s, r) => s + r.sgstAmt, 0),
        igstAmt: mapped.reduce((s, r) => s + r.igstAmt, 0),
        count: mapped.length,
      },
    };
  }

  if (kind === "profit") {
    const built = buildProfitReport(challans, bookings, notes, from, to);
    return { kind: "profit", ...built };
  }

  return null;
}
