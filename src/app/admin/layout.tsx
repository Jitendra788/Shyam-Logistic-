import { isAuthenticated } from "@/lib/auth";
import { MasterShell } from "@/components/tbs/MasterShell";
import "./tbs.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return <div className="min-h-full bg-sand">{children}</div>;
  }

  return <MasterShell>{children}</MasterShell>;
}
