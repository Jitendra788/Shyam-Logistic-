import Link from "next/link";
import type { SiteSettings } from "@/lib/types";

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

function displayPhone(phone: string) {
  const d = digits(phone);
  if (d.length === 10) {
    return `${d.slice(0, 5)} ${d.slice(5)}`;
  }
  return phone.trim();
}

/** Mobile sticky dual-call bar — fits small screens without overflow */
export function MobileCallBar({ settings }: { settings: SiteSettings }) {
  const tel1 = digits(settings.phone || "");
  const tel2 = digits(settings.phone2 || "");
  if (!tel1) return null;

  return (
    <nav
      aria-label="Call SHYAM LOGISTIC"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/98 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-6px_24px_rgba(10,31,61,0.12)] backdrop-blur-md lg:hidden"
    >
      <div className={`site-container grid gap-1.5 py-2 ${tel2 ? "grid-cols-2" : "grid-cols-2"}`}>
        <a
          href={`tel:+91${tel1}`}
          aria-label={`Call ${displayPhone(settings.phone)}`}
          className="flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg bg-red px-1.5 py-1.5 text-center text-white active:scale-[0.98] sm:px-2"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">
            Call
          </span>
          <span className="mt-0.5 w-full truncate text-[13px] font-bold leading-tight tabular-nums sm:text-sm">
            {displayPhone(settings.phone)}
          </span>
        </a>

        {tel2 ? (
          <a
            href={`tel:+91${tel2}`}
            aria-label={`Call ${displayPhone(settings.phone2)}`}
            className="flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg bg-navy px-1.5 py-1.5 text-center text-white active:scale-[0.98] sm:px-2"
          >
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/85">
              Call
            </span>
            <span className="mt-0.5 w-full truncate text-[13px] font-bold leading-tight tabular-nums sm:text-sm">
              {displayPhone(settings.phone2)}
            </span>
          </a>
        ) : (
          <Link
            href="/quote"
            className="flex min-h-12 min-w-0 items-center justify-center rounded-lg bg-navy px-2 text-center text-sm font-bold text-white"
          >
            Get Quote
          </Link>
        )}
      </div>
    </nav>
  );
}
