/** LHC hire: Transfer is a mode of Advance, not a second deduction. */
export function challanAdvancePaid(c: {
  advance?: number;
  transfer?: number;
  cash?: number;
  fuel?: number;
}) {
  const advance = Number(c.advance || 0);
  const cash = Number(c.cash || 0);
  const fuel = Number(c.fuel || 0);
  const transfer = Number(c.transfer || 0);
  if (advance > 0) return advance + cash + fuel;
  return transfer + cash + fuel;
}

export function challanHireBalance(c: {
  freight?: number;
  advance?: number;
  transfer?: number;
  cash?: number;
  fuel?: number;
}) {
  return Number(c.freight || 0) - challanAdvancePaid(c);
}

export function lhpTotalsForChallan(
  challanNo: string,
  payments: { challanNo?: string; paidAmt?: number; deduction?: number; narration?: string }[],
) {
  const no = String(challanNo || "");
  let paid = 0;
  let deduction = 0;
  const notes: string[] = [];
  for (const p of payments) {
    if (String(p.challanNo || "") !== no) continue;
    paid += Number(p.paidAmt || 0);
    deduction += Number(p.deduction || 0);
    const n = String(p.narration || "").trim();
    if (n) notes.push(n);
  }
  return { paid, deduction, narration: notes.join("; ") };
}

/** Money already given to broker: LHC advance/cash/fuel + later LHP payments. */
export function challanPaidAmt(
  c: {
    challanNo?: string;
    advance?: number;
    transfer?: number;
    cash?: number;
    fuel?: number;
  },
  payments: { challanNo?: string; paidAmt?: number }[] = [],
) {
  return challanAdvancePaid(c) + lhpTotalsForChallan(c.challanNo || "", payments).paid;
}

export function challanHireDue(
  c: {
    freight?: number;
    advance?: number;
    transfer?: number;
    cash?: number;
    fuel?: number;
  },
  alreadyPaid = 0,
) {
  return Math.max(0, challanHireBalance(c) - Number(alreadyPaid || 0));
}
