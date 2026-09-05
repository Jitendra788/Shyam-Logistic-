"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  FaqItem,
  FeatureItem,
  Location,
  ServiceItem,
  SiteSettings,
  StatItem,
} from "@/lib/types";

const emptyLocation = (): Location => ({
  id: `loc-${Date.now()}`,
  label: "Branch Office",
  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
  mapEmbedUrl: "",
  isPrimary: false,
});

const emptyService = (): ServiceItem => ({
  id: `svc-${Date.now()}`,
  title: "",
  description: "",
  icon: "truck",
});

const emptyFaq = (): FaqItem => ({
  id: `faq-${Date.now()}`,
  question: "",
  answer: "",
});

const emptyFeature = (): FeatureItem => ({
  id: `f-${Date.now()}`,
  title: "",
  description: "",
  icon: "shield",
});

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<
    "logo" | "founder" | "hero" | null
  >(null);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      const meData = await me.json();
      if (!meData.authenticated) {
        router.replace("/admin/login");
        return;
      }
      const res = await fetch("/api/settings");
      setSettings(await res.json());
    })();
  }, [router]);

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function uploadBrandImage(
    kind: "logo" | "founder" | "hero",
    file: File | null
  ) {
    if (!file) return;
    setUploading(kind);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (kind === "logo") update("logoUrl", data.url);
      else if (kind === "founder") update("founderImageUrl", data.url);
      else update("heroImageUrl", data.url);
      setMessage(
        `${kind === "logo" ? "Logo" : kind === "founder" ? "Founder photo" : "Hero image"} uploaded. Click “Save all changes” to apply on the website.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  function updateLocation(index: number, patch: Partial<Location>) {
    if (!settings) return;
    const locations = settings.locations.map((loc, i) =>
      i === index ? { ...loc, ...patch } : loc
    );
    if (patch.isPrimary) {
      locations.forEach((loc, i) => {
        if (i !== index) loc.isPrimary = false;
      });
    }
    update("locations", locations);
  }

  function updateServiceList(
    key: "services" | "specializedServices" | "additionalServices",
    index: number,
    patch: Partial<ServiceItem>
  ) {
    if (!settings) return;
    const list = settings[key].map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    update(key, list);
  }

  function updateFeature(index: number, patch: Partial<FeatureItem>) {
    if (!settings) return;
    update(
      "features",
      settings.features.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      )
    );
  }

  function updateFaq(index: number, patch: Partial<FaqItem>) {
    if (!settings) return;
    update(
      "faqs",
      settings.faqs.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      )
    );
  }

  function updateStat(index: number, patch: Partial<StatItem>) {
    if (!settings) return;
    update(
      "stats",
      settings.stats.map((item, i) =>
        i === index ? { ...item, ...patch } : item
      )
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.settings) setSettings(data.settings);
      setMessage("Settings saved. Website content updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="text-muted">Loading settings...</p>;
  }

  const founderPreview =
    settings.founderImageUrl?.trim() || "/brand/mohanlal.jpg";

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Full website control</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy">
            Admin Settings
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Change phones, logo, hero image, services, FAQs, home page text, and
            about/services/contact headings here. After editing, click{" "}
            <strong>Save all changes</strong> at the bottom. Manage blog posts
            from <strong>Admin → Blog</strong>.
          </p>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save all changes"}
        </button>
      </div>

      {message && (
        <p className="rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Section title="1) Images — Logo, founder, home hero">
        <p className="text-sm text-muted">
          Phone gallery / laptop file · JPG PNG WebP (max 5 MB) · then{" "}
          <strong>Save all changes</strong>.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          <ImageUploadCard
            title="Company logo"
            help="Header & footer brand mark."
            preview={settings.logoUrl || "/brand/shyam-brand-logo.webp"}
            fallbackLabel="Logo"
            rounded="rounded-xl"
            uploading={uploading === "logo"}
            onPick={(file) => uploadBrandImage("logo", file)}
            onReset={() => update("logoUrl", "/brand/shyam-brand-logo.webp")}
            resetLabel="Default logo"
          />
          <ImageUploadCard
            title="Founder photo"
            help="About page founder card."
            preview={founderPreview}
            fallbackLabel="Founder"
            rounded="rounded-full"
            uploading={uploading === "founder"}
            onPick={(file) => uploadBrandImage("founder", file)}
            onReset={() => update("founderImageUrl", "/brand/mohanlal.jpg")}
            resetLabel="Default photo"
          />
          <ImageUploadCard
            title="Home hero background"
            help="Big image behind home headline."
            preview={settings.heroImageUrl || "/brand/hero.jpg"}
            fallbackLabel="Hero"
            rounded="rounded-xl"
            uploading={uploading === "hero"}
            onPick={(file) => uploadBrandImage("hero", file)}
            onReset={() => update("heroImageUrl", "/brand/hero.jpg")}
            resetLabel="Default hero"
          />
        </div>
      </Section>

      <Section title="2) Company identity & phones">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company name" value={settings.companyName} onChange={(v) => update("companyName", v)} />
          <Field label="Brand short" value={settings.brandShort} onChange={(v) => update("brandShort", v)} />
          <Field label="Founder / legal name" value={settings.legalName} onChange={(v) => update("legalName", v)} />
          <Field label="GSTIN" value={settings.gstin} onChange={(v) => update("gstin", v)} />
          <Field label="Phone 1 (primary)" value={settings.phone} onChange={(v) => update("phone", v)} />
          <Field label="Phone 2" value={settings.phone2} onChange={(v) => update("phone2", v)} />
          <Field label="WhatsApp number" value={settings.whatsapp} onChange={(v) => update("whatsapp", v)} />
          <Field label="Email" value={settings.email} onChange={(v) => update("email", v)} />
          <Field
            label="Gmail App Password (PDF email)"
            value={settings.gmailAppPassword || ""}
            onChange={(v) => update("gmailAppPassword", v)}
            type="password"
          />
          <Field label="Tagline" value={settings.tagline} onChange={(v) => update("tagline", v)} />
          <Field label="Hindi tagline" value={settings.hindiTagline} onChange={(v) => update("hindiTagline", v)} />
          <Field label="Slogan (home banner)" value={settings.slogan} onChange={(v) => update("slogan", v)} />
          <Field label="Working hours" value={settings.workingHours} onChange={(v) => update("workingHours", v)} />
        </div>
        <p className="mt-2 text-sm text-muted">
          Booking/Bill PDF company email se bhejne ke liye: Google Account (
          {settings.email || "company email"}) → Security → 2-Step Verification
          on → App passwords → 16-letter password yahan save karein. Blank save
          karne par pehle wala password same rahega.
          {settings.emailPdfReady
            ? " PDF email ready."
            : ""}
        </p>
        <TextArea
          label="Also known as (comma separated — Justdial names etc.)"
          value={(settings.alsoKnownAs || []).join(", ")}
          onChange={(v) =>
            update(
              "alsoKnownAs",
              v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            )
          }
        />
        <TextArea label="Short description (SEO / footer)" value={settings.description} onChange={(v) => update("description", v)} />
        <TextArea label="About page main text" value={settings.aboutText} onChange={(v) => update("aboutText", v)} />
        <TextArea label="Mission text" value={settings.missionText} onChange={(v) => update("missionText", v)} />
        <Field label="Footer note" value={settings.footerNote} onChange={(v) => update("footerNote", v)} />
      </Section>

      <Section title="3) Home hero text">
        <Field label="Eyebrow (top small line)" value={settings.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
        <Field label="Headline" value={settings.heroHeadline} onChange={(v) => update("heroHeadline", v)} />
        <TextArea label="Subtext" value={settings.heroSubtext} onChange={(v) => update("heroSubtext", v)} />
      </Section>

      <Section title="4) Home page section headings">
        <p className="text-sm text-muted">Edit home page section titles and intro text here.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Services label" value={settings.homeServicesLabel || ""} onChange={(v) => update("homeServicesLabel", v)} />
          <Field label="Services title" value={settings.homeServicesTitle || ""} onChange={(v) => update("homeServicesTitle", v)} />
        </div>
        <TextArea label="Services intro" value={settings.homeServicesIntro || ""} onChange={(v) => update("homeServicesIntro", v)} />
        <Field label="Why choose title" value={settings.homeWhyTitle || ""} onChange={(v) => update("homeWhyTitle", v)} />
        <TextArea label="Why choose body (blank line = new paragraph)" value={settings.homeWhyBody || ""} onChange={(v) => update("homeWhyBody", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Visit label" value={settings.homeVisitLabel || ""} onChange={(v) => update("homeVisitLabel", v)} />
          <Field label="Visit title" value={settings.homeVisitTitle || ""} onChange={(v) => update("homeVisitTitle", v)} />
        </div>
        <TextArea label="Visit intro" value={settings.homeVisitIntro || ""} onChange={(v) => update("homeVisitIntro", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Blog label" value={settings.homeBlogLabel || ""} onChange={(v) => update("homeBlogLabel", v)} />
          <Field label="Blog title" value={settings.homeBlogTitle || ""} onChange={(v) => update("homeBlogTitle", v)} />
        </div>
        <TextArea label="Blog intro" value={settings.homeBlogIntro || ""} onChange={(v) => update("homeBlogIntro", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="FAQ label" value={settings.homeFaqLabel || ""} onChange={(v) => update("homeFaqLabel", v)} />
          <Field label="FAQ title" value={settings.homeFaqTitle || ""} onChange={(v) => update("homeFaqTitle", v)} />
        </div>
        <TextArea label="FAQ intro" value={settings.homeFaqIntro || ""} onChange={(v) => update("homeFaqIntro", v)} />
      </Section>

      <Section title="5) About / Services / Contact page heroes">
        <p className="mb-2 text-sm font-semibold text-navy">About page</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="About eyebrow" value={settings.aboutHeroEyebrow || ""} onChange={(v) => update("aboutHeroEyebrow", v)} />
          <Field label="About title" value={settings.aboutHeroTitle || ""} onChange={(v) => update("aboutHeroTitle", v)} />
        </div>
        <TextArea label="About subtitle" value={settings.aboutHeroSubtitle || ""} onChange={(v) => update("aboutHeroSubtitle", v)} />
        <Field label="About section H2" value={settings.aboutSectionTitle || ""} onChange={(v) => update("aboutSectionTitle", v)} />

        <p className="mb-2 mt-6 text-sm font-semibold text-navy">Services page</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Services eyebrow" value={settings.servicesHeroEyebrow || ""} onChange={(v) => update("servicesHeroEyebrow", v)} />
          <Field label="Services title" value={settings.servicesHeroTitle || ""} onChange={(v) => update("servicesHeroTitle", v)} />
        </div>
        <TextArea label="Services subtitle" value={settings.servicesHeroSubtitle || ""} onChange={(v) => update("servicesHeroSubtitle", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Specialized label" value={settings.servicesSpecializedLabel || ""} onChange={(v) => update("servicesSpecializedLabel", v)} />
          <Field label="Specialized title" value={settings.servicesSpecializedTitle || ""} onChange={(v) => update("servicesSpecializedTitle", v)} />
        </div>
        <TextArea label="Specialized intro" value={settings.servicesSpecializedIntro || ""} onChange={(v) => update("servicesSpecializedIntro", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Additional label" value={settings.servicesAdditionalLabel || ""} onChange={(v) => update("servicesAdditionalLabel", v)} />
          <Field label="Additional title" value={settings.servicesAdditionalTitle || ""} onChange={(v) => update("servicesAdditionalTitle", v)} />
        </div>
        <TextArea label="Additional intro" value={settings.servicesAdditionalIntro || ""} onChange={(v) => update("servicesAdditionalIntro", v)} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Core label" value={settings.servicesCoreLabel || ""} onChange={(v) => update("servicesCoreLabel", v)} />
          <Field label="Core title" value={settings.servicesCoreTitle || ""} onChange={(v) => update("servicesCoreTitle", v)} />
        </div>

        <p className="mb-2 mt-6 text-sm font-semibold text-navy">Contact page</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact eyebrow" value={settings.contactHeroEyebrow || ""} onChange={(v) => update("contactHeroEyebrow", v)} />
          <Field label="Contact title" value={settings.contactHeroTitle || ""} onChange={(v) => update("contactHeroTitle", v)} />
        </div>
        <TextArea label="Contact subtitle" value={settings.contactHeroSubtitle || ""} onChange={(v) => update("contactHeroSubtitle", v)} />
      </Section>

      <Section title="6) Locations">
        <p className="text-sm text-muted">
          Office addresses + Google Maps embed URLs (Home & Contact).
        </p>
        {settings.locations.map((loc, index) => (
          <div key={loc.id} className="mt-4 space-y-3 rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-navy">Location {index + 1}</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={loc.isPrimary}
                    onChange={(e) =>
                      updateLocation(index, { isPrimary: e.target.checked })
                    }
                  />
                  Primary
                </label>
                <button
                  type="button"
                  className="text-sm text-danger hover:underline"
                  onClick={() =>
                    update(
                      "locations",
                      settings.locations.filter((_, i) => i !== index)
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Label" value={loc.label} onChange={(v) => updateLocation(index, { label: v })} />
              <Field label="Address line 1" value={loc.addressLine1} onChange={(v) => updateLocation(index, { addressLine1: v })} />
              <Field label="Address line 2" value={loc.addressLine2} onChange={(v) => updateLocation(index, { addressLine2: v })} />
              <Field label="Locality" value={loc.locality} onChange={(v) => updateLocation(index, { locality: v })} />
              <Field label="City" value={loc.city} onChange={(v) => updateLocation(index, { city: v })} />
              <Field label="State" value={loc.state} onChange={(v) => updateLocation(index, { state: v })} />
              <Field label="PIN" value={loc.pincode} onChange={(v) => updateLocation(index, { pincode: v })} />
              <Field label="Map embed URL" value={loc.mapEmbedUrl} onChange={(v) => updateLocation(index, { mapEmbedUrl: v })} />
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn-navy mt-4"
          onClick={() => update("locations", [...settings.locations, emptyLocation()])}
        >
          + Add location
        </button>
      </Section>

      <ServiceListEditor
        title="Core services (home + footer)"
        items={settings.services}
        onChange={(items) => update("services", items)}
        onPatch={(i, patch) => updateServiceList("services", i, patch)}
      />
      <ServiceListEditor
        title="Specialized services (Services page)"
        items={settings.specializedServices}
        onChange={(items) => update("specializedServices", items)}
        onPatch={(i, patch) => updateServiceList("specializedServices", i, patch)}
      />
      <ServiceListEditor
        title="Additional services (Services page)"
        items={settings.additionalServices}
        onChange={(items) => update("additionalServices", items)}
        onPatch={(i, patch) => updateServiceList("additionalServices", i, patch)}
      />

      <Section title="Why choose us features (About / features grid)">
        {settings.features.map((f, index) => (
          <div key={f.id} className="mt-3 space-y-3 rounded-xl border border-line bg-white p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold text-navy">Feature {index + 1}</h3>
              <button
                type="button"
                className="text-sm text-danger hover:underline"
                onClick={() =>
                  update(
                    "features",
                    settings.features.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Title" value={f.title} onChange={(v) => updateFeature(index, { title: v })} />
              <Field label="Icon" value={f.icon} onChange={(v) => updateFeature(index, { icon: v })} />
            </div>
            <TextArea label="Description" value={f.description} onChange={(v) => updateFeature(index, { description: v })} />
          </div>
        ))}
        <button
          type="button"
          className="btn-navy mt-4"
          onClick={() => update("features", [...settings.features, emptyFeature()])}
        >
          + Add feature
        </button>
      </Section>

      <Section title="FAQs">
        {settings.faqs.map((faq, index) => (
          <div key={faq.id} className="mt-3 space-y-3 rounded-xl border border-line bg-white p-4">
            <div className="flex justify-between">
              <h3 className="font-semibold text-navy">FAQ {index + 1}</h3>
              <button
                type="button"
                className="text-sm text-danger hover:underline"
                onClick={() =>
                  update(
                    "faqs",
                    settings.faqs.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
            <Field label="Question" value={faq.question} onChange={(v) => updateFaq(index, { question: v })} />
            <TextArea label="Answer" value={faq.answer} onChange={(v) => updateFaq(index, { answer: v })} />
          </div>
        ))}
        <button
          type="button"
          className="btn-navy mt-4"
          onClick={() => update("faqs", [...settings.faqs, emptyFaq()])}
        >
          + Add FAQ
        </button>
      </Section>

      <Section title="7) Stats">
        <div className="grid gap-4 md:grid-cols-2">
          {settings.stats.map((stat, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Value" value={stat.value} onChange={(v) => updateStat(index, { value: v })} />
              <Field label="Label" value={stat.label} onChange={(v) => updateStat(index, { label: v })} />
              <button
                type="button"
                className="self-end text-sm text-danger hover:underline sm:pb-2"
                onClick={() =>
                  update(
                    "stats",
                    settings.stats.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-navy mt-4"
          onClick={() =>
            update("stats", [...settings.stats, { label: "New stat", value: "0" }])
          }
        >
          + Add stat
        </button>
      </Section>

      <Section title="8) Hero attributes (FAST / RELIABLE chips)">
        <div className="grid gap-4 md:grid-cols-3">
          {settings.attributes.map((attr, index) => (
            <div key={index} className="space-y-2 rounded-xl border border-line bg-white p-4">
              <Field
                label="Title"
                value={attr.title}
                onChange={(v) => {
                  const next = [...settings.attributes];
                  next[index] = { ...next[index], title: v };
                  update("attributes", next);
                }}
              />
              <Field
                label="Icon (truck, shield, trust, fast…)"
                value={attr.icon}
                onChange={(v) => {
                  const next = [...settings.attributes];
                  next[index] = { ...next[index], icon: v };
                  update("attributes", next);
                }}
              />
              <button
                type="button"
                className="text-sm text-danger hover:underline"
                onClick={() =>
                  update(
                    "attributes",
                    settings.attributes.filter((_, i) => i !== index)
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn-navy mt-4"
          onClick={() =>
            update("attributes", [
              ...settings.attributes,
              { title: "NEW", icon: "shield" },
            ])
          }
        >
          + Add attribute
        </button>
      </Section>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary shadow-lg">
          {saving ? "Saving..." : "Save all changes"}
        </button>
      </div>
    </form>
  );
}

function ServiceListEditor({
  title,
  items,
  onChange,
  onPatch,
}: {
  title: string;
  items: ServiceItem[];
  onChange: (items: ServiceItem[]) => void;
  onPatch: (index: number, patch: Partial<ServiceItem>) => void;
}) {
  return (
    <Section title={title}>
      {items.map((svc, index) => (
        <div key={svc.id} className="mt-3 space-y-3 rounded-xl border border-line bg-white p-4">
          <div className="flex justify-between">
            <h3 className="font-semibold text-navy">Item {index + 1}</h3>
            <button
              type="button"
              className="text-sm text-danger hover:underline"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Title" value={svc.title} onChange={(v) => onPatch(index, { title: v })} />
            <Field label="Icon key" value={svc.icon} onChange={(v) => onPatch(index, { icon: v })} />
          </div>
          <TextArea label="Description" value={svc.description} onChange={(v) => onPatch(index, { description: v })} />
        </div>
      ))}
      <button
        type="button"
        className="btn-navy mt-4"
        onClick={() => onChange([...items, emptyService()])}
      >
        + Add item
      </button>
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-cream/80 p-5 sm:p-6">
      <h2 className="font-display text-2xl font-bold text-navy">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function ImageUploadCard({
  title,
  help,
  preview,
  fallbackLabel,
  rounded,
  uploading,
  onPick,
  onReset,
  resetLabel,
}: {
  title: string;
  help: string;
  preview: string;
  fallbackLabel: string;
  rounded: string;
  uploading: boolean;
  onPick: (file: File | null) => void;
  onReset: () => void;
  resetLabel: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-sand/40 p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs text-muted">{help}</p>
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
        <div
          className={`relative h-28 w-28 shrink-0 overflow-hidden border border-line bg-white ${rounded}`}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-navy text-sm font-bold text-white">
              {fallbackLabel}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-mid"
            onChange={(e) => {
              onPick(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-navy"
              onClick={onReset}
            >
              {resetLabel}
            </button>
          </div>
          {uploading && (
            <p className="text-xs font-medium text-navy">Uploading…</p>
          )}
          {preview && (
            <p className="break-all text-xs text-muted">Path: {preview}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        className="input-field"
        type={type}
        autoComplete={type === "password" ? "new-password" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <textarea
        className="input-field min-h-28 resize-y"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
