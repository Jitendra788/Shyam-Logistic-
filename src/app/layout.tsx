import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { getSettings } from "@/lib/store";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  formatPrimaryAddress,
} from "@/lib/schema";
import { SEO_KEYWORDS, absoluteUrl, brandDescription, getSiteUrl } from "@/lib/seo";
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
  weight: ["500", "600", "700"],
});

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const site = getSiteUrl();
  const title =
    "SHYAM LOGISTIC | FTL, PTL and Transport Across India";
  const description = brandDescription(settings);
  const address = formatPrimaryAddress(settings);
  const verification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

  return {
    metadataBase: new URL(site),
    title: {
      default: title,
      template: `%s | SHYAM LOGISTIC`,
    },
    description,
    keywords: SEO_KEYWORDS,
    authors: [{ name: "SHYAM LOGISTIC" }],
    creator: "SHYAM LOGISTIC",
    publisher: "SHYAM LOGISTIC",
    category: "Logistics",
    applicationName: "SHYAM LOGISTIC",
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
      siteName: "SHYAM LOGISTIC",
      title,
      description,
      images: [
        {
          url: absoluteUrl("/brand/hero.jpg"),
          width: 1200,
          height: 630,
          alt: "SHYAM LOGISTIC freight and logistics services across India",
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
      "geo.region": "IN-MH",
      "geo.placename": address || "Sangli, Maharashtra",
      "business:contact_data:street_address": address,
      "business:contact_data:locality": "Sangli",
      "business:contact_data:region": "Maharashtra",
      "business:contact_data:postal_code": "416416",
      "business:contact_data:country_name": "India",
      "business:contact_data:email": settings.email,
      "business:contact_data:phone_number": settings.phone,
    },
    verification: verification
      ? {
          google: verification,
        }
      : undefined,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();

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
          ]}
        />
        {children}
      </body>
    </html>
  );
}
