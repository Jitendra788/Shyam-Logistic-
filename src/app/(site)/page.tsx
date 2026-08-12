import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { IconBadge } from "@/components/IconBadge";
import { ServiceGrid } from "@/components/ServiceGrid";
import { BlogCard } from "@/components/BlogCard";

const FaqList = dynamic(
  () => import("@/components/FaqList").then((m) => m.FaqList),
  { loading: () => <div className="min-h-48 rounded-xl border border-line bg-white" /> }
);

const QuoteForm = dynamic(
  () => import("@/components/QuoteForm").then((m) => m.QuoteForm),
  { loading: () => <div className="min-h-64 rounded-xl border border-line bg-white" /> }
);
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
          src={settings.heroImageUrl || "/brand/hero.jpg"}
          alt={`${settings.companyName} freight logistics`}
          fill
          preload
          quality={70}
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
            <p className="section-label !text-gold">
              {settings.heroEyebrow}
            </p>
            <h1 className="mt-3 font-display text-[2.1rem] font-bold leading-[1.08] tracking-tight sm:mt-4 sm:text-5xl md:text-6xl lg:text-[4.1rem]">
              {settings.heroHeadline.split(" ").slice(0, 2).join(" ")}
              <span className="text-red">
                {" "}
                {settings.heroHeadline.split(" ").slice(2).join(" ")}
              </span>
            </h1>
            <p className="mt-3 text-sm font-medium text-white/95 sm:mt-4 sm:text-base md:text-lg">
              {settings.hindiTagline}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base md:text-lg">
              {settings.heroSubtext}
            </p>

            <div className="btn-stack-mobile mt-7 sm:mt-8">
              <Link href="/quote" className="btn-primary">
                Get Free Quote
              </Link>
              <Link href="/services" className="btn-secondary">
                Our Services
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2.5 sm:mt-10 sm:gap-4">
              {settings.attributes.map((attr) => (
                <div
                  key={attr.title}
                  className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1.5 sm:gap-2.5 sm:px-3 sm:py-2"
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

          <div className="mt-10 w-full max-w-md rounded-xl border border-white/15 bg-navy-deep/90 p-3.5 sm:mt-14 sm:p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold sm:text-[11px] sm:tracking-[0.16em]">
              Founder · {settings.legalName} · Sangli
            </p>
            <p className="mt-1 text-xs text-white/70">
              Official site: www.shyamlogistic.online
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
              <a
                href={`tel:+91${settings.phone.replace(/\D/g, "")}`}
                aria-label={`Call ${settings.phone}`}
                className="flex min-h-11 items-center justify-center rounded-lg bg-red px-2 text-center text-sm font-bold tabular-nums text-white"
              >
                {settings.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
              </a>
              {settings.phone2 ? (
                <a
                  href={`tel:+91${settings.phone2.replace(/\D/g, "")}`}
                  aria-label={`Call ${settings.phone2}`}
                  className="flex min-h-11 items-center justify-center rounded-lg bg-white/15 px-2 text-center text-sm font-bold tabular-nums text-white ring-1 ring-white/20"
                >
                  {settings.phone2.replace(/(\d{5})(\d{5})/, "$1 $2")}
                </a>
              ) : null}
            </div>
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
            <p className="section-label">{settings.homeServicesLabel}</p>
            <h2 className="section-title mt-2">
              {settings.homeServicesTitle}
            </h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              {settings.homeServicesIntro}
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
            {settings.homeWhyTitle}
          </h2>
          <div className="prose-like mt-6 space-y-4 text-sm leading-relaxed text-muted sm:text-base">
            {(settings.homeWhyBody || "")
              .split("\n\n")
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p) => (
                <p key={p.slice(0, 40)}>{p}</p>
              ))}
            <p>
              Call{" "}
              <a
                href={`tel:+91${settings.phone.replace(/\D/g, "")}`}
                className="font-semibold text-red hover:underline"
              >
                {settings.phone}
              </a>
              {settings.phone2 ? (
                <>
                  {" / "}
                  <a
                    href={`tel:+91${settings.phone2.replace(/\D/g, "")}`}
                    className="font-semibold text-red hover:underline"
                  >
                    {settings.phone2}
                  </a>
                </>
              ) : null}
              . Founder: {settings.legalName}. GSTIN: {settings.gstin}.
            </p>
          </div>
          <div className="btn-stack-mobile mt-8 justify-center">
            <Link href="/quote" className="btn-primary">
              Get a free quote
            </Link>
            <Link href="/contact" className="btn-navy">
              Contact us
            </Link>
          </div>
        </div>
      </section>

      {latestPosts.length > 0 && (
        <section className="border-t border-line bg-white py-12 sm:py-16 md:py-20">
          <div className="site-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div className="max-w-xl">
                <p className="section-label">{settings.homeBlogLabel}</p>
                <h2 className="section-title mt-2">{settings.homeBlogTitle}</h2>
                <p className="mt-2 text-sm text-muted sm:mt-3 sm:text-base">
                  {settings.homeBlogIntro}
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
            <p className="section-label">{settings.homeVisitLabel}</p>
            <h2 className="section-title mt-2">{settings.homeVisitTitle}</h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              {settings.homeVisitIntro}
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
            <p className="section-label">{settings.homeFaqLabel}</p>
            <h2 className="section-title mt-2">{settings.homeFaqTitle}</h2>
            <p className="mt-3 text-sm text-muted sm:mt-4 sm:text-base">
              {settings.homeFaqIntro}
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
              {settings.slogan || "We move your business forward."}
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
