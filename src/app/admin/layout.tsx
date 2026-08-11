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
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 md:gap-6">
              <Link
                href="/admin"
                className="shrink-0 font-display text-base font-semibold tracking-wide sm:text-lg"
              >
                Admin Panel
              </Link>
              <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
                <Link
                  href="/admin"
                  className="shrink-0 rounded-sm px-2.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Enquiries
                </Link>
                <Link
                  href="/admin/blog"
                  className="shrink-0 rounded-sm px-2.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Blog
                </Link>
                <Link
                  href="/admin/settings"
                  className="shrink-0 rounded-sm px-2.5 py-1.5 text-sm text-white/80 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-sm">
              <Link href="/" className="text-white/70 hover:text-white">
                View site
              </Link>
              <LogoutButton />
            </div>
          </div>
        </header>
      )}
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">{children}</div>
    </div>
  );
}
