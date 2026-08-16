import { NextResponse } from "next/server";
import { requireAuth, ok } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getMoneyReceipts,
  getNotes,
  getParties,
} from "@/lib/tbs/store";
import { lrCountsAsBilled, normalizeLrType } from "@/lib/tbs/lrType";

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "booking";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const party = searchParams.get("party") || "";

  const [parties, bookings, bills, receipts, challans, notes] = await Promise.all([
    getParties(),
    getBookings(),
    getBills(),
    getMoneyReceipts(),
    getChallans(),
    getNotes(),
  ]);

  const inRange = (date: string) => {
    if (!date) return true;
    if (from && date < from) return false;
    if (to && date > to) return false;
    return true;
  };

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

    let rows = bookings.filter((b) => inRange(b.lrDate));
    if (party) rows = rows.filter((b) => b.billingParty === party);
    const statusFilter = searchParams.get("status") || "";

    const mapped = rows.map((b, i) => {
      const billed = lrCountsAsBilled(b.lrType, billByLr.has(b.id));
      const delivered = Boolean(b.delivered);
      let status: "not_delivered_not_billed" | "billed_not_delivered" | "delivered_not_billed" | "delivered_billed";
      if (!delivered && !billed) status = "not_delivered_not_billed";
      else if (!delivered && billed) status = "billed_not_delivered";
      else if (delivered && !billed) status = "delivered_not_billed";
      else status = "delivered_billed";

      return {
        sr: i + 1,
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

    const filtered = statusFilter
      ? mapped.filter((r) => r.status === statusFilter)
      : mapped;

    // re-number after filter
    const finalRows = filtered.map((r, i) => ({ ...r, sr: i + 1 }));

    return ok({
      kind,
      parties: parties.map((p) => p.partyName),
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
    });
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
        if (!inRange(b.billDate)) return false;
        return true;
      })
      .map((b) => {
        const paid = paidByBill.get(b.billNo) || 0;
        const outstanding = Math.max(0, Number(b.totalAmount) - paid);
        const billDate = new Date(b.billDate);
        const days = Number.isFinite(billDate.getTime())
          ? Math.max(0, Math.floor((today.getTime() - billDate.getTime()) / 86400000))
          : 0;
        let age = "0-30";
        if (days > 90) age = "Above 90";
        else if (days > 60) age = "61-90";
        else if (days > 30) age = "31-60";
        return {
          id: b.id,
          billNo: b.billNo,
          date: b.billDate,
          party: b.partyName,
          billAmt: Number(b.totalAmount),
          paid,
          outstanding,
          days,
          age,
        };
      })
      .filter((r) => r.outstanding > 0);

    if (kind === "dayswise") {
      const asOfParam = searchParams.get("asOf") || today.toISOString().slice(0, 10);
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
            ? Math.max(
                0,
                Math.floor((asOfTime - billDate.getTime()) / 86400000),
              )
            : 0;
          const linked = (b.lrIds || [])
            .map((id) => bookingById.get(id))
            .filter(Boolean);
          const cnsNo = linked.map((x) => x!.lrNo).filter(Boolean).join(", ");
          const cnsDate = linked[0]?.lrDate || "";
          return {
            id: b.id,
            billDate: b.billDate,
            party: b.partyName,
            cnsDate,
            cnsNo,
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

      return ok({
        kind: "dayswise",
        asOf: asOfISO,
        parties: parties.map((p) => p.partyName),
        rows: dayRows,
        totals: {
          d0to30: dayRows.reduce((s, r) => s + r.d0to30, 0),
          d31to60: dayRows.reduce((s, r) => s + r.d31to60, 0),
          d61to90: dayRows.reduce((s, r) => s + r.d61to90, 0),
          d91above: dayRows.reduce((s, r) => s + r.d91above, 0),
          outstanding: dayRows.reduce((s, r) => s + r.outstanding, 0),
        },
      });
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
      return ok({
        kind,
        parties: parties.map((p) => p.partyName),
        rows: partyRows,
        totals: {
          outstanding: partyRows.reduce((s, r) => s + r.outstanding, 0),
          billAmt: partyRows.reduce((s, r) => s + r.billAmt, 0),
          paid: partyRows.reduce((s, r) => s + r.paid, 0),
        },
      });
    }

    return ok({
      kind: kind === "outstanding-partywise" ? "billingwise" : kind,
      parties: parties.map((p) => p.partyName),
      rows,
      totals: {
        outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
        billAmt: rows.reduce((s, r) => s + r.billAmt, 0),
        paid: rows.reduce((s, r) => s + r.paid, 0),
      },
    });
  }

  if (kind === "ledger") {
    const name = party || parties[0]?.partyName || "";
    const billRows = bills
      .filter((b) => b.partyName === name && inRange(b.billDate))
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
      .filter((r) => r.partyName === name && inRange(r.transactionDate || r.date))
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
      .filter((n) => n.partyName === name && inRange(n.date) && (n.type === "debit" || n.type === "credit"))
      .map((n) => ({
        id: n.id,
        date: n.date,
        docNo: n.voucherNo,
        type: n.type === "debit" ? "Debit Note" : "Credit Note",
        debit: n.type === "debit" ? Number(n.amount || 0) : 0,
        credit: n.type === "credit" ? Number(n.amount || 0) : 0,
        narr: n.narration || "",
      }));
    const lines = [...billRows, ...mrRows, ...noteRows].sort((a, b) => a.date.localeCompare(b.date));
    let bal = 0;
    const rows = lines.map((l, i) => {
      bal += l.debit - l.credit;
      return { sr: i + 1, ...l, balance: bal };
    });
    return ok({
      kind,
      party: name,
      parties: parties.map((p) => p.partyName),
      rows,
      totals: {
        debit: rows.reduce((s, r) => s + r.debit, 0),
        credit: rows.reduce((s, r) => s + r.credit, 0),
        balance: bal,
      },
    });
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

    let rows = bookings.filter((b) => inRange(b.lrDate));
    if (party) rows = rows.filter((b) => b.billingParty === party);

    const mapped = rows.map((b, i) => {
      const gstAmt = Number(b.gstAmt) || 0;
      const beforeTax =
        Number(b.total) ||
        Math.max(0, Number(b.grandTotal || b.freight || 0) - gstAmt);
      const rateMatch = String(b.gstLabel || "").match(/(\d+(?:\.\d+)?)\s*%/);
      const rate = rateMatch ? Number(rateMatch[1]) : gstAmt && beforeTax
        ? Math.round((gstAmt / beforeTax) * 1000) / 10
        : 0;
      // Local Maharashtra-style split: CGST + SGST; IGST left blank
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
        startDate: pInfo?.accountStartFrom || "",
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
        gstPaidBy: b.gstPaidBy,
        eway: b.ewayBillNo,
        id: b.id,
      };
    });

    return ok({
      kind,
      parties: parties.map((p) => p.partyName),
      rows: mapped,
      totals: {
        beforeTax: mapped.reduce((s, r) => s + r.beforeTax, 0),
        cgstAmt: mapped.reduce((s, r) => s + r.cgstAmt, 0),
        sgstAmt: mapped.reduce((s, r) => s + r.sgstAmt, 0),
        igstAmt: mapped.reduce((s, r) => s + r.igstAmt, 0),
        count: mapped.length,
      },
    });
  }

  if (kind === "profit") {
    const bookingById = new Map(bookings.map((b) => [b.id, b]));
    const usedBookingIds = new Set<string>();
    const vehKey = (v: string) => String(v || "").replace(/\s+/g, "").toUpperCase();
    const bookingAmtOf = (b: (typeof bookings)[number]) =>
      Number(b.grandTotal || b.total || b.freight || 0);
    const marginOf = (difference: number, bookingAmt: number) =>
      bookingAmt > 0 ? Math.round((difference / bookingAmt) * 10000) / 100 : 0;

    const rows: {
      id: string;
      vehNo: string;
      date: string;
      freight: number;
      bookingAmt: number;
      difference: number;
      marginPct: number;
    }[] = [];

    for (const c of challans.filter((x) => inRange(x.challanDate))) {
      let linked = (c.lrIds || [])
        .map((id) => bookingById.get(id))
        .filter((b): b is NonNullable<typeof b> => Boolean(b));
      if (linked.length === 0) {
        const key = vehKey(c.vehicleNo);
        linked = bookings.filter(
          (b) =>
            !usedBookingIds.has(b.id) &&
            key &&
            vehKey(b.vehicleNo) === key &&
            b.lrDate === c.challanDate,
        );
      }
      for (const b of linked) usedBookingIds.add(b.id);

      const freight = Number(c.freight || 0);
      const bookingAmt = linked.reduce((s, b) => s + bookingAmtOf(b), 0);
      const difference = bookingAmt - freight;
      rows.push({
        id: c.id,
        vehNo: c.vehicleNo || linked[0]?.vehicleNo || "",
        date: c.challanDate,
        freight,
        bookingAmt,
        difference,
        marginPct: marginOf(difference, bookingAmt),
      });
    }

    for (const b of bookings) {
      if (!inRange(b.lrDate) || usedBookingIds.has(b.id)) continue;
      const freight = 0;
      const bookingAmt = bookingAmtOf(b);
      const difference = bookingAmt - freight;
      rows.push({
        id: b.id,
        vehNo: b.vehicleNo || "",
        date: b.lrDate,
        freight,
        bookingAmt,
        difference,
        marginPct: marginOf(difference, bookingAmt),
      });
    }

    rows.sort((a, b) => a.date.localeCompare(b.date) || a.vehNo.localeCompare(b.vehNo));
    const numbered = rows.map((r, i) => ({ sr: i + 1, ...r }));

    return ok({
      kind,
      rows: numbered,
      totals: {
        freight: numbered.reduce((s, r) => s + r.freight, 0),
        bookingAmt: numbered.reduce((s, r) => s + r.bookingAmt, 0),
        difference: numbered.reduce((s, r) => s + r.difference, 0),
      },
    });
  }

  return NextResponse.json({ error: "Unknown report kind" }, { status: 400 });
}
