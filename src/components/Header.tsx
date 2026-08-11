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
      {/* Mobile: only logo + menu — phones stay in bottom call bar so logo is clear */}
      <div className="site-container flex h-14 items-center justify-between gap-3 sm:h-16 lg:h-[4.5rem]">
        <div className="min-w-0 flex-1 pr-2">
          <BrandLogo
            companyName={companyName}
            logoUrl={logoUrl}
            size="sm"
            variant="light"
          />
        </div>

        <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
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

        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          <Link
            href="/quote"
            className="btn-primary !min-h-0 !px-3 !py-2 !text-xs sm:!text-sm"
          >
            Quote
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line"
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
