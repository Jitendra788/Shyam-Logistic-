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
      <div className="site-container flex h-14 items-center justify-between gap-2 sm:h-[4.5rem] sm:gap-4">
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
                className={`rounded-md px-2.5 py-2 text-sm font-semibold transition xl:px-3 ${
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
            <div className="ml-2 flex flex-col items-end border-l border-line pl-3 text-right leading-tight">
              <a
                href={`tel:+91${tel1}`}
                className="text-sm font-bold text-navy hover:text-red"
              >
                {phone}
              </a>
              {tel2 ? (
                <a
                  href={`tel:+91${tel2}`}
                  className="text-xs font-semibold text-muted hover:text-red"
                >
                  {phone2}
                </a>
              ) : null}
            </div>
          ) : null}

          <Link
            href="/quote"
            className="btn-primary ml-2 !min-h-0 !py-2 !text-sm"
          >
            Get Quote
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
          {tel1 ? (
            <a
              href={`tel:+91${tel1}`}
              className="inline-flex h-10 items-center rounded-md bg-red px-2.5 text-xs font-bold text-white sm:px-3 sm:text-sm"
              aria-label={`Call ${phone}`}
            >
              Call
            </a>
          ) : null}
          <Link
            href="/quote"
            className="btn-primary !min-h-0 !px-3 !py-2 !text-xs sm:!text-sm"
          >
            Quote
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line"
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
          <nav className="site-container flex flex-col gap-1 py-3 pb-6">
            {tel1 ? (
              <div className="mb-2 rounded-xl border border-line bg-sand/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Call us
                </p>
                <a
                  href={`tel:+91${tel1}`}
                  className="mt-1 block text-lg font-bold text-navy"
                >
                  {phone}
                </a>
                {tel2 ? (
                  <a
                    href={`tel:+91${tel2}`}
                    className="mt-1 block text-base font-bold text-navy"
                  >
                    {phone2}
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
