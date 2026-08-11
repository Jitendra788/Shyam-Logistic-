import type { Metadata } from "next";
import { SEO_KEYWORDS, absoluteUrl } from "@/lib/seo";

export function pageMeta({
  title,
  description,
  path,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords: [...SEO_KEYWORDS, ...keywords],
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      type: "website",
      siteName: "SHYAM LOGISTIC",
      locale: "en_IN",
      images: [
        {
          url: absoluteUrl("/brand/hero.jpg"),
          width: 1200,
          height: 630,
          alt: `${title} | SHYAM LOGISTIC`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/brand/hero.jpg")],
    },
  };
}
