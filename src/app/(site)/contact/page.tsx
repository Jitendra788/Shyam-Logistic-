import type { Metadata } from "next";
import Link from "next/link";
import { LocationCard } from "@/components/LocationCard";
import { PageHero } from "@/components/PageHero";
import { QuoteForm } from "@/components/QuoteForm";
import { pageMeta } from "@/lib/page-meta";
import { getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "Contact Us | Call 8459858242 | SHYAM LOGISTIC Sangli",
  description:
    "Contact SHYAM LOGISTIC for freight booking. Phone 8459858242 / 9057420562. Office: Shalini Nagar, Sangli 416416. Official site: www.shyamlogistic.online.",
  path: "/contact",
  keywords: [
    "contact SHYAM LOGISTIC",
    "contact shyamlogistic",
    "8459858242",
    "transport office Sangli",
  ],
});

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div>
      <PageHero
        eyebrow="Get in Touch"
        title="Contact Us"
        subtitle="Call, email, or visit our office. All location details are managed from the admin panel and stay current for customers."
      />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-5">
            <div className="card-grid-item">
              <p className="section-label">Phone</p>
              <a
                href={`tel:${settings.phone.replace(/\s/g, "")}`}
                className="mt-2 block font-display text-2xl font-bold text-navy hover:text-red"
              >
                {settings.phone}
              </a>
              {settings.phone2 && (
                <a
                  href={`tel:${settings.phone2.replace(/\s/g, "")}`}
                  className="mt-1 block font-display text-2xl font-bold text-navy hover:text-red"
                >
                  {settings.phone2}
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-semibold text-success hover:underline"
                >
                  Chat on WhatsApp
                </a>
              )}
            </div>

            <div className="card-grid-item">
              <p className="section-label">Email</p>
              <a
                href={`mailto:${settings.email}`}
                className="mt-2 block text-lg font-semibold text-navy hover:text-red"
              >
                {settings.email}
              </a>
              <p className="mt-3 text-sm text-muted">{settings.workingHours}</p>
            </div>

            <div className="card-grid-item">
              <p className="section-label">GST Information</p>
              <p className="mt-2 font-semibold tracking-wide text-navy">
                GST No: {settings.gstin}
              </p>
              <p className="mt-2 text-sm text-muted">
                Proprietor: {settings.legalName}
              </p>
            </div>

            <Link href="/quote" className="btn-primary inline-flex">
              Get Free Quote
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="section-title text-3xl">Our locations</h2>
              <p className="mt-2 text-sm text-muted">
                Addresses & maps — editable from Admin → Site Settings.
              </p>
            </div>
            {settings.locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand py-16">
        <div className="site-container max-w-3xl">
          <p className="section-label">Enquiry</p>
          <h2 className="section-title mt-2 text-3xl sm:text-4xl">
            Send us a message
          </h2>
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
            <QuoteForm />
          </div>
        </div>
      </section>
    </div>
  );
}
