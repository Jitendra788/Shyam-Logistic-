"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_MARK_URL } from "@/components/BrandLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
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
    <div className="login-screen">
      <div className="login-shell">
        <aside className="login-hero">
          <div className="login-hero-photo">
            <Image
              src="/brand/login-truck.png"
              alt="Shyam Logistics truck"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
              className="login-hero-img"
            />
          </div>
          <div className="login-hero-wash" />
          <Image
            src={DEFAULT_MARK_URL}
            alt=""
            width={420}
            height={420}
            className="login-hero-watermark"
            aria-hidden
          />
          <div className="login-hero-copy">
            <h1>Digitally Connected Logistics Platform</h1>
            <p>
              Increase efficiency, reduce costs, and keep every booking, bill,
              and challan in one place.
            </p>
          </div>
        </aside>

        <section className="login-panel">
          <div className="login-logo">
            <Image
              src={DEFAULT_MARK_URL}
              alt="Shyam Logistics"
              width={72}
              height={72}
              priority
            />
          </div>
          <h2>Sign in to Shyam Logistics</h2>
          <p className="login-lead">
            Access your company dashboard to manage trips, bills, and operations.
          </p>

          <form onSubmit={onSubmit} className="login-form">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                required
              />
            </label>
            <label>
              Password
              <span className="login-pass-row">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            {error ? <p className="login-error">{error}</p> : null}
            <button type="submit" disabled={loading} className="login-submit">
              {loading ? "Signing in…" : "Continue"}
            </button>
          </form>

          <Link href="/" className="login-back">
            ← Back to website
          </Link>
        </section>
      </div>
    </div>
  );
}
