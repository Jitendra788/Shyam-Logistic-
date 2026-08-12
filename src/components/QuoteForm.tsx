"use client";

import { FormEvent, useMemo, useState } from "react";
import { mailtoEnquiryUrl, whatsappEnquiryUrl } from "@/lib/enquiry-format";

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
  notifyEmail = "shyamlogisticscompany535@gmail.com",
  phone = "8459858242",
  phone2 = "9057420562",
  whatsapp = "8459858242",
}: QuoteFormProps) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "ok-wa">(
    "idle"
  );
  const [sentWaUrl, setSentWaUrl] = useState("");

  const tel1 = digitsPhone(phone);
  const tel2 = digitsPhone(phone2);
  const wa = digitsPhone(whatsapp || phone);

  const draft = useMemo(
    () => ({
      ...form,
      phone: digitsPhone(form.phone) || form.phone,
    }),
    [form]
  );

  function set(field: keyof typeof initial, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function postEnquiry(): Promise<{ saved?: boolean; emailed?: boolean }> {
    const res = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        typeof data.error === "string" ? data.error : "Submission failed"
      );
    }
    return data as { saved?: boolean; emailed?: boolean };
  }

  async function postFormSubmitFallback() {
    const to = notifyEmail.trim();
    if (!to) return false;
    try {
      const res = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `New enquiry from ${draft.name} — shyamlogistic`,
            _template: "box",
            _captcha: "false",
            _replyto: draft.email || to,
            name: draft.name,
            phone: draft.phone,
            email: draft.email || "not provided",
            company: draft.company || "—",
            fromCity: draft.fromCity || "—",
            toCity: draft.toCity || "—",
            cargoType: draft.cargoType || "—",
            weight: draft.weight || "—",
            message: draft.message || "—",
          }),
        }
      );
      if (!res.ok) return false;
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean | string }
        | null;
      return data?.success === true || data?.success === "true";
    } catch {
      return false;
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const waUrl = whatsappEnquiryUrl(wa, draft);
    let delivered = false;

    try {
      const result = await postEnquiry();
      delivered = Boolean(result.saved || result.emailed);
    } catch {
      delivered = false;
    }

    if (!delivered) {
      delivered = await postFormSubmitFallback();
    }

    if (delivered) {
      setSentWaUrl("");
      setStatus("ok");
      setForm(initial);
      return;
    }

    if (waUrl) {
      setSentWaUrl(waUrl);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setStatus("ok-wa");
      setForm(initial);
      return;
    }

    setSentWaUrl("");
    setStatus("ok-wa");
  }

  if (status === "ok" || status === "ok-wa") {
    return (
      <div className="rounded-md border border-success/30 bg-success/5 p-6 text-center">
        <p className="font-display text-xl font-semibold text-success">
          {status === "ok-wa" ? "Send on WhatsApp to finish" : "Enquiry submitted"}
        </p>
        <p className="mt-2 text-sm text-muted">
          {status === "ok-wa"
            ? "WhatsApp should open with your enquiry. Tap Send so our team receives it."
            : "Thank you. Our team will contact you shortly with a quote."}
        </p>
        {status === "ok-wa" && sentWaUrl ? (
          <a
            href={sentWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-[#128c7e] px-4 text-sm font-semibold text-white"
          >
            Open WhatsApp
          </a>
        ) : null}
        <button
          type="button"
          className="btn-navy mt-4 block w-full sm:inline-flex sm:w-auto"
          onClick={() => {
            setStatus("idle");
            setSentWaUrl("");
          }}
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const liveWaUrl = whatsappEnquiryUrl(wa, draft);
  const liveMailUrl = mailtoEnquiryUrl(notifyEmail, draft);

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

      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-primary w-full disabled:opacity-60 sm:w-auto"
      >
        {status === "loading" ? "Submitting..." : "Submit enquiry"}
      </button>

      <div className="flex flex-wrap gap-2 pt-1">
        {tel1 ? (
          <a
            href={`tel:+91${tel1}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-red px-3 text-sm font-semibold text-white"
          >
            Call {phone.replace(/(\d{5})(\d{5})/, "$1 $2")}
          </a>
        ) : null}
        {tel2 ? (
          <a
            href={`tel:+91${tel2}`}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-navy px-3 text-sm font-semibold text-white"
          >
            Call {phone2.replace(/(\d{5})(\d{5})/, "$1 $2")}
          </a>
        ) : null}
        {liveWaUrl ? (
          <a
            href={liveWaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#128c7e] px-3 text-sm font-semibold text-white"
          >
            WhatsApp
          </a>
        ) : null}
        {liveMailUrl ? (
          <a
            href={liveMailUrl}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-navy"
          >
            Email
          </a>
        ) : null}
      </div>
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
