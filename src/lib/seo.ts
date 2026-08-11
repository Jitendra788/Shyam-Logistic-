/**
 * SEO + marketing site config for Google Search / social sharing.
 * Set NEXT_PUBLIC_SITE_URL to your live domain (e.g. https://shyamlogistic.in)
 */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://shyamlogistic.in";
  return url.replace(/\/$/, "");
}

/** Primary search keywords for Google / local marketing */
export const SEO_KEYWORDS = [
  "SHYAM LOGISTIC",
  "Shyam Logistics Sangli",
  "logistic company Sangli",
  "transport service Sangli",
  "freight booking Maharashtra",
  "full truck load FTL",
  "part truck load PTL",
  "express cargo delivery India",
  "pan India logistics",
  "goods transport company",
  "supply chain solutions",
  "road transport service",
  "cargo booking Sangli",
  "truck transport Maharashtra",
  "GST logistics company",
  "door to door delivery India",
  "industrial cargo transport",
  "Mohanlal logistics",
];

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
