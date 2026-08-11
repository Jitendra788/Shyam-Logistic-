import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/page-meta";
import { buildBreadcrumbJsonLd } from "@/lib/schema";
import { getSettings, formatLocation, getPrimaryLocation } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title:
    "shyamlogistic = SHYAM LOGISTIC / Shree Shyam Logistics Sangli | Official",
  description:
    "shyamlogistic is the official website brand of SHYAM LOGISTIC, Sangli (also listed as Shree Shyam Logistics). Founder Mohanlal, GSTIN 27AXGPL2293R1ZP. Office: Shalini Nagar / Kupwad. Book at www.shyamlogistic.online.",
  path: "/shyamlogistic",
  keywords: [
    "shyamlogistic official",
    "shyamlogistic.online",
    "SHYAM LOGISTIC Sangli",
    "Shree Shyam Logistics Sangli",
    "Shree Shyam Logistic Kupwad",
    "Mohanlal SHYAM LOGISTIC",
    "27AXGPL2293R1ZP",
  ],
});

export default async function ShyamlogisticBrandPage() {
  const settings = await getSettings();
  const primary = getPrimaryLocation(settings);
  const aka = settings.alsoKnownAs?.length
    ? settings.alsoKnownAs
    : ["Shree Shyam Logistics"];

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
        subtitle={`${settings.companyName} · also known as ${aka[0]} · Sangli`}
      />

      <section className="py-12 sm:py-16">
        <div className="site-container max-w-3xl space-y-6 text-base leading-relaxed text-muted">
          <h2 className="section-title">What is shyamlogistic?</h2>
          <p>
            <strong className="text-navy">shyamlogistic</strong> is the primary
            online brand for{" "}
            <strong className="text-navy">{settings.companyName}</strong>. Our
            official website is{" "}
            <strong className="text-navy">www.shyamlogistic.online</strong>.
          </p>
          <p>
            In Sangli local directories (such as Justdial / maps), the same
            business is often listed as{" "}
            <strong className="text-navy">{aka.join(", ")}</strong>. That is
            our local trade name. Online booking and brand search should use{" "}
            <strong className="text-navy">shyamlogistic.online</strong>.
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

          <h2 className="section-title pt-4">Sangli / Kupwad office</h2>
          <p>
            {primary ? formatLocation(primary) : "Sangli, Maharashtra, India"}
          </p>

          <h2 className="section-title pt-4">If Google shows Justdial first</h2>
          <p>
            Google often shows directory pages before a new website is fully
            indexed. Open our official site, or request your Google Business
            Profile and Justdial listing to set website ={" "}
            <strong className="text-navy">https://www.shyamlogistic.online</strong>
            .
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Official site:{" "}
              <strong className="text-navy">www.shyamlogistic.online</strong>
            </li>
            <li>
              Brand keyword:{" "}
              <strong className="text-navy">shyamlogistic</strong>
            </li>
            <li>
              Company:{" "}
              <strong className="text-navy">{settings.companyName}</strong>
            </li>
            <li>
              Local name:{" "}
              <strong className="text-navy">{aka[0]}</strong>
            </li>
            <li>
              GSTIN:{" "}
              <strong className="text-navy">{settings.gstin}</strong>
            </li>
          </ul>

          <div className="btn-stack-mobile pt-4">
            <Link href="/quote" className="btn-primary">
              Get free quote
            </Link>
            <Link href="/contact" className="btn-navy">
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
