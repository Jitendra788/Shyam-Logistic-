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
