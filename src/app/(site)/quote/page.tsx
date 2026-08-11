import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "@/components/QuoteForm";
import { pageMeta } from "@/lib/page-meta";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "Get a Free Freight Quote | Book Cargo Online",
  description:
    "Request a free logistics quote from SHYAM LOGISTIC. FTL, PTL and express cargo rates for routes across India. Fast callback from our Sangli team.",
  path: "/quote",
  keywords: ["free freight quote", "cargo booking form", "truck rate India"],
});

export default async function QuotePage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHero
        eyebrow="Free Quote"
        title="Get a Quote"
        subtitle={`Share your route and cargo details. The ${settings.companyName} team will call you back with pricing and timelines.`}
      />

      <section className="py-10 sm:py-14 md:py-16">
        <div className="site-container max-w-3xl">
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <QuoteForm />
          </div>
          <p className="mt-6 text-sm text-muted">
            Prefer speaking directly? Call{" "}
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="font-semibold text-navy hover:underline"
            >
              {settings.phone}
            </a>
            {settings.phone2 && (
              <>
                {" / "}
                <a
                  href={`tel:${settings.phone2.replace(/\s/g, "")}`}
                  className="font-semibold text-navy hover:underline"
                >
                  {settings.phone2}
                </a>
              </>
            )}{" "}
            or email{" "}
            <a
              href={`mailto:${settings.email}`}
              className="font-semibold text-navy hover:underline"
            >
              {settings.email}
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
