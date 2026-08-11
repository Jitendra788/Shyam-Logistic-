import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { FeatureGrid, ServiceGrid } from "@/components/ServiceGrid";
import { pageMeta } from "@/lib/page-meta";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "Services | FTL, PTL, Express Delivery and Supply Chain",
  description:
    "SHYAM LOGISTIC services: full truck load, part truck load, express delivery, warehousing, and supply-chain solutions. Book online at www.shyamlogistic.online.",
  path: "/services",
  keywords: [
    "SHYAM LOGISTIC services",
    "shyamlogistic services",
    "FTL transport India",
    "PTL transport",
    "express delivery logistics",
  ],
});

export default async function ServicesPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHero
        eyebrow={settings.servicesHeroEyebrow}
        title={settings.servicesHeroTitle}
        subtitle={
          settings.servicesHeroSubtitle ||
          `At ${settings.companyName}, we specialize in reliable logistics solutions across India.`
        }
      />

      {/* What We Deliver — Highway numbered specialty grid */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">{settings.servicesSpecializedLabel}</p>
            <h2 className="section-title mt-2">
              {settings.servicesSpecializedTitle}
            </h2>
            <p className="mt-4 text-muted">
              {settings.servicesSpecializedIntro || settings.hindiTagline}
            </p>
          </div>
          <div className="mt-10">
            <ServiceGrid services={settings.specializedServices} numbered />
          </div>
        </div>
      </section>

      {/* Additional Services — Highway second grid */}
      <section className="bg-sand py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">{settings.servicesAdditionalLabel}</p>
            <h2 className="section-title mt-2">
              {settings.servicesAdditionalTitle}
            </h2>
            <p className="mt-4 text-muted">
              {settings.servicesAdditionalIntro}
            </p>
          </div>
          <div className="mt-10">
            <ServiceGrid services={settings.additionalServices} />
          </div>
        </div>
      </section>

      {/* Core logistics offerings */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">{settings.servicesCoreLabel}</p>
            <h2 className="section-title mt-2">
              {settings.servicesCoreTitle}
            </h2>
          </div>
          <div className="mt-10">
            <ServiceGrid services={settings.services} />
          </div>

          <div className="mt-14 rounded-2xl bg-navy px-8 py-10 text-white sm:px-10">
            <h3 className="font-display text-3xl font-bold">
              Need a custom service plan?
            </h3>
            <p className="mt-3 max-w-xl text-white/70">
              Tell us your route, cargo type, and timeline — we will respond with
              a clear quote.
            </p>
            <Link href="/quote" className="btn-primary mt-6 inline-flex">
              Get Free Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Feature strip for parity */}
      <section className="border-t border-line bg-white py-16">
        <div className="site-container">
          <p className="section-label text-center">Why book with us</p>
          <h2 className="section-title mt-2 text-center text-3xl sm:text-4xl">
            Speed · Safety · Precision
          </h2>
          <div className="mt-10">
            <FeatureGrid features={settings.features.slice(0, 3)} />
          </div>
        </div>
      </section>
    </div>
  );
}
