import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  return (
    <div className="min-h-full bg-sand">
      {authed && (
        <header className="border-b border-line bg-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="font-display text-lg font-semibold tracking-wide"
              >
                Admin Panel
              </Link>
              <nav className="flex gap-1">
                <Link
                  href="/admin"
                  className="rounded-sm px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Enquiries
                </Link>
                <Link
                  href="/admin/settings"
                  className="rounded-sm px-3 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                >
                  Site Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="text-white/70 hover:text-white">
                View site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
