"use client";

import { ReportScreen } from "@/components/tbs/ReportScreen";

export default function BillwiseLedgerPage() {
  return (
    <ReportScreen
      title="Frm_BillwiseCustomerLedger"
      kind="ledger"
      needParty
    />
  );
}
