import { redirect } from "next/navigation";

export default function PartyOutstandingRedirect() {
  redirect("/admin/reports/party-outstanding/billingwise");
}
