import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/page-meta";
import { buildBreadcrumbJsonLd } from "@/lib/schema";
import { getSettings, formatLocation, getPrimaryLocation } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title:
    "shyamlogistic Official Site | SHYAM LOGISTIC Sangli Maharashtra",
  description:
    "shyamlogistic is the official brand name for SHYAM LOGISTIC in Sangli, Maharashtra (Founder Mohanlal, GSTIN 27AXGPL2293R1ZP). Book FTL, PTL and pan-India freight at www.shyamlogistic.online — not affiliated with other similarly named firms.",
  path: "/shyamlogistic",
  keywords: [
    "shyamlogistic official",
    "shyamlogistic.online",
    "SHYAM LOGISTIC Sangli",
    "shyam logistic Sangli",
    "Mohanlal SHYAM LOGISTIC",
    "27AXGPL2293R1ZP",
  ],
});

export default async function ShyamlogisticBrandPage() {
  const settings = await getSettings();
  const primary = getPrimaryLocation(settings);

  return (
    <div>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "shyamlogistic", path: "/shyamlogistic" },
        ])}
      />
      <PageHero
        eyebrow="Official brand page"
        title="shyamlogistic"
        subtitle={`${settings.companyName} · Sangli, Maharashtra · Founder ${settings.legalName}`}
      />

      <section className="py-12 sm:py-16">
        <div className="site-container max-w-3xl space-y-6 text-base leading-relaxed text-muted">
          <h2 className="section-title">What is shyamlogistic?</h2>
          <p>
            <strong className="text-navy">shyamlogistic</strong> is the primary
            online brand and search name for{" "}
            <strong className="text-navy">{settings.companyName}</strong>, a
            GST-registered logistics company based in Sangli, Maharashtra. The
            official website is{" "}
            <strong className="text-navy">www.shyamlogistic.online</strong>.
          </p>
          <p>
            Founder: <strong className="text-navy">{settings.legalName}</strong>.
            GSTIN:{" "}
            <strong className="text-navy">{settings.gstin}</strong>. Phone:{" "}
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
            .
          </p>

          <h2 className="section-title pt-4">Registered office</h2>
          <p>
            {primary ? formatLocation(primary) : "Sangli, Maharashtra, India"}
          </p>
          <p>
            We move full truck load (FTL), part truck load (PTL), express cargo,
            and pan-India freight with transparent GST billing.
          </p>

          <h2 className="section-title pt-4">How to find the right company</h2>
          <p>
            Other businesses may use similar words such as “Shyam” or
            “logistics” in different cities. To reach this company, always use:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Website:{" "}
              <strong className="text-navy">www.shyamlogistic.online</strong>
            </li>
            <li>
              Brand: <strong className="text-navy">shyamlogistic</strong> /{" "}
              <strong className="text-navy">SHYAM LOGISTIC</strong>
            </li>
            <li>
              City: <strong className="text-navy">Sangli, Maharashtra</strong>
            </li>
            <li>
              GSTIN:{" "}
              <strong className="text-navy">{settings.gstin}</strong>
            </li>
            <li>
              Founder:{" "}
              <strong className="text-navy">{settings.legalName}</strong>
            </li>
          </ul>
          <p>
            {settings.companyName} (shyamlogistic) is not affiliated with other
            similarly named logistics firms in other states. Book only through
            this official website or the phone numbers listed above.
          </p>

          <div className="btn-stack-mobile pt-4">
            <Link href="/quote" className="btn-primary">
              Get free quote
            </Link>
            <Link href="/contact" className="btn-navy">
              Contact shyamlogistic
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
