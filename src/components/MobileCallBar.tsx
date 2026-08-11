import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

/** Mobile sticky call bar so phone numbers stay one tap away */
export function MobileCallBar({ settings }: { settings: SiteSettings }) {
  const tel1 = settings.phone?.replace(/\D/g, "") || "";
  const tel2 = settings.phone2?.replace(/\D/g, "") || "";
  if (!tel1) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(10,31,61,0.1)] backdrop-blur-md lg:hidden">
      <div className="site-container grid grid-cols-2 gap-2 py-2.5">
        <a
          href={`tel:+91${tel1}`}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-red px-2 text-center text-sm font-bold text-white"
        >
          Call {settings.phone}
        </a>
        {tel2 ? (
          <a
            href={`tel:+91${tel2}`}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-navy px-2 text-center text-sm font-bold text-white"
          >
            Call {settings.phone2}
          </a>
        ) : (
          <Link
            href="/quote"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-navy px-2 text-center text-sm font-bold text-white"
          >
            Get Quote
          </Link>
        )}
      </div>
    </div>
  );
}
