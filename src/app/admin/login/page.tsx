"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(198,40,40,0.08), transparent 55%), radial-gradient(ellipse 60% 45% at 90% 10%, rgba(10,31,61,0.1), transparent 50%), #f8fafc",
        }}
      />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(10,31,61,0.08)] sm:p-8">
        <div className="mb-6">
          <BrandLogo companyName="SHYAM LOGISTIC" size="sm" variant="light" />
        </div>
        <p className="section-label">Admin</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-navy">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Transport billing, reports, and website content.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Username</label>
            <input
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="font-semibold text-navy hover:underline">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
