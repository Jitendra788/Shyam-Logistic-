import { NextResponse } from "next/server";
import { requireAuth, ok } from "@/lib/tbs/api";
import {
  getBills,
  getBookings,
  getChallans,
  getLhpPayments,
  getMoneyReceipts,
  getParties,
} from "@/lib/tbs/store";

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "booking";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const party = searchParams.get("party") || "";

  const [parties, bookings, bills, receipts, challans, lhp] = await Promise.all([
    getParties(),
    getBookings(),
    getBills(),
    getMoneyReceipts(),
    getChallans(),
    getLhpPayments(),
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
      const billed = billByLr.has(b.id);
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
        billNo: billByLr.get(b.id) || "",
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
      billRows.sort((a, b) => b.days - a.days || a.party.localeCompare(b.party));
    } else {
      billRows.sort((a, b) => a.party.localeCompare(b.party) || a.billNo.localeCompare(b.billNo));
    }

    const rows = billRows.map((r, i) => ({ sr: i + 1, ...r }));

    if (kind === "outstanding") {
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
    const lines = [...billRows, ...mrRows].sort((a, b) => a.date.localeCompare(b.date));
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
    let rows = bookings.filter((b) => inRange(b.lrDate));
    if (party) rows = rows.filter((b) => b.billingParty === party);
    const mapped = rows.map((b, i) => {
      const taxable = Number(b.grandTotal || b.total || b.freight || 0);
      // approx GST split if not stored — show taxable & paid-by
      return {
        sr: i + 1,
        lrNo: b.lrNo,
        date: b.lrDate,
        party: b.billingParty,
        gstNo: b.gstNo,
        taxable,
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
        taxable: mapped.reduce((s, r) => s + r.taxable, 0),
        count: mapped.length,
      },
    });
  }

  if (kind === "profit") {
    const bookingFreight = bookings
      .filter((b) => inRange(b.lrDate))
      .reduce((s, b) => s + Number(b.grandTotal || b.total || b.freight || 0), 0);
    const billAmt = bills
      .filter((b) => inRange(b.billDate))
      .reduce((s, b) => s + Number(b.totalAmount || 0), 0);
    const hirePaid = lhp
      .filter((p) => inRange(p.transactionDate))
      .reduce((s, p) => s + Number(p.paidAmt || 0) + Number(p.deduction || 0), 0);
    const challanHire = challans
      .filter((c) => inRange(c.challanDate))
      .reduce((s, c) => s + Number(c.freight || 0), 0);
    const income = billAmt || bookingFreight;
    const expense = hirePaid || challanHire;
    return ok({
      kind,
      parties: parties.map((p) => p.partyName),
      rows: [
        { label: "Booking / Freight Income", amount: bookingFreight },
        { label: "Bill Amount (Party)", amount: billAmt },
        { label: "Lorry Hire (Challan Freight)", amount: challanHire },
        { label: "Lorry Hire Payments (LHP)", amount: hirePaid },
        { label: "Gross Profit (Income - Hire)", amount: income - expense },
      ],
      totals: { income, expense, profit: income - expense },
    });
  }

  return NextResponse.json({ error: "Unknown report kind" }, { status: 400 });
}
