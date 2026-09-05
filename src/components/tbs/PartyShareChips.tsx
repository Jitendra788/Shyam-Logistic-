"use client";

import type { SharePerson } from "@/lib/tbs/docShare";

export function PartyShareChips({
  people,
  onEmail,
  busy,
}: {
  people: SharePerson[];
  onEmail: (person: SharePerson) => void;
  busy?: boolean;
}) {
  const withEmail = people.filter((p) => p.email);
  if (!withEmail.length) return null;
  return (
    <div className="tbs-share-chips">
      <span className="tbs-share-chips-label">Click email to fill Receiver Email ID:</span>
      {withEmail.map((p) => (
        <span key={`${p.role}-${p.name}`} className="tbs-share-chip">
          <strong>
            {p.role}: {p.name}
          </strong>
          <button
            type="button"
            className="tbs-btn tbs-btn-email"
            disabled={busy}
            title={`Fill Receiver Email ID: ${p.email}`}
            onClick={() => onEmail(p)}
          >
            {p.email}
          </button>
        </span>
      ))}
    </div>
  );
}
