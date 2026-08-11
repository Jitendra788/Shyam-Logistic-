/**
 * SEO + marketing for https://www.shyamlogistic.online
 * Primary brand keyword: shyamlogistic
 */
export function getSiteUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "https://www.shyamlogistic.online";
  return url.replace(/\/$/, "");
}

/** Primary search keywords for Google / local marketing */
export const SEO_KEYWORDS = [
  // Brand (primary)
  "shyamlogistic",
  "shyam logistic",
  "shyam logistics",
  "SHYAM LOGISTIC",
  "Shyam Logistic",
  "Shyam Logistics",
  "shyamlogistic.online",
  "www.shyamlogistic.online",
  "shyamlogistic sangli",
  "shyam logistic company",
  "shyam logistic transport",
  "shyam logistics india",
  "shyam logistics maharashtra",
  // Services
  "full truck load FTL",
  "part truck load PTL",
  "express cargo delivery India",
  "pan India logistics",
  "goods transport company",
  "supply chain solutions",
  "road transport service",
  "door to door delivery India",
  "industrial cargo transport",
  "freight booking Maharashtra",
  // Local / owner
  "logistic company Sangli",
  "transport service Sangli",
  "cargo booking Sangli",
  "truck transport Maharashtra",
  "GST logistics company",
  "Mohanlal logistics",
  "Mohanlal transport Sangli",
];

export const SEO_BRAND = "shyamlogistic";

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Default marketing description with brand keyword */
export function brandDescription(settings: {
  description: string;
  phone: string;
  phone2?: string;
  gstin: string;
  hindiTagline?: string;
}): string {
  return (
    `shyamlogistic is the official brand of SHYAM LOGISTIC — logistics and transport company in Sangli, Maharashtra. ` +
    `Book FTL, PTL, express cargo, and pan-India freight at www.shyamlogistic.online. ` +
    `Call ${settings.phone}${settings.phone2 ? ` / ${settings.phone2}` : ""}. ` +
    `GSTIN ${settings.gstin}. ${settings.hindiTagline || ""}`
  ).trim();
}
