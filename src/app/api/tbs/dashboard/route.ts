import { requireAuth, ok } from "@/lib/tbs/api";
import { getEnquiries } from "@/lib/store";
import {
  getBills,
  getBookings,
  getChallans,
  getLhpPayments,
  getMoneyReceipts,
  getNotes,
  getParties,
} from "@/lib/tbs/store";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const [
      parties,
      bookings,
      bills,
      receipts,
      challans,
      lhp,
      notes,
      enquiries,
    ] = await Promise.all([
      getParties(),
      getBookings(),
      getBills(),
      getMoneyReceipts(),
      getChallans(),
      getLhpPayments(),
      getNotes(),
      getEnquiries().catch(() => []),
    ]);

  const billedLrIds = new Set<string>();
  for (const bill of bills) {
    for (const id of bill.lrIds || []) billedLrIds.add(id);
  }

  let notDeliveredNotBilled = 0;
  let billedNotDelivered = 0;
  let deliveredNotBilled = 0;
  let deliveredBilled = 0;
  let pendingDelivery = 0;
  let pendingBill = 0;
  let freightTotal = 0;

  for (const b of bookings) {
    const billed = billedLrIds.has(b.id);
    const delivered = Boolean(b.delivered);
    freightTotal += Number(b.grandTotal || b.total || b.freight || 0);
    if (!delivered) pendingDelivery += 1;
    if (!billed) pendingBill += 1;
    if (!delivered && !billed) notDeliveredNotBilled += 1;
    else if (!delivered && billed) billedNotDelivered += 1;
    else if (delivered && !billed) deliveredNotBilled += 1;
    else deliveredBilled += 1;
  }

  const paidByBill = new Map<string, number>();
  for (const r of receipts) {
    paidByBill.set(
      r.billNo,
      (paidByBill.get(r.billNo) || 0) +
        Number(r.paidAmt || 0) +
        Number(r.deduction || 0),
    );
  }

  let outstandingAmt = 0;
  let outstandingBills = 0;
  const outstandingTop: { party: string; billNo: string; amount: number }[] =
    [];

  for (const b of bills) {
    const paid = paidByBill.get(b.billNo) || 0;
    const due = Math.max(0, Number(b.totalAmount) - paid);
    if (due > 0) {
      outstandingAmt += due;
      outstandingBills += 1;
      outstandingTop.push({
        party: b.partyName,
        billNo: b.billNo,
        amount: due,
      });
    }
  }
  outstandingTop.sort((a, b) => b.amount - a.amount);

  const paidByChallan = new Map<string, number>();
  for (const p of lhp) {
    paidByChallan.set(
      p.challanNo,
      (paidByChallan.get(p.challanNo) || 0) +
        Number(p.paidAmt || 0) +
        Number(p.deduction || 0),
    );
  }

  let pendingHireAmt = 0;
  let pendingHireCount = 0;
  for (const c of challans) {
    const paid = paidByChallan.get(c.challanNo) || 0;
    const hireDue = Math.max(0, Number(c.balance || 0) - paid);
    if (hireDue > 0.5) {
      pendingHireAmt += hireDue;
      pendingHireCount += 1;
    }
  }

  const billAmt = bills.reduce((s, b) => s + Number(b.totalAmount || 0), 0);
  const hirePaid = lhp.reduce(
    (s, p) => s + Number(p.paidAmt || 0) + Number(p.deduction || 0),
    0,
  );
  const challanHire = challans.reduce(
    (s, c) => s + Number(c.freight || 0),
    0,
  );
  const expenseNotes = notes
    .filter((n) => n.type === "expense")
    .reduce((s, n) => s + Number(n.amount || 0), 0);

  const income = billAmt || freightTotal;
  const hireCost = hirePaid > 0 ? hirePaid : challanHire;
  const expense = hireCost + expenseNotes;
  const profit = income - expense;

  const collected = receipts.reduce((s, r) => s + Number(r.paidAmt || 0), 0);
  const newEnquiries = enquiries.filter((e) => e.status === "new").length;
  const closedEnquiries = enquiries.filter(
    (e) => e.status === "closed" || e.status === "contacted",
  ).length;

  let billsPaid = 0;
  let billsPaidAmt = 0;
  for (const b of bills) {
    const paid = paidByBill.get(b.billNo) || 0;
    const due = Math.max(0, Number(b.totalAmount) - paid);
    if (due <= 0.5 && Number(b.totalAmount) > 0) {
      billsPaid += 1;
      billsPaidAmt += Number(b.totalAmount);
    }
  }

  const hireDoneCount = challans.length - pendingHireCount;
  const pendingLrTotal =
    notDeliveredNotBilled + billedNotDelivered + deliveredNotBilled;

  const recentBookings = [...bookings]
    .sort((a, b) => String(b.lrDate).localeCompare(String(a.lrDate)))
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      lrNo: b.lrNo,
      lrDate: b.lrDate,
      party: b.billingParty,
      from: b.from,
      to: b.to,
      amount: Number(b.grandTotal || b.total || b.freight || 0),
      delivered: Boolean(b.delivered),
      billed: billedLrIds.has(b.id),
    }));

  const pendingList = recentBookings.filter((b) => !(b.delivered && b.billed));
  const completedList = [...bookings]
    .filter((b) => Boolean(b.delivered) && billedLrIds.has(b.id))
    .sort((a, b) => String(b.lrDate).localeCompare(String(a.lrDate)))
    .slice(0, 6)
    .map((b) => ({
      id: b.id,
      lrNo: b.lrNo,
      lrDate: b.lrDate,
      party: b.billingParty,
      from: b.from,
      to: b.to,
      amount: Number(b.grandTotal || b.total || b.freight || 0),
      delivered: true,
      billed: true,
    }));

  return ok({
    counts: {
      parties: parties.length,
      bookings: bookings.length,
      bills: bills.length,
      challans: challans.length,
      receipts: receipts.length,
    },
    pending: {
      delivery: pendingDelivery,
      bill: pendingBill,
      notDeliveredNotBilled,
      billedNotDelivered,
      deliveredNotBilled,
      deliveredBilled,
      outstandingAmt,
      outstandingBills,
      hireAmt: pendingHireAmt,
      hireCount: pendingHireCount,
      enquiries: newEnquiries,
      lrTotal: pendingLrTotal,
    },
    completed: {
      lrs: deliveredBilled,
      billsPaid,
      billsPaidAmt,
      collected,
      hireDone: Math.max(0, hireDoneCount),
      enquiries: closedEnquiries,
    },
    profit: {
      income,
      freight: freightTotal,
      billAmt,
      hirePaid,
      challanHire,
      expenseNotes,
      expense,
      profit,
      collected,
      outstanding: outstandingAmt,
    },
    outstandingTop: outstandingTop.slice(0, 6),
    recentBookings,
    pendingList,
    completedList,
  });
  } catch (err) {
    console.error("dashboard failed", err);
    return ok({
      counts: {
        parties: 0,
        bookings: 0,
        bills: 0,
        challans: 0,
        receipts: 0,
      },
      pending: {
        delivery: 0,
        bill: 0,
        notDeliveredNotBilled: 0,
        billedNotDelivered: 0,
        deliveredNotBilled: 0,
        deliveredBilled: 0,
        outstandingAmt: 0,
        outstandingBills: 0,
        hireAmt: 0,
        hireCount: 0,
        enquiries: 0,
        lrTotal: 0,
      },
      completed: {
        lrs: 0,
        billsPaid: 0,
        billsPaidAmt: 0,
        collected: 0,
        hireDone: 0,
        enquiries: 0,
      },
      profit: {
        income: 0,
        freight: 0,
        billAmt: 0,
        hirePaid: 0,
        challanHire: 0,
        expenseNotes: 0,
        expense: 0,
        profit: 0,
        collected: 0,
        outstanding: 0,
      },
      outstandingTop: [],
      recentBookings: [],
      pendingList: [],
      completedList: [],
      warning: "Dashboard data could not be fully loaded",
    });
  }
}
