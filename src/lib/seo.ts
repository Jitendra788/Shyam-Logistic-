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
  // Brand + domain (primary)
  "shyamlogistic",
  "shyamlogistic.online",
  "www.shyamlogistic.online",
  "shyamlogistic official",
  "SHYAM LOGISTIC",
  "SHYAM LOGISTIC Sangli",
  "shyam logistic Sangli",
  "shyamlogistic Sangli",
  "shyamlogistic Maharashtra",
  "shyam logistic",
  "shyam logistic company",
  "shyam logistic transport",
  // Services
  "full truck load FTL Sangli",
  "part truck load PTL Maharashtra",
  "express cargo delivery India",
  "pan India logistics Sangli",
  "goods transport company Sangli",
  "road transport service Maharashtra",
  "freight booking Sangli",
  // Local / owner (disambiguation)
  "logistic company Sangli",
  "transport service Sangli",
  "cargo booking Sangli",
  "truck transport Maharashtra",
  "GST logistics Sangli",
  "Mohanlal logistics Sangli",
  "Mohanlal transport Sangli",
  "27AXGPL2293R1ZP",
];

export const SEO_BRAND = "shyamlogistic";

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Default marketing description with unique brand + locality signals */
export function brandDescription(settings: {
  description: string;
  phone: string;
  phone2?: string;
  gstin: string;
  hindiTagline?: string;
}): string {
  return (
    `shyamlogistic.online is the official website of SHYAM LOGISTIC, Sangli, Maharashtra. ` +
    `Search shyamlogistic for our FTL, PTL and pan-India freight. Founder Mohanlal · GSTIN ${settings.gstin}. ` +
    `Call ${settings.phone}${settings.phone2 ? ` / ${settings.phone2}` : ""}. ` +
    `${settings.hindiTagline || ""}`
  ).trim();
}
