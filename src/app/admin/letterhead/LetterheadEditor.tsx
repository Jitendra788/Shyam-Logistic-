"use client";

import { useEffect, useState } from "react";
import { DEFAULT_MARK_URL } from "@/components/BrandLogo";
import type { Location, SiteSettings } from "@/lib/types";

const FALLBACK_ADDRESS =
  "Ground Floor, Shop No. 2, S No. 2124, Indrajit Apartment, Old Kupwad Road, Near Shalininagar Bus Stop, Shalini Nagar, Kupwad, Sangli, Maharashtra 416416";

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return raw.trim();
}

function locationText(loc: Location | undefined) {
  if (!loc) return FALLBACK_ADDRESS;
  const cityLine = [loc.city, loc.state, loc.pincode].filter(Boolean).join(" ");
  return [loc.addressLine1, loc.addressLine2, loc.locality, cityLine]
    .filter(Boolean)
    .join(", ");
}

function primaryIndex(settings: SiteSettings) {
  const i = settings.locations.findIndex((l) => l.isPrimary);
  return i >= 0 ? i : 0;
}

export function LetterheadEditor() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [company, setCompany] = useState("SHYAM LOGISTIC");
  const [tagline, setTagline] = useState("Fleet Owners & Transport Contractors");
  const [address, setAddress] = useState(FALLBACK_ADDRESS);
  const [email, setEmail] = useState("shyamlogisticscompany535@gmail.com");
  const [gstin, setGstin] = useState("27AXGPL2293R1ZP");
  const [phone, setPhone] = useState("8459858242");
  const [phone2, setPhone2] = useState("9057420562");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = (await res.json()) as SiteSettings;
      setSettings(data);
      setCompany(data.companyName || "SHYAM LOGISTIC");
      setEmail(data.email || "shyamlogisticscompany535@gmail.com");
      setGstin(data.gstin || "27AXGPL2293R1ZP");
      setPhone(data.phone || "8459858242");
      setPhone2(data.phone2 || "9057420562");
      const loc = data.locations?.find((l) => l.isPrimary) ?? data.locations?.[0];
      setAddress(locationText(loc));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMsg("");
    try {
      const locations = [...(settings.locations || [])];
      if (locations.length === 0) {
        locations.push({
          id: "loc-hq",
          label: "Registered Office",
          addressLine1: address.trim(),
          addressLine2: "",
          locality: "",
          city: "",
          state: "",
          pincode: "",
          mapEmbedUrl: "",
          isPrimary: true,
        });
      } else {
        const i = primaryIndex({ ...settings, locations });
        locations[i] = {
          ...locations[i],
          addressLine1: address.trim(),
          addressLine2: "",
          locality: "",
          city: "",
          state: "",
          pincode: "",
        };
      }
      const next: SiteSettings = {
        ...settings,
        companyName: company.trim() || settings.companyName,
        email: email.trim(),
        gstin: gstin.trim(),
        phone: phone.replace(/\D/g, "") || settings.phone,
        phone2: phone2.replace(/\D/g, ""),
        locations,
      };
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { error?: string; settings?: SiteSettings };
      if (!res.ok) throw new Error(data.error || "Save failed");
      if (data.settings) setSettings(data.settings);
      else setSettings(next);
      setEditing(false);
      setMsg("Letterhead save ho gaya.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const showPhone = formatPhone(phone);
  const showPhone2 = formatPhone(phone2);

  return (
    <div className="lh-page">
      <div className="lh-toolbar">
        {editing ? (
          <>
            <button type="button" className="tbs-btn tbs-btn-print" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="tbs-btn"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </>
        ) : (
          <button type="button" className="tbs-btn" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
        <button type="button" className="tbs-btn tbs-btn-print" onClick={() => window.print()}>
          Print A4
        </button>
        {msg ? <span className="lh-msg">{msg}</span> : null}
      </div>

      {editing ? (
        <div className="lh-edit">
          <label>
            Company
            <input value={company} onChange={(e) => setCompany(e.target.value)} />
          </label>
          <label>
            Tagline
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} />
          </label>
          <label>
            Address
            <textarea rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            GST
            <input value={gstin} onChange={(e) => setGstin(e.target.value)} />
          </label>
          <label>
            Mobile 1
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label>
            Mobile 2
            <input value={phone2} onChange={(e) => setPhone2(e.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="lh-sheet-wrap">
        <article className="lh-sheet">
          <header className="lh-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lh-logo" src={DEFAULT_MARK_URL} alt={company} />
            <div className="lh-copy">
              <h1 className="lh-name">{company}</h1>
              <p className="lh-tag">{tagline}</p>
              <p className="lh-line">{address}</p>
              <p className="lh-line">Email : {email}</p>
              <p className="lh-line">GST : {gstin}</p>
              <p className="lh-line lh-mob">
                Mob :{" "}
                <span>
                  {showPhone}
                  {showPhone2 ? ` , ${showPhone2}` : ""}
                </span>
              </p>
            </div>
          </header>
          <hr className="lh-rule" />
          <p className="lh-date">Date : ______ / ______ / 20______</p>
          <div className="lh-body" />
        </article>
      </div>
    </div>
  );
}
