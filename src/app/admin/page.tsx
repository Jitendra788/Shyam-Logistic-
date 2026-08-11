"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Enquiry, EnquiryStatus } from "@/lib/types";

export default function AdminEnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const me = await fetch("/api/auth/me");
    const meData = await me.json();
    if (!meData.authenticated) {
      router.replace("/admin/login");
      return;
    }
    const res = await fetch("/api/enquiries");
    if (!res.ok) {
      setError("Failed to load enquiries");
      setLoading(false);
      return;
    }
    setEnquiries(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateStatus(id: string, status: EnquiryStatus) {
    const res = await fetch(`/api/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    const res = await fetch(`/api/enquiries/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
    }
  }

  if (loading) {
    return <p className="text-muted">Loading enquiries...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  const newCount = enquiries.filter((e) => e.status === "new").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-navy">
            Enquiries
          </h1>
          <p className="mt-1 text-sm text-muted">
            {enquiries.length} total · {newCount} new
          </p>
        </div>
        <a href="/admin/settings" className="btn-navy text-sm">
          Edit locations & content
        </a>
      </div>

      {enquiries.length === 0 ? (
        <div className="mt-8 rounded-md border border-dashed border-line bg-white p-10 text-center text-muted">
          No enquiries yet. Quotes submitted from the website will appear here.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {enquiries.map((enq) => (
            <article
              key={enq.id}
              className="rounded-md border border-line bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-semibold text-navy">
                    {enq.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(enq.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <select
                  className="input-field !w-auto"
                  value={enq.status}
                  onChange={(e) =>
                    updateStatus(enq.id, e.target.value as EnquiryStatus)
                  }
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <Info label="Phone" value={enq.phone} />
                <Info label="Email" value={enq.email || "—"} />
                <Info label="Company" value={enq.company || "—"} />
                <Info label="From" value={enq.fromCity || "—"} />
                <Info label="To" value={enq.toCity || "—"} />
                <Info label="Cargo" value={enq.cargoType || "—"} />
                <Info label="Weight" value={enq.weight || "—"} />
              </div>
              {enq.message && (
                <p className="mt-4 rounded-sm bg-sand p-3 text-sm text-ink">
                  {enq.message}
                </p>
              )}
              <button
                type="button"
                onClick={() => remove(enq.id)}
                className="mt-4 text-sm font-medium text-danger hover:underline"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted">{label}: </span>
      <span className="font-medium text-ink">{value}</span>
    </p>
  );
}
