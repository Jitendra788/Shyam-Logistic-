import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { formatLocation, getPrimaryLocation } from "@/lib/store";
import { BrandLogo } from "./BrandLogo";

export function Footer({ settings }: { settings: SiteSettings }) {
  const primary = getPrimaryLocation(settings);

  return (
    <footer className="mt-auto bg-navy-deep text-white">
      <div className="site-container grid gap-8 py-10 sm:gap-10 sm:py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <BrandLogo
            companyName={settings.companyName}
            logoUrl={settings.logoUrl}
            size="sm"
            variant="dark"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            {settings.description.slice(0, 140)}…
          </p>
          <p className="mt-4 text-xs font-semibold tracking-wide text-gold">
            GST: {settings.gstin}
          </p>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/90">
            Quick Links
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Services
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="/quote" className="hover:text-white">
                Get Quote
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/90">
            Our Services
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            {settings.services.slice(0, 4).map((s) => (
              <li key={s.id}>
                <Link href="/services" className="hover:text-white">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/90">
            Contact Info
          </p>
          <ul className="mt-4 space-y-2 text-sm text-white/65">
            {primary && <li>{formatLocation(primary)}</li>}
            <li>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="hover:text-white"
              >
                {settings.phone}
              </a>
              {settings.phone2 && (
                <>
                  {" / "}
                  <a
                    href={`tel:${settings.phone2.replace(/\s/g, "")}`}
                    className="hover:text-white"
                  >
                    {settings.phone2}
                  </a>
                </>
              )}
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="hover:text-white">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="site-container flex flex-col gap-2 py-4 text-xs leading-relaxed text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p className="break-words">
            © {new Date().getFullYear()} {settings.companyName}. All rights
            reserved. Prop. {settings.legalName}.
          </p>
          <p className="text-white/70 sm:max-w-md sm:text-right">
            {settings.slogan}
          </p>
        </div>
      </div>
    </footer>
  );
}
