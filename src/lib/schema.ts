import { formatLocation, getPrimaryLocation } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export function buildOrganizationJsonLd(settings: SiteSettings) {
  const primary = getPrimaryLocation(settings);
  const site = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "LocalBusiness", "MovingCompany"],
    "@id": `${site}/#organization`,
    name: "shyamlogistic",
    legalName: settings.legalName,
    alternateName: [
      "SHYAM LOGISTIC",
      "shyam logistic",
      "Shyam Logistic",
      "Shyam Logistics",
      "SHYAM LOGISTICS",
      "shyamlogistic.online",
      "www.shyamlogistic.online",
      settings.companyName,
    ],
    brand: {
      "@type": "Brand",
      name: "shyamlogistic",
      alternateName: settings.companyName,
      logo: absoluteUrl(settings.logoUrl || "/brand/shyam-logo.png"),
      url: site,
    },
    description: `shyamlogistic is the official website of SHYAM LOGISTIC. ${settings.description}`,
    url: site,
    logo: absoluteUrl(settings.logoUrl || "/brand/shyam-logo.png"),
    image: absoluteUrl("/brand/hero.jpg"),
    email: settings.email,
    telephone: [`+91${settings.phone.replace(/\D/g, "")}`],
    ...(settings.phone2
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              telephone: `+91${settings.phone.replace(/\D/g, "")}`,
              contactType: "customer service",
              areaServed: "IN",
              availableLanguage: ["en", "hi"],
            },
            {
              "@type": "ContactPoint",
              telephone: `+91${settings.phone2.replace(/\D/g, "")}`,
              contactType: "sales",
              areaServed: "IN",
              availableLanguage: ["en", "hi"],
            },
          ],
        }
      : {}),
    taxID: settings.gstin,
    vatID: settings.gstin,
    foundingLocation: primary
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            streetAddress: [primary.addressLine1, primary.addressLine2]
              .filter(Boolean)
              .join(", "),
            addressLocality: primary.city,
            addressRegion: primary.state,
            postalCode: primary.pincode,
            addressCountry: "IN",
          },
        }
      : undefined,
    address: primary
      ? {
          "@type": "PostalAddress",
          streetAddress: [
            primary.addressLine1,
            primary.addressLine2,
            primary.locality,
          ]
            .filter(Boolean)
            .join(", "),
          addressLocality: primary.city,
          addressRegion: primary.state,
          postalCode: primary.pincode,
          addressCountry: "IN",
        }
      : undefined,
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    priceRange: "$$",
    openingHours: "Mo-Sa 09:00-19:00",
    slogan: settings.slogan,
    knowsAbout: [
      "shyamlogistic",
      "SHYAM LOGISTIC",
      "Full Truck Load",
      "Part Truck Load",
      "Express Delivery",
      "Supply Chain Solutions",
      "Warehousing",
      "Road Freight India",
      "Sangli logistics",
    ],
    sameAs: [
      "https://www.shyamlogistic.online",
      "https://shyamlogistic.online",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Logistics Services by shyamlogistic",
      itemListElement: settings.services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.title,
          description: s.description,
          provider: {
            "@type": "Organization",
            name: "shyamlogistic",
            alternateName: settings.companyName,
          },
          areaServed: "IN",
        },
      })),
    },
  };
}

export function buildWebsiteJsonLd(settings: SiteSettings) {
  const site = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site}/#website`,
    name: "shyamlogistic",
    alternateName: ["SHYAM LOGISTIC", "shyam logistic", "Shyam Logistics"],
    url: site,
    description:
      "Official website of shyamlogistic (SHYAM LOGISTIC). Book freight online at www.shyamlogistic.online",
    inLanguage: ["en-IN", "hi-IN"],
    publisher: {
      "@id": `${site}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${site}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildFaqJsonLd(settings: SiteSettings) {
  if (!settings.faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: settings.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function formatPrimaryAddress(settings: SiteSettings): string {
  const primary = getPrimaryLocation(settings);
  return primary ? formatLocation(primary) : "";
}
