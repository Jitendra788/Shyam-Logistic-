export type Location = {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  mapEmbedUrl: string;
  isPrimary: boolean;
};

export type ServiceItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type StatItem = {
  label: string;
  value: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FeatureItem = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export type SiteSettings = {
  companyName: string;
  legalName: string;
  brandShort: string;
  /** Local / directory trade names (helps Google match Justdial etc.) */
  alsoKnownAs: string[];
  /** Custom logo image URL (empty = official Shyam logo) */
  logoUrl: string;
  /** Founder portrait shown on About page */
  founderImageUrl: string;
  /** Home hero background image */
  heroImageUrl: string;
  tagline: string;
  hindiTagline: string;
  slogan: string;
  description: string;
  aboutText: string;
  missionText: string;
  gstin: string;
  email: string;
  phone: string;
  phone2: string;
  whatsapp: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtext: string;
  /** Editable section copy (admin) */
  homeServicesLabel: string;
  homeServicesTitle: string;
  homeServicesIntro: string;
  homeWhyTitle: string;
  homeWhyBody: string;
  homeVisitLabel: string;
  homeVisitTitle: string;
  homeVisitIntro: string;
  homeBlogLabel: string;
  homeBlogTitle: string;
  homeBlogIntro: string;
  homeFaqLabel: string;
  homeFaqTitle: string;
  homeFaqIntro: string;
  aboutHeroEyebrow: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutSectionTitle: string;
  servicesHeroEyebrow: string;
  servicesHeroTitle: string;
  servicesHeroSubtitle: string;
  servicesSpecializedLabel: string;
  servicesSpecializedTitle: string;
  servicesSpecializedIntro: string;
  servicesAdditionalLabel: string;
  servicesAdditionalTitle: string;
  servicesAdditionalIntro: string;
  servicesCoreLabel: string;
  servicesCoreTitle: string;
  contactHeroEyebrow: string;
  contactHeroTitle: string;
  contactHeroSubtitle: string;
  locations: Location[];
  /** Main logistics solutions (FTL, PTL, etc.) */
  services: ServiceItem[];
  /** Specialized / cargo-type services ("What We Deliver") */
  specializedServices: ServiceItem[];
  /** Extra services block on services page */
  additionalServices: ServiceItem[];
  features: FeatureItem[];
  attributes: { title: string; icon: string }[];
  stats: StatItem[];
  faqs: FaqItem[];
  workingHours: string;
  footerNote: string;
};

export type EnquiryStatus = "new" | "contacted" | "closed";

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  company: string;
  fromCity: string;
  toCity: string;
  cargoType: string;
  weight: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  coverImage: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};
