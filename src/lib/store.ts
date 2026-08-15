import { promises as fs } from "fs";
import path from "path";
import type { BlogPost, Enquiry, SiteSettings } from "./types";

const dataDir = path.join(process.cwd(), "data");
const settingsPath = path.join(dataDir, "settings.json");
const enquiriesPath = path.join(dataDir, "enquiries.json");
const postsPath = path.join(dataDir, "posts.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

const settingsDefaults: Partial<SiteSettings> = {
  logoUrl: "/brand/shyam-brand-logo.webp",
  founderImageUrl: "/brand/mohanlal.jpg",
  heroImageUrl: "/brand/hero.jpg",
  alsoKnownAs: ["Shree Shyam Logistics", "Shree Shyam Logistic"],
  homeServicesLabel: "What we offer",
  homeServicesTitle: "Logistics solutions",
  homeServicesIntro: "",
  homeWhyTitle: "Why choose us?",
  homeWhyBody: "",
  homeVisitLabel: "Visit Our Office",
  homeVisitTitle: "Ready to move your cargo?",
  homeVisitIntro: "",
  homeBlogLabel: "Blog",
  homeBlogTitle: "Insights and freight tips",
  homeBlogIntro: "",
  homeFaqLabel: "FAQ",
  homeFaqTitle: "Frequently Asked Questions",
  homeFaqIntro: "",
  aboutHeroEyebrow: "Our Journey",
  aboutHeroTitle: "Our Story",
  aboutHeroSubtitle: "",
  aboutSectionTitle: "Building Trust Through Excellence",
  servicesHeroEyebrow: "Complete Logistics Solutions",
  servicesHeroTitle: "Our Services",
  servicesHeroSubtitle: "",
  servicesSpecializedLabel: "What We Deliver",
  servicesSpecializedTitle: "Specialized transportation",
  servicesSpecializedIntro: "",
  servicesAdditionalLabel: "Additional Services",
  servicesAdditionalTitle: "End-to-end solutions",
  servicesAdditionalIntro: "",
  servicesCoreLabel: "Core offerings",
  servicesCoreTitle: "Full Truck Load to Supply Chain",
  contactHeroEyebrow: "Get in Touch",
  contactHeroTitle: "Contact Us",
  contactHeroSubtitle: "",
};

export async function getSettings(): Promise<SiteSettings> {
  const raw = await fs.readFile(settingsPath, "utf-8");
  const data = JSON.parse(raw) as SiteSettings;
  let logoUrl = data.logoUrl?.trim() || "";
  if (
    !logoUrl ||
    logoUrl === "/brand/shyam-logo.png" ||
    logoUrl === "/brand/shyam-brand-logo.png" ||
    logoUrl === "/brand/logo.png" ||
    logoUrl === "/brand/logo.svg"
  ) {
    logoUrl = "/brand/shyam-brand-logo.webp";
  }
  return {
    ...settingsDefaults,
    ...data,
    logoUrl,
    founderImageUrl: data.founderImageUrl || "/brand/mohanlal.jpg",
    heroImageUrl: data.heroImageUrl || "/brand/hero.jpg",
    alsoKnownAs:
      Array.isArray(data.alsoKnownAs) && data.alsoKnownAs.length
        ? data.alsoKnownAs
        : settingsDefaults.alsoKnownAs || [],
  };
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

export async function getEnquiries(): Promise<Enquiry[]> {
  try {
    const raw = await fs.readFile(enquiriesPath, "utf-8");
    return JSON.parse(raw) as Enquiry[];
  } catch {
    return [];
  }
}

export async function saveEnquiries(enquiries: Enquiry[]): Promise<boolean> {
  try {
    await ensureDataDir();
    await fs.writeFile(enquiriesPath, JSON.stringify(enquiries, null, 2), "utf-8");
    return true;
  } catch {
    // Vercel serverless FS is read-only — email notify still delivers the lead.
    return false;
  }
}

export async function addEnquiry(
  input: Omit<Enquiry, "id" | "status" | "createdAt">
): Promise<{ enquiry: Enquiry; saved: boolean }> {
  const enquiry: Enquiry = {
    ...input,
    id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  try {
    const enquiries = await getEnquiries();
    enquiries.unshift(enquiry);
    const saved = await saveEnquiries(enquiries);
    return { enquiry, saved };
  } catch {
    return { enquiry, saved: false };
  }
}

export function formatLocation(loc: SiteSettings["locations"][number]): string {
  return [
    loc.addressLine1,
    loc.addressLine2,
    loc.locality,
    `${loc.city}, ${loc.state} ${loc.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getPrimaryLocation(settings: SiteSettings) {
  return settings.locations.find((l) => l.isPrimary) ?? settings.locations[0];
}

export async function getPosts(): Promise<BlogPost[]> {
  try {
    const raw = await fs.readFile(postsPath, "utf-8");
    return JSON.parse(raw) as BlogPost[];
  } catch {
    return [];
  }
}

export async function savePosts(posts: BlogPost[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(postsPath, JSON.stringify(posts, null, 2), "utf-8");
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getPosts();
  return posts
    .filter((p) => p.published)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function getPostBySlug(
  slug: string,
  onlyPublished = true
): Promise<BlogPost | undefined> {
  const posts = await getPosts();
  return posts.find(
    (p) => p.slug === slug && (!onlyPublished || p.published)
  );
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
