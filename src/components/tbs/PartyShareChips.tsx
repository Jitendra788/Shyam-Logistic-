"use client";

import type { SharePerson } from "@/lib/tbs/docShare";

export function PartyShareChips({
  people,
  onEmail,
  onSms,
  busy,
}: {
  people: SharePerson[];
  onEmail: (person: SharePerson) => void;
  onSms: (person: SharePerson) => void;
  busy?: boolean;
}) {
  if (!people.length) return null;
  return (
    <div className="tbs-share-chips">
      <span className="tbs-share-chips-label">Send to (click email / mobile):</span>
      {people.map((p) => (
        <span key={`${p.role}-${p.name}`} className="tbs-share-chip">
          <strong>
            {p.role}: {p.name}
          </strong>
          {p.email ? (
            <button
              type="button"
              className="tbs-btn tbs-btn-email"
              disabled={busy}
              title={`PDF email ${p.email}`}
              onClick={() => onEmail(p)}
            >
              {p.email}
            </button>
          ) : (
            <span className="tbs-share-missing">no email</span>
          )}
          {p.phone ? (
            <button
              type="button"
              className="tbs-btn"
              disabled={busy}
              title={`SMS ${p.phone}`}
              onClick={() => onSms(p)}
            >
              SMS {p.phone}
            </button>
          ) : (
            <span className="tbs-share-missing">no mobile</span>
          )}
        </span>
      ))}
    </div>
  );
}
