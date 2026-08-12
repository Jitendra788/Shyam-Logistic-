"use client";

import { FormEvent, useState } from "react";

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

export function QuoteForm({ compact = false }: { compact?: boolean }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  function set(field: keyof typeof initial, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setStatus("ok");
      setForm(initial);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className={`grid gap-4 ${compact ? "sm:grid-cols-2" : "md:grid-cols-2"}`}>
        <Field label="Full name *" value={form.name} onChange={(v) => set("name", v)} required />
        <Field label="Phone *" value={form.phone} onChange={(v) => set("phone", v)} required type="tel" />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" />
        <Field label="Company" value={form.company} onChange={(v) => set("company", v)} />
        <Field label="From city" value={form.fromCity} onChange={(v) => set("fromCity", v)} />
        <Field label="To city" value={form.toCity} onChange={(v) => set("toCity", v)} />
        <Field label="Cargo type" value={form.cargoType} onChange={(v) => set("cargoType", v)} placeholder="e.g. Machinery, FMCG" />
        <Field label="Approx. weight" value={form.weight} onChange={(v) => set("weight", v)} placeholder="e.g. 5 ton" />
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
        <p className="text-sm text-danger">{error}</p>
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
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const id = `quote-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        name={id}
        className="input-field"
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={type === "tel" ? "tel" : type === "email" ? "email" : "on"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
