"use client";

import { FormEvent, useState } from "react";
import { whatsappEnquiryUrl } from "@/lib/enquiry-format";

const initial = {
  name: "",
  phone: "",
  email: "",
  company: "",
  fromCity: "",
  toCity: "",
  cargoType: "",
  weight: "",
  message: "",
};

type QuoteFormProps = {
  compact?: boolean;
  notifyEmail?: string;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
};

function digitsPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return d;
}

export function QuoteForm({
  compact = false,
  notifyEmail = "",
  phone = "",
  phone2 = "",
  whatsapp = "",
}: QuoteFormProps) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const tel1 = digitsPhone(phone);
  const tel2 = digitsPhone(phone2);
  const wa = digitsPhone(whatsapp || phone);

  function set(field: keyof typeof initial, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function postEnquiry() {
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, phone: digitsPhone(form.phone) || form.phone }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Submission failed"
      );
    }
    return data;
  }

  async function postFormSubmitFallback() {
    const to = notifyEmail.trim();
    if (!to) return false;
    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `New enquiry from ${form.name} — shyamlogistic`,
          _template: "box",
          _captcha: "false",
          name: form.name,
          phone: digitsPhone(form.phone) || form.phone,
          email: form.email || "not provided",
          company: form.company || "—",
          fromCity: form.fromCity || "—",
          toCity: form.toCity || "—",
          cargoType: form.cargoType || "—",
          weight: form.weight || "—",
          message: form.message || "—",
        }),
      }
    );
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as
      | { success?: boolean | string }
      | null;
    return Boolean(
      data && (data.success === true || data.success === "true" || res.ok)
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      try {
        await postEnquiry();
      } catch {
        const fallbackOk = await postFormSubmitFallback();
        if (!fallbackOk) throw new Error("Could not send enquiry online.");
      }
      setStatus("ok");
      setForm(initial);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Could not send enquiry online. Please call or WhatsApp us."
      );
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-success/30 bg-success/5 p-6 text-center">
        <p className="font-display text-xl font-semibold text-success">
          Enquiry submitted
        </p>
        <p className="mt-2 text-sm text-muted">
          Thank you. Our team will contact you shortly with a quote.
        </p>
        <button
          type="button"
          className="btn-navy mt-5"
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const waUrl =
    status === "error" && wa
      ? whatsappEnquiryUrl(wa, {
          name: form.name,
          phone: digitsPhone(form.phone) || form.phone,
          email: form.email,
          company: form.company,
          fromCity: form.fromCity,
          toCity: form.toCity,
          cargoType: form.cargoType,
          weight: form.weight,
          message: form.message,
        })
      : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
        <Field
          id="quote-name"
          name="name"
          label="Full name *"
          value={form.name}
          onChange={(v) => set("name", v)}
          required
          autoComplete="name"
        />
        <Field
          id="quote-phone"
          name="phone"
          label="Phone *"
          value={form.phone}
          onChange={(v) => set("phone", v)}
          required
          type="tel"
          autoComplete="tel"
          placeholder="10-digit mobile"
        />
        <Field
          id="quote-email"
          name="email"
          label="Email"
          value={form.email}
          onChange={(v) => set("email", v)}
          type="email"
          autoComplete="email"
        />
        <Field
          id="quote-company"
          name="company"
          label="Company"
          value={form.company}
          onChange={(v) => set("company", v)}
          autoComplete="organization"
        />
        <Field
          id="quote-from-city"
          name="fromCity"
          label="From city"
          value={form.fromCity}
          onChange={(v) => set("fromCity", v)}
        />
        <Field
          id="quote-to-city"
          name="toCity"
          label="To city"
          value={form.toCity}
          onChange={(v) => set("toCity", v)}
        />
        <Field
          id="quote-cargo-type"
          name="cargoType"
          label="Cargo type"
          value={form.cargoType}
          onChange={(v) => set("cargoType", v)}
          placeholder="e.g. Machinery, FMCG"
        />
        <Field
          id="quote-weight"
          name="weight"
          label="Approx. weight"
          value={form.weight}
          onChange={(v) => set("weight", v)}
          placeholder="e.g. 5 ton"
        />
      </div>
      <div>
        <label
          htmlFor="quote-message"
          className="mb-1.5 block text-sm font-medium text-ink"
        >
          Message
        </label>
        <textarea
          id="quote-message"
          name="message"
          className="input-field min-h-28 resize-y"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="Share pickup date, special handling needs, etc."
        />
      </div>

      {status === "error" && (
        <div className="space-y-3 rounded-lg border border-danger/20 bg-danger/5 p-3">
          <p className="text-sm text-danger">{error}</p>
          <div className="flex flex-wrap gap-2">
            {tel1 ? (
              <a href={`tel:+91${tel1}`} className="btn-primary !min-h-10 !px-3 !py-2 !text-sm">
                Call {phone}
              </a>
            ) : null}
            {tel2 ? (
              <a href={`tel:+91${tel2}`} className="btn-navy !min-h-10 !px-3 !py-2 !text-sm">
                Call {phone2}
              </a>
            ) : null}
            {waUrl ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#128c7e] px-3 text-sm font-semibold text-white"
              >
                WhatsApp enquiry
              </a>
            ) : null}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Submitting..." : "Submit enquiry"}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={name}
        className="input-field"
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete || "on"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
