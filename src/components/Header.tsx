"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

function cleanTel(phone: string) {
  return phone.replace(/\D/g, "");
}

function displayPhone(phone: string) {
  const d = cleanTel(phone);
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return phone.trim();
}

export function Header({
  companyName,
  logoUrl = "",
  phone = "",
  phone2 = "",
}: {
  companyName: string;
  logoUrl?: string;
  phone?: string;
  phone2?: string;
  brandShort?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tel1 = phone ? cleanTel(phone) : "";
  const tel2 = phone2 ? cleanTel(phone2) : "";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md">
      <div className="site-container flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3 lg:h-[4.5rem] lg:gap-4">
        <div className="min-w-0 flex-1">
          <BrandLogo
            companyName={companyName}
            logoUrl={logoUrl}
            size="sm"
            variant="light"
          />
        </div>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-2 py-2 text-sm font-semibold transition xl:px-2.5 ${
                  active
                    ? "bg-navy text-white"
                    : "text-navy/80 hover:bg-sand hover:text-navy"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {tel1 ? (
            <div className="ml-1.5 flex min-w-0 max-w-[10rem] flex-col items-end border-l border-line pl-2.5 text-right leading-tight xl:ml-2 xl:max-w-none xl:pl-3">
              <a
                href={`tel:+91${tel1}`}
                className="truncate text-sm font-bold tabular-nums text-navy hover:text-red"
              >
                {displayPhone(phone)}
              </a>
              {tel2 ? (
                <a
                  href={`tel:+91${tel2}`}
                  className="truncate text-xs font-semibold tabular-nums text-muted hover:text-red"
                >
                  {displayPhone(phone2)}
                </a>
              ) : null}
            </div>
          ) : null}

          <Link
            href="/quote"
            className="btn-primary ml-2 !min-h-0 !shrink-0 !py-2 !text-sm"
          >
            Get Quote
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:hidden">
          {tel1 ? (
            <a
              href={`tel:+91${tel1}`}
              className="inline-flex h-9 max-w-[7.5rem] items-center justify-center gap-1 rounded-md bg-red px-2 text-white sm:h-10 sm:max-w-none sm:px-2.5"
              aria-label={`Call ${phone}`}
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              <span className="truncate text-[11px] font-bold tabular-nums sm:text-xs">
                {displayPhone(phone)}
              </span>
            </a>
          ) : null}
          {tel2 ? (
            <a
              href={`tel:+91${tel2}`}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-navy text-white sm:h-10 sm:w-auto sm:max-w-[7.5rem] sm:gap-1 sm:px-2"
              aria-label={`Call ${phone2}`}
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              <span className="hidden truncate text-[11px] font-bold tabular-nums sm:inline sm:text-xs">
                {displayPhone(phone2)}
              </span>
            </a>
          ) : null}
          <Link
            href="/quote"
            className="btn-primary !min-h-0 !shrink-0 !px-2.5 !py-2 !text-xs sm:!px-3 sm:!text-sm"
          >
            Quote
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line sm:h-10 sm:w-10"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <div className="relative h-4 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-navy transition ${
                  open ? "top-1.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 block h-0.5 w-5 bg-navy transition ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-navy transition ${
                  open ? "top-1.5 -rotate-45" : "top-3"
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {open && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-line bg-white lg:hidden">
          <nav className="site-container flex flex-col gap-1 py-3 pb-28 sm:pb-8">
            {tel1 ? (
              <div className="mb-2 grid grid-cols-1 gap-2 rounded-xl border border-line bg-sand/60 p-3 min-[380px]:grid-cols-2">
                <a
                  href={`tel:+91${tel1}`}
                  className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-red px-2 py-2 text-center text-white"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                    Call
                  </span>
                  <span className="mt-0.5 text-base font-bold tabular-nums">
                    {displayPhone(phone)}
                  </span>
                </a>
                {tel2 ? (
                  <a
                    href={`tel:+91${tel2}`}
                    className="flex min-h-12 flex-col items-center justify-center rounded-lg bg-navy px-2 py-2 text-center text-white"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                      Call
                    </span>
                    <span className="mt-0.5 text-base font-bold tabular-nums">
                      {displayPhone(phone2)}
                    </span>
                  </a>
                ) : null}
              </div>
            ) : null}
            {links.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-md px-3 py-3 text-base font-semibold ${
                    active ? "bg-navy text-white" : "text-navy hover:bg-sand"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/quote"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 w-full text-center"
            >
              Get Free Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
