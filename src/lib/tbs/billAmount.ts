import type { Bill } from "@/lib/tbs/types";

export function billExtraCharges(b: Partial<Bill>) {
  return (
    Number(b.lrCharges || 0) +
    Number(b.detention || 0) +
    Number(b.hamali || 0) +
    Number(b.doorDelivery || 0) +
    Number(b.doorCollection || 0) +
    Number(b.other || 0)
  );
}

export function billGrandTotal(lrSum: number, b: Partial<Bill>) {
  return Number(lrSum || 0) + billExtraCharges(b);
}
