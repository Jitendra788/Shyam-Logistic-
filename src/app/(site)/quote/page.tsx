import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "@/components/QuoteForm";
import { pageMeta } from "@/lib/page-meta";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "Get a Free Quote | Online Freight Booking",
  description:
    "Request a free logistics quote from SHYAM LOGISTIC. FTL, PTL, and express cargo rates across India. Fast callback—book at www.shyamlogistic.online/quote.",
  path: "/quote",
  keywords: [
    "SHYAM LOGISTIC quote",
    "shyamlogistic quote",
    "free freight quote",
    "cargo booking form",
  ],
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
            <QuoteForm
              notifyEmail={settings.email}
              phone={settings.phone}
              phone2={settings.phone2}
              whatsapp={settings.whatsapp}
            />
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
