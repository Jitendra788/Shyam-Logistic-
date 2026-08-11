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

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Site content</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy">
            Settings & locations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Highway-style structure content — editable from here.
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

      <Section title="Company identity">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Company name" value={settings.companyName} onChange={(v) => update("companyName", v)} />
          <Field label="Brand short (logo letters)" value={settings.brandShort} onChange={(v) => update("brandShort", v)} />
          <Field label="Founder / legal name" value={settings.legalName} onChange={(v) => update("legalName", v)} />
          <Field label="GSTIN" value={settings.gstin} onChange={(v) => update("gstin", v)} />
          <Field label="Phone 1" value={settings.phone} onChange={(v) => update("phone", v)} />
          <Field label="Phone 2" value={settings.phone2} onChange={(v) => update("phone2", v)} />
          <Field label="WhatsApp" value={settings.whatsapp} onChange={(v) => update("whatsapp", v)} />
          <Field label="Email" value={settings.email} onChange={(v) => update("email", v)} />
          <Field label="Tagline" value={settings.tagline} onChange={(v) => update("tagline", v)} />
          <Field label="Hindi tagline" value={settings.hindiTagline} onChange={(v) => update("hindiTagline", v)} />
          <Field label="Slogan" value={settings.slogan} onChange={(v) => update("slogan", v)} />
          <Field label="Working hours" value={settings.workingHours} onChange={(v) => update("workingHours", v)} />
        </div>
        <TextArea label="Short description" value={settings.description} onChange={(v) => update("description", v)} />
        <TextArea label="About text" value={settings.aboutText} onChange={(v) => update("aboutText", v)} />
        <TextArea label="Mission text" value={settings.missionText} onChange={(v) => update("missionText", v)} />
        <Field label="Footer note" value={settings.footerNote} onChange={(v) => update("footerNote", v)} />
      </Section>

      <Section title="Home hero">
        <Field label="Eyebrow" value={settings.heroEyebrow} onChange={(v) => update("heroEyebrow", v)} />
        <Field label="Headline" value={settings.heroHeadline} onChange={(v) => update("heroHeadline", v)} />
        <TextArea label="Subtext" value={settings.heroSubtext} onChange={(v) => update("heroSubtext", v)} />
      </Section>

      <Section title="Locations">
        <p className="text-sm text-muted">
          Office addresses + Google Maps embed URLs (shown on Home & Contact).
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
        title="Specialized services (Services → What We Deliver)"
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

      <Section title="Why choose us features">
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

      <Section title="Stats">
        <div className="grid gap-4 md:grid-cols-2">
          {settings.stats.map((stat, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
              <Field label="Value" value={stat.value} onChange={(v) => updateStat(index, { value: v })} />
              <Field label="Label" value={stat.label} onChange={(v) => updateStat(index, { label: v })} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="FAST / RELIABLE / TRUSTED attributes">
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
                label="Icon"
                value={attr.icon}
                onChange={(v) => {
                  const next = [...settings.attributes];
                  next[index] = { ...next[index], icon: v };
                  update("attributes", next);
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary">
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

function Field({
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
      <input
        className="input-field"
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
