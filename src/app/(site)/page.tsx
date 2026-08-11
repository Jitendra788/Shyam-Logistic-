import Image from "next/image";
import Link from "next/link";
import { FaqList } from "@/components/FaqList";
import { IconBadge } from "@/components/IconBadge";
import { QuoteForm } from "@/components/QuoteForm";
import { ServiceGrid } from "@/components/ServiceGrid";
import { BlogCard } from "@/components/BlogCard";
import {
  formatLocation,
  getPrimaryLocation,
  getPublishedPosts,
  getSettings,
} from "@/lib/store";

export default async function HomePage() {
  const settings = await getSettings();
  const primary = getPrimaryLocation(settings);
  const latestPosts = (await getPublishedPosts()).slice(0, 3);

  return (
    <>
      <section className="relative min-h-[min(92vh,820px)] overflow-hidden text-white sm:min-h-[88vh]">
        <Image
          src="/brand/hero.jpg"
          alt="shyamlogistic freight logistics and trucking solutions"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-navy-deep via-navy-deep/92 to-navy/50 sm:to-navy/55"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-deep/85 via-transparent to-navy-deep/35"
        />

        <div className="site-container relative z-10 flex min-h-[min(92vh,820px)] flex-col justify-center py-14 sm:min-h-[88vh] sm:py-20">
          <div className="max-w-2xl">
            <p className="animate-fade-in section-label !text-gold">
              {settings.heroEyebrow}
            </p>
            <h1 className="animate-fade-up mt-3 font-display text-[2.1rem] font-bold leading-[1.08] tracking-tight sm:mt-4 sm:text-5xl md:text-6xl lg:text-[4.1rem]">
              {settings.heroHeadline.split(" ").slice(0, 2).join(" ")}
              <span className="text-red">
                {" "}
                {settings.heroHeadline.split(" ").slice(2).join(" ")}
              </span>
            </h1>
            <p className="animate-fade-up-delay mt-3 text-sm font-medium text-white/95 sm:mt-4 sm:text-base md:text-lg">
              {settings.hindiTagline}
            </p>
            <p className="animate-fade-up-delay mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base md:text-lg">
              {settings.heroSubtext}
            </p>

            <div className="animate-fade-up-delay-2 btn-stack-mobile mt-7 sm:mt-8">
              <Link href="/quote" className="btn-primary">
                Get Free Quote
              </Link>
              <Link href="/services" className="btn-secondary">
                Our Services
              </Link>
            </div>

            <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap gap-2.5 sm:mt-10 sm:gap-4">
              {settings.attributes.map((attr) => (
                <div
                  key={attr.title}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 backdrop-blur-sm sm:gap-2.5 sm:px-3 sm:py-2"
                >
                  <IconBadge
                    icon={attr.icon}
                    className="!h-8 !w-8 !bg-red sm:!h-9 sm:!w-9"
                  />
                  <span className="text-[11px] font-bold tracking-[0.12em] text-white sm:text-sm sm:tracking-[0.14em]">
                    {attr.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 w-full max-w-md rounded-xl border border-white/15 bg-navy-deep/75 p-3.5 backdrop-blur-md sm:mt-14 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold sm:text-[11px] sm:tracking-[0.16em]">
              Founder · {settings.legalName} · Sangli
            </p>
            <p className="mt-1 text-xs text-white/70">
              Official site: www.shyamlogistic.online
            </p>
            <p className="mt-1 break-all text-sm text-white/85 sm:break-normal">
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="font-semibold hover:text-white"
              >
                {settings.phone}
              </a>
              {settings.phone2 ? (
                <>
                  <span className="hidden sm:inline"> · </span>
                  <span className="block sm:inline">
                    <a
                      href={`tel:${settings.phone2.replace(/\s/g, "")}`}
                      className="font-semibold hover:text-white"
                    >
                      {settings.phone2}
                    </a>
                  </span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white">
        <div className="site-container grid grid-cols-2 gap-4 py-8 sm:gap-6 sm:py-10 md:grid-cols-4">
          {settings.stats.map((stat) => (
            <div key={stat.label} className="text-center md:text-left">
              <p className="font-display text-2xl font-bold text-navy sm:text-3xl md:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-muted sm:text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">What we offer</p>
            <h2 className="section-title mt-2">
              Logistics solutions from shyamlogistic
            </h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              From full truckloads to custom logistics,{" "}
              <strong className="font-semibold text-navy">shyamlogistic</strong>{" "}
              (
              <strong className="font-semibold text-navy">SHYAM LOGISTIC</strong>
              ) delivers speed, safety, and precision across India. Book FTL,
              PTL, and express cargo online at{" "}
              <span className="font-semibold text-navy">
                www.shyamlogistic.online
              </span>
              .
            </p>
          </div>
          <div className="mt-8 sm:mt-10">
            <ServiceGrid services={settings.services} />
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white py-12 sm:py-16">
        <div className="site-container max-w-3xl">
          <h2 className="section-title text-center">
            Why choose shyamlogistic?
          </h2>
          <div className="prose-like mt-6 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
            <p>
              <strong className="text-navy">shyamlogistic</strong> is the
              official online name of{" "}
              <strong className="text-navy">SHYAM LOGISTIC</strong>, a
              GST-registered logistics company serving Sangli, Maharashtra, and
              pan-India routes. We provide full truck load (FTL), part truck load
              (PTL), express cargo, and custom freight services with transparent
              billing and a strong focus on on-time delivery.
            </p>
            <p>
              Need full truck load, part truck load, express delivery,
              warehousing support, or custom supply-chain coordination? Book
              through{" "}
              <strong className="text-navy">www.shyamlogistic.online</strong> or
              call{" "}
              <a
                href={`tel:${settings.phone}`}
                className="font-semibold text-red hover:underline"
              >
                {settings.phone}
              </a>
              {settings.phone2 ? (
                <>
                  {" / "}
                  <a
                    href={`tel:${settings.phone2}`}
                    className="font-semibold text-red hover:underline"
                  >
                    {settings.phone2}
                  </a>
                </>
              ) : null}
              . Founder: {settings.legalName}. GSTIN: {settings.gstin}.
            </p>
            <p>
              Local directories may show{" "}
              <strong className="text-navy">Shree Shyam Logistics</strong>{" "}
              (Sangli / Kupwad). That listing refers to the same Sangli business
              as <strong className="text-navy">SHYAM LOGISTIC</strong> online (
              <strong className="text-navy">shyamlogistic</strong> · GSTIN{" "}
              <strong className="text-navy">{settings.gstin}</strong>). Always
              book on{" "}
              <strong className="text-navy">www.shyamlogistic.online</strong>.
            </p>
          </div>
          <div className="btn-stack-mobile mt-8 justify-center">
            <Link href="/quote" className="btn-primary">
              Get a free quote
            </Link>
            <Link href="/shyamlogistic" className="btn-navy">
              About shyamlogistic brand
            </Link>
          </div>
        </div>
      </section>

      {latestPosts.length > 0 && (
        <section className="border-t border-line bg-white py-12 sm:py-16 md:py-20">
          <div className="site-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="section-label">Blog</p>
                <h2 className="section-title mt-2">Insights and freight tips</h2>
                <p className="mt-2 text-sm text-muted sm:mt-3 sm:text-base">
                  Guides to help you plan FTL, PTL, and pan-India cargo movement.
                </p>
              </div>
              <Link href="/blog" className="btn-navy w-full sm:w-auto">
                View all posts
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  companyName={settings.companyName}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-sand py-12 sm:py-16 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
          <div>
            <p className="section-label">Visit Our Office</p>
            <h2 className="section-title mt-2">Ready to move your cargo?</h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              Located in Sangli, Maharashtra — always ready to serve your logistics
              needs.
            </p>

            <div className="mt-6 space-y-5 sm:mt-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-red">
                  Office Address
                </p>
                <p className="mt-2 font-semibold text-navy">
                  {settings.companyName}
                </p>
                {primary && (
                  <p className="mt-1 text-sm leading-relaxed break-words text-muted">
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
                <p className="mt-2 text-sm font-medium tracking-wide break-all text-navy sm:break-normal">
                  GST No: {settings.gstin}
                </p>
              </div>
              <div className="btn-stack-mobile pt-1">
                <Link href="/contact" className="btn-navy">
                  Contact Us
                </Link>
                <Link href="/quote" className="btn-primary">
                  Get Free Quote
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm sm:rounded-2xl">
            {primary?.mapEmbedUrl ? (
              <iframe
                title="Office location map"
                src={primary.mapEmbedUrl}
                className="aspect-[4/3] min-h-[220px] w-full border-0 sm:min-h-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center p-6 text-center text-sm text-muted">
                Map not set — add from admin panel
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div>
            <p className="section-label">FAQ</p>
            <h2 className="section-title mt-2">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              Have questions? Find everything you need to know about our services.
            </p>
          </div>
          <FaqList faqs={settings.faqs} />
        </div>
      </section>

      <section className="bg-navy py-8 text-white sm:py-10">
        <div className="site-container">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {settings.services.slice(0, 4).map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <IconBadge icon={s.icon} className="!h-10 !w-10 shrink-0 !bg-red" />
                <p className="text-xs font-bold uppercase tracking-wide sm:text-sm">
                  {s.title.replace(/ \(.*\)/, "")}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-white/10 pt-5 text-center text-sm leading-relaxed text-white/70 sm:mt-8 sm:pt-6 sm:text-base">
            We don&apos;t just move freight.{" "}
            <span className="font-semibold text-gold">
              We move your business forward.
            </span>
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-14 lg:hidden">
        <div className="site-container">
          <p className="section-label">Get Quote</p>
          <h2 className="section-title mt-2">Request an enquiry</h2>
          <div className="mt-5 rounded-xl border border-line bg-white p-4 sm:mt-6 sm:rounded-2xl sm:p-5">
            <QuoteForm compact />
          </div>
        </div>
      </section>
    </>
  );
}
