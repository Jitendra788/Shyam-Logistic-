import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { FeatureGrid } from "@/components/ServiceGrid";
import { pageMeta } from "@/lib/page-meta";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "About Us — Trusted Logistics Partner in Sangli",
  description:
    "About SHYAM LOGISTIC, proprietorship of Mohanlal (GSTIN 27AXGPL2293R1ZP). Reliable FTL, PTL and pan-India freight from Sangli, Maharashtra.",
  path: "/about",
  keywords: ["about Shyam Logistic", "Mohanlal transport", "GST logistics Sangli"],
});

export default async function AboutPage() {
  const settings = await getSettings();
  const paragraphs = settings.aboutText.split("\n\n").filter(Boolean);

  return (
    <div>
      <PageHero
        eyebrow="Our Journey"
        title="Our Story"
        subtitle="From humble beginnings to becoming a trusted logistics partner — discover our journey of reliability and service."
      />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
          <div className="prose-like max-w-2xl">
            <p className="section-label">About {settings.companyName}</p>
            <h2 className="section-title mt-2 ">
              Building Trust Through Excellence
            </h2>
            {paragraphs.map((p) => (
              <p
                key={p.slice(0, 48)}
                className="mt-5 text-base leading-relaxed text-muted"
              >
                {p}
              </p>
            ))}
            <p className="mt-5 text-base leading-relaxed text-muted">
              {settings.missionText}
            </p>
            <Link href="/quote" className="btn-primary mt-8 inline-flex">
              Get Free Quote
            </Link>
          </div>

          <aside className="rounded-2xl border border-line bg-white p-7 shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy font-display text-xl font-bold text-white">
              {settings.legalName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </div>
            <p className="mt-5 font-display text-2xl font-bold text-navy">
              {settings.legalName}
            </p>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.14em] text-red">
              Proprietor · {settings.companyName}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              At {settings.companyName}, logistics is not just about moving
              goods — it is about building trust and enabling growth.
            </p>
            <div className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <p>
                <span className="text-muted">Phone: </span>
                <a
                  href={`tel:${settings.phone}`}
                  className="font-semibold text-navy"
                >
                  {settings.phone}
                </a>
                {settings.phone2 && (
                  <>
                    {" / "}
                    <a
                      href={`tel:${settings.phone2}`}
                      className="font-semibold text-navy"
                    >
                      {settings.phone2}
                    </a>
                  </>
                )}
              </p>
              <p>
                <span className="text-muted">GSTIN: </span>
                <span className="font-semibold text-navy">{settings.gstin}</span>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-sand py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="max-w-2xl">
            <p className="section-label">Why Choose Us</p>
            <h2 className="section-title mt-2 ">
              Experience, dedication & delivery
            </h2>
            <p className="mt-4 text-muted">
              We combine experience and dedication to deliver exceptional
              logistics solutions.
            </p>
          </div>
          <div className="mt-10">
            <FeatureGrid features={settings.features} />
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <p className="section-label">Our Achievements</p>
          <h2 className="section-title mt-2 ">
            Numbers that reflect trust
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-4">
            {settings.stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-line bg-white p-6 text-center"
              >
                <p className="font-display text-4xl font-bold text-red">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-navy">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
