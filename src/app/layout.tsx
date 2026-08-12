import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { getSettings } from "@/lib/store";
import {
  buildFaqJsonLd,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  formatPrimaryAddress,
} from "@/lib/schema";
import {
  SEO_KEYWORDS,
  absoluteUrl,
  brandDescription,
  getSiteUrl,
} from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a1f3d",
};

const display = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: true,
});

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const site = getSiteUrl();
  const title = `shyamlogistic.online | Call ${settings.phone}${settings.phone2 ? ` / ${settings.phone2}` : ""} | SHYAM LOGISTIC Sangli`;
  const description = brandDescription(settings);
  const address = formatPrimaryAddress(settings);
  // HTML tag verification for Google Search Console (public meta; safe to ship)
  const verification =
    process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
    "8WNzFDB0O1ePiN1_zGWBMYBRYu8uLb6rIUHj9F1gdl8";

  return {
    metadataBase: new URL(site),
    title: {
      default: title,
      template: `%s | shyamlogistic`,
    },
    description,
    keywords: SEO_KEYWORDS,
    authors: [{ name: "shyamlogistic" }, { name: "SHYAM LOGISTIC" }],
    creator: "shyamlogistic",
    publisher: "SHYAM LOGISTIC",
    category: "Logistics",
    applicationName: "shyamlogistic",
    alternates: {
      canonical: "/",
      languages: {
        "en-IN": site,
        "x-default": site,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: site,
      siteName: "shyamlogistic",
      title,
      description,
      images: [
        {
          url: absoluteUrl("/brand/hero.jpg"),
          width: 1200,
          height: 630,
          alt: "shyamlogistic — SHYAM LOGISTIC freight and logistics across India",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/brand/hero.jpg")],
    },
    other: {
      "llms-txt": "/llms.txt",
      "geo.region": "IN-MH",
      "geo.placename": address || "Sangli, Maharashtra",
      "business:contact_data:street_address": address,
      "business:contact_data:locality": "Sangli",
      "business:contact_data:region": "Maharashtra",
      "business:contact_data:postal_code": "416416",
      "business:contact_data:country_name": "India",
      "business:contact_data:email": settings.email,
      "business:contact_data:phone_number": settings.phone,
      "og:phone_number": settings.phone,
      ...(settings.phone2
        ? { "business:contact_data:phone_number:alt": settings.phone2 }
        : {}),
    },
    verification: {
      google: verification,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const faqLd = buildFaqJsonLd(settings);

  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col antialiased"
        suppressHydrationWarning
      >
        <JsonLd
          data={[
            buildOrganizationJsonLd(settings),
            buildWebsiteJsonLd(settings),
            ...(faqLd ? [faqLd] : []),
          ]}
        />
        {children}
      </body>
    </html>
  );
}
