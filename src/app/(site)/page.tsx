import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/FaqList";
import { IconBadge } from "@/components/IconBadge";
import { QuoteForm } from "@/components/QuoteForm";
import { ServiceGrid } from "@/components/ServiceGrid";
import { formatLocation, getPrimaryLocation, getSettings } from "@/lib/store";

export default async function HomePage() {
  const settings = await getSettings();
  const primary = getPrimaryLocation(settings);

  return (
    <>
      {/* Hero — Highway structure + Shyam branding */}
      <section className="relative overflow-hidden bg-navy-deep text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 70% 70% at 85% 20%, rgba(198,40,40,0.28), transparent), linear-gradient(120deg, #061428 0%, #0a1f3d 50%, #123056 100%)",
          }}
        />
        <div className="site-container relative grid min-h-[88vh] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <p className="animate-fade-in section-label !text-gold">
              {settings.heroEyebrow}
            </p>
            <h1 className="animate-fade-up mt-4 max-w-xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.1rem]">
              {settings.heroHeadline.split(" ").slice(0, 2).join(" ")}
              <span className="text-red">
                {" "}
                {settings.heroHeadline.split(" ").slice(2).join(" ")}
              </span>
            </h1>
            <p className="animate-fade-up-delay mt-3 text-base font-medium text-white/90 sm:text-lg">
              {settings.hindiTagline}
            </p>
            <p className="animate-fade-up-delay mt-4 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
              {settings.heroSubtext}
            </p>

            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-3">
              <Link href="/quote" className="btn-primary">
                Get Free Quote
              </Link>
              <Link href="/services" className="btn-secondary">
                Our Services
              </Link>
            </div>

            <div className="animate-fade-up-delay-2 mt-10 flex flex-wrap gap-6">
              {settings.attributes.map((attr) => (
                <div key={attr.title} className="flex items-center gap-3">
                  <IconBadge icon={attr.icon} className="!h-10 !w-10 !bg-red" />
                  <span className="text-sm font-bold tracking-[0.12em] text-white">
                    {attr.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-delay relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/40">
              <Image
                src="/brand/hero-banner.png"
                alt={`${settings.companyName} — ${settings.legalName}, Proprietor`}
                width={1200}
                height={700}
                className="h-auto w-full object-cover object-right"
                priority
              />
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-navy/95 p-4 backdrop-blur sm:left-auto sm:right-6 sm:w-72">
              <p className="text-xs uppercase tracking-[0.16em] text-gold">
                Proprietor
              </p>
              <p className="mt-1 font-display text-2xl font-bold">
                {settings.legalName}
              </p>
              <p className="mt-2 text-sm text-white/70">
                {settings.phone}
                {settings.phone2 ? ` · ${settings.phone2}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-line bg-white">
        <div className="site-container grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
          {settings.stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <p className="font-display text-4xl font-bold text-navy">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions grid — Highway home services */}
      <section className="py-16 sm:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">What we offer</p>
            <h2 className="section-title mt-2 text-4xl sm:text-5xl">
              Comprehensive Logistics Solutions
            </h2>
            <p className="mt-4 text-muted">
              From full truckloads to custom logistics, we deliver speed, safety,
              and precision across India.
            </p>
          </div>
          <div className="mt-10">
            <ServiceGrid services={settings.services} />
          </div>
        </div>
      </section>

      {/* Visit office / location */}
      <section className="bg-sand py-16 sm:py-20">
        <div className="site-container grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-label">Visit Our Office</p>
            <h2 className="section-title mt-2 text-4xl sm:text-5xl">
              Ready to move your cargo?
            </h2>
            <p className="mt-4 text-muted">
              Located in Sangli, Maharashtra — always ready to serve your logistics
              needs.
            </p>

            <div className="mt-8 space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red">
                  Office Address
                </p>
                <p className="mt-2 font-semibold text-navy">
                  {settings.companyName}
                </p>
                {primary && (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {formatLocation(primary)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red">
                  Business Hours
                </p>
                <p className="mt-2 text-sm text-muted">{settings.workingHours}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red">
                  GST Information
                </p>
                <p className="mt-2 text-sm font-medium tracking-wide text-navy">
                  GST No: {settings.gstin}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link href="/contact" className="btn-navy">
                  Contact Us
                </Link>
                <Link href="/quote" className="btn-primary">
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            {primary?.mapEmbedUrl ? (
              <iframe
                title="Office location map"
                src={primary.mapEmbedUrl}
                className="aspect-[4/3] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-muted">
                Map not set — add from admin panel
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ — Highway structure */}
      <section className="py-16 sm:py-20">
        <div className="site-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="section-label">FAQ</p>
            <h2 className="section-title mt-2 text-4xl sm:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-muted">
              Have questions? Find everything you need to know about our services.
            </p>
          </div>
          <FaqList faqs={settings.faqs} />
        </div>
      </section>

      {/* Footer CTA strip from banner services */}
      <section className="bg-navy py-10 text-white">
        <div className="site-container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {settings.services.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <IconBadge icon={s.icon} className="!bg-red" />
                <p className="text-sm font-bold uppercase tracking-wide">
                  {s.title.replace(/ \(.*\)/, "")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-white/70 sm:text-base">
            We don&apos;t just move freight.{" "}
            <span className="font-semibold text-gold">
              We move your business forward.
            </span>
          </p>
        </div>
      </section>

      {/* Mobile quick quote */}
      <section className="py-14 lg:hidden">
        <div className="site-container">
          <p className="section-label">Get Quote</p>
          <h2 className="section-title mt-2 text-3xl">Request an enquiry</h2>
          <div className="mt-6 rounded-2xl border border-line bg-white p-5">
            <QuoteForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
