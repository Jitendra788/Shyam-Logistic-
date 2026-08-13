import { redirect } from "next/navigation";

export default function PartywiseRedirect() {
  redirect("/admin/reports/party-outstanding/dayswise");
}
