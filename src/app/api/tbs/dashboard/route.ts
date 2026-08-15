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
  isTbsPersistent,
} from "@/lib/tbs/store";
import { partyLabel } from "@/lib/tbs/partyLabel";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayGap(fromIso: string, toIso: string) {
  const a = Date.parse(`${fromIso}T12:00:00`);
  const b = Date.parse(`${toIso}T12:00:00`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

function weekdayShort(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "short",
  });
}

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

  const today = todayISO();
  const todayBookings = bookings.filter((b) => b.lrDate === today);
  const todayFreight = todayBookings.reduce(
    (s, b) => s + Number(b.grandTotal || b.total || b.freight || 0),
    0,
  );
  const todayBills = bills.filter((b) => b.billDate === today);
  const todayBillAmt = todayBills.reduce(
    (s, b) => s + Number(b.totalAmount || 0),
    0,
  );
  const todayCollected = receipts
    .filter((r) => (r.transactionDate || r.date) === today)
    .reduce((s, r) => s + Number(r.paidAmt || 0), 0);
  const todayVehicles = [
    ...new Set(
      todayBookings.map((b) => (b.vehicleNo || "").trim()).filter(Boolean),
    ),
  ];

  const week: {
    date: string;
    label: string;
    bookings: number;
    freight: number;
    collected: number;
  }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = isoAgo(i);
    const dayBookings = bookings.filter((b) => b.lrDate === date);
    week.push({
      date,
      label: weekdayShort(date),
      bookings: dayBookings.length,
      freight: dayBookings.reduce(
        (s, b) => s + Number(b.grandTotal || b.total || b.freight || 0),
        0,
      ),
      collected: receipts
        .filter((r) => (r.transactionDate || r.date) === date)
        .reduce((s, r) => s + Number(r.paidAmt || 0), 0),
    });
  }

  const aging = {
    d0_15: { count: 0, amount: 0 },
    d16_30: { count: 0, amount: 0 },
    d30plus: { count: 0, amount: 0 },
  };
  for (const row of outstandingTop) {
    const bill = bills.find((b) => b.billNo === row.billNo);
    const days = dayGap(bill?.billDate || today, today);
    if (days <= 15) {
      aging.d0_15.count += 1;
      aging.d0_15.amount += row.amount;
    } else if (days <= 30) {
      aging.d16_30.count += 1;
      aging.d16_30.amount += row.amount;
    } else {
      aging.d30plus.count += 1;
      aging.d30plus.amount += row.amount;
    }
  }

  const routeMap = new Map<
    string,
    { from: string; to: string; count: number; freight: number }
  >();
  const partyMap = new Map<
    string,
    { party: string; count: number; freight: number }
  >();
  for (const b of bookings) {
    const from = (b.from || "").trim() || "—";
    const to = (b.to || "").trim() || "—";
    const key = `${from}|${to}`;
    const freight = Number(b.grandTotal || b.total || b.freight || 0);
    const route = routeMap.get(key) || { from, to, count: 0, freight: 0 };
    route.count += 1;
    route.freight += freight;
    routeMap.set(key, route);
    const name = partyLabel(b.billingParty) || "—";
    const party = partyMap.get(name) || { party: name, count: 0, freight: 0 };
    party.count += 1;
    party.freight += freight;
    partyMap.set(name, party);
  }
  const topRoutes = [...routeMap.values()]
    .sort((a, b) => b.count - a.count || b.freight - a.freight)
    .slice(0, 6);
  const topParties = [...partyMap.values()]
    .sort((a, b) => b.freight - a.freight)
    .slice(0, 6);

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
  const collectionPct =
    billAmt > 0 ? Math.round((collected / billAmt) * 100) : 0;
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

  const pendingList = [...bookings]
    .filter((b) => !(Boolean(b.delivered) && billedLrIds.has(b.id)))
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

  const months: { key: string; label: string; bookings: number; freight: number }[] =
    [];
  {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const x = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
      const label = x.toLocaleDateString("en-IN", { month: "short" });
      const monthBookings = bookings.filter((b) =>
        String(b.lrDate || "").startsWith(key),
      );
      months.push({
        key,
        label,
        bookings: monthBookings.length,
        freight: monthBookings.reduce(
          (s, b) => s + Number(b.grandTotal || b.total || b.freight || 0),
          0,
        ),
      });
    }
  }

  const allVehicles = new Set<string>();
  for (const b of bookings) {
    const v = (b.vehicleNo || "").trim().toUpperCase();
    if (v) allVehicles.add(v);
  }
  for (const c of challans) {
    const v = (c.vehicleNo || "").trim().toUpperCase();
    if (v) allVehicles.add(v);
  }
  const onRoadSet = new Set(todayVehicles.map((v) => v.trim().toUpperCase()));
  for (const c of challans) {
    const paid = paidByChallan.get(c.challanNo) || 0;
    const hireDue = Math.max(0, Number(c.balance || 0) - paid);
    if (hireDue > 0.5) {
      const v = (c.vehicleNo || "").trim().toUpperCase();
      if (v) onRoadSet.add(v);
    }
  }
  const vehiclesOnRoad = [...onRoadSet].filter(Boolean);
  const vehiclesIdle = [...allVehicles].filter((v) => !onRoadSet.has(v));

  return ok({
    persistent: isTbsPersistent(),
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
    outstandingTop: outstandingTop.slice(0, 8),
    todayWork: {
      date: today,
      bookings: todayBookings.length,
      freight: todayFreight,
      bills: todayBills.length,
      billAmt: todayBillAmt,
      collected: todayCollected,
      vehicles: todayVehicles.length,
    },
    week,
    aging,
    topRoutes,
    topParties,
    collectionPct,
    storage: isTbsPersistent() ? "redis" : "local",
    months,
    vehicles: {
      total: allVehicles.size,
      onRoad: vehiclesOnRoad.length,
      idle: vehiclesIdle.length,
      list: vehiclesOnRoad.slice(0, 8),
    },
    recentBookings,
    pendingList,
    completedList,
  });
  } catch (err) {
    console.error("dashboard failed", err);
    return ok({
      persistent: isTbsPersistent(),
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
      todayWork: {
        date: "",
        bookings: 0,
        freight: 0,
        bills: 0,
        billAmt: 0,
        collected: 0,
        vehicles: 0,
      },
      week: [],
      aging: {
        d0_15: { count: 0, amount: 0 },
        d16_30: { count: 0, amount: 0 },
        d30plus: { count: 0, amount: 0 },
      },
      topRoutes: [],
      topParties: [],
      collectionPct: 0,
      storage: isTbsPersistent() ? "redis" : "local",
      months: [],
      vehicles: { total: 0, onRoad: 0, idle: 0, list: [] as string[] },
      recentBookings: [],
      pendingList: [],
      completedList: [],
      warning: "Dashboard data could not be fully loaded",
    });
  }
}
