"use client";

import Link from "next/link";
import { FormWindow } from "@/components/tbs/FormPrimitives";
import { useAdminAuth } from "@/components/tbs/useTbs";

const items = [
  { href: "/admin/reports/booking", label: "Booking Report", icon: "📅" },
  {
    href: "/admin/reports/party-outstanding/billingwise",
    label: "Party Outstanding → Billingwise Outstanding",
    icon: "₹",
  },
  {
    href: "/admin/reports/party-outstanding/dayswise",
    label: "Party Outstanding → Daywise Outstanding",
    icon: "₹",
  },
  {
    href: "/admin/reports/party-ledger/billwise",
    label: "Party Ledger → Billwise Customer Ledger",
    icon: "⚖",
  },
  { href: "/admin/reports/gst-summary", label: "GST Summary Report", icon: "⏳" },
  { href: "/admin/reports/profit", label: "Profit Report", icon: "👤" },
];

export default function ReportsHubPage() {
  const ready = useAdminAuth();
  if (!ready) return <div className="tbs-empty">Loading…</div>;

  return (
    <FormWindow title="Frm_Reports">
      <p style={{ marginBottom: 12 }}>
        Same Reports structure as desktop software. Use top <b>Reports</b> menu:
      </p>
      <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
        {items.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="tbs-btn"
            style={{ justifyContent: "flex-start", height: 34, textDecoration: "none" }}
          >
            {r.icon} {r.label}
          </Link>
        ))}
      </div>
    </FormWindow>
  );
}
