"use client";

import Link from "next/link";
import { isValidElement, useEffect, useState } from "react";
import { partyLabel } from "@/lib/tbs/partyLabel";

/** Parse manually typed amount (no spinner, commas OK). */
export function parseManualNumber(raw: string): number {
  const s = raw.replace(/,/g, "").trim();
  if (!s || s === "-" || s === ".") return 0;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/** Text input for amounts — manual type, no up/down arrows. */
export function ManualAmountInput({
  className = "tbs-input",
  value,
  onChange,
  syncKey = "",
  placeholder = "0",
  readOnly,
}: {
  className?: string;
  value: number;
  onChange: (n: number) => void;
  /** Change when another row is selected (resets display). */
  syncKey?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(value === 0 ? "" : String(value));
  }, [syncKey, value]);

  return (
    <input
      className={`${className} tbs-manual-num`}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      readOnly={readOnly}
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^-?\d*\.?\d*$/.test(v)) {
          setText(v);
          onChange(parseManualNumber(v));
        }
      }}
      onBlur={() => {
        const n = parseManualNumber(text);
        setText(n === 0 ? "" : String(n));
        onChange(n);
      }}
    />
  );
}

export function FormWindow({
  title,
  children,
  closeHref = "/admin",
}: {
  title: string;
  children: React.ReactNode;
  closeHref?: string;
}) {
  return (
    <div className="tbs-window">
      <div className="tbs-window-title">
        <span>{title}</span>
        <Link href={closeHref} className="tbs-window-close" title="Close">
          ✕
        </Link>
      </div>
      <div className="tbs-window-body">{children}</div>
    </div>
  );
}

/** Success / error banner — scrolls into view; success auto-hides after 4s. */
export function StatusBanner({
  message,
  onClear,
}: {
  message: string;
  onClear?: () => void;
}) {
  const isErr = /fail|error|not found|nahi|required|pehle|cannot|expire|select|enter /i.test(
    message,
  );

  useEffect(() => {
    if (!message) return;
    document
      .getElementById("tbs-flash")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (!isErr && onClear) {
      const t = window.setTimeout(onClear, 4500);
      return () => window.clearTimeout(t);
    }
  }, [message, isErr, onClear]);

  if (!message) return null;

  return (
    <div
      id="tbs-flash"
      className={`tbs-msg ${isErr ? "err" : "ok"}`}
      role="status"
      aria-live="polite"
    >
      <span className="tbs-msg-icon" aria-hidden>
        {isErr ? "!" : "✓"}
      </span>
      <span className="tbs-msg-text">{message}</span>
    </div>
  );
}

export async function readApiError(res: Response, fallback: string) {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

/** DELETE helper — throws with readable message when save storage is missing. */
export async function apiDelete(url: string) {
  const res = await fetch(url, { method: "DELETE", cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readApiError(res, "Delete failed"));
  }
  return true;
}

export function ActionButtons({
  onSave,
  onNew,
  onUpdate,
  onDelete,
  onPrint,
  onPrintList,
  onWhatsApp,
  onEmail,
  onSms,
  canUpdate = false,
  canDelete = false,
  canPrint = false,
  canWhatsApp = false,
  canEmail = false,
  canSms = false,
  saving = false,
  printLabel = "Print",
  extra,
}: {
  onSave?: () => void;
  /** Clear form to add a new record (shown while editing). */
  onNew?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onPrintList?: () => void;
  onWhatsApp?: () => void;
  onEmail?: () => void;
  onSms?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
  canWhatsApp?: boolean;
  canEmail?: boolean;
  canSms?: boolean;
  saving?: boolean;
  printLabel?: string;
  extra?: React.ReactNode;
}) {
  const editing = canUpdate;
  return (
    <div className="tbs-actions">
      {!editing && onSave && (
        <button type="button" className="tbs-btn" onClick={onSave} disabled={saving}>
          <span className="dot green">+</span> Save
        </button>
      )}
      {editing && onNew && (
        <button type="button" className="tbs-btn" onClick={onNew} disabled={saving}>
          New
        </button>
      )}
      {onUpdate && (
        <button type="button" className="tbs-btn" onClick={onUpdate} disabled={!canUpdate || saving}>
          <span className="dot amber">⏳</span> Update
        </button>
      )}
      {onDelete && (
        <button type="button" className="tbs-btn" onClick={onDelete} disabled={!canDelete || saving}>
          <span className="dot red">✕</span> Delete
        </button>
      )}
      {onPrint && (
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={onPrint}
          disabled={saving}
          title={canPrint ? "Print selected" : "Select a row to print, or use Print List"}
        >
          <span className="dot print">🖨</span> {printLabel}
        </button>
      )}
      {onPrintList && (
        <button
          type="button"
          className="tbs-btn tbs-btn-print"
          onClick={onPrintList}
          disabled={saving}
          title="Print full register / list"
        >
          <span className="dot print">🖨</span> Print List
        </button>
      )}
      {onWhatsApp && (
        <button
          type="button"
          className="tbs-btn tbs-btn-wa"
          onClick={onWhatsApp}
          disabled={!canWhatsApp || saving}
          title={canWhatsApp ? "Share PDF on WhatsApp" : "Select a record first"}
        >
          WhatsApp
        </button>
      )}
      {onEmail && (
        <button
          type="button"
          className="tbs-btn tbs-btn-email"
          onClick={onEmail}
          disabled={!canEmail || saving}
          title={canEmail ? "Email PDF to Enter Receiver Email ID" : "Select a record first"}
        >
          Email PDF
        </button>
      )}
      {onSms && (
        <button
          type="button"
          className="tbs-btn"
          onClick={onSms}
          disabled={!canSms || saving}
          title={canSms ? "Send SMS to party mobile" : "Select a record first"}
        >
          SMS
        </button>
      )}
      {extra}
    </div>
  );
}

export function ReceiverEmailInput({
  value,
  onChange,
  listId,
  emails,
}: {
  value: string;
  onChange: (value: string) => void;
  listId: string;
  emails: string[];
}) {
  const unique = emails.filter((e, i, arr) => e && arr.indexOf(e) === i);
  return (
    <div className="tbs-search tbs-receiver-email">
      <span>Enter Receiver Email ID</span>
      <input
        className="tbs-input w-md"
        type="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="receiver@email.com"
        list={listId}
        autoComplete="off"
      />
      <datalist id={listId}>
        {unique.map((email) => (
          <option key={email} value={email} />
        ))}
      </datalist>
    </div>
  );
}

/** Compact print button for grid rows */
export function PrintCellButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="tbs-btn tbs-btn-print"
      style={{ height: 24, minWidth: 64, padding: "0 8px" }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      Print
    </button>
  );
}

function toCell(node: React.ReactNode): React.ReactNode {
  if (node == null || typeof node === "boolean") return node ?? "";
  if (typeof node === "string" || typeof node === "number") return node;
  if (Array.isArray(node) || isValidElement(node)) return node;
  if (typeof node === "object") return partyLabel(node);
  return "";
}

export function DataGrid<T extends { id: string }>({
  columns,
  rows,
  selectedId,
  onSelect,
  renderCell,
}: {
  columns: { key: string; label: string; width?: string }[];
  rows: T[];
  selectedId?: string | null;
  onSelect?: (row: T) => void;
  renderCell: (row: T, key: string, index: number) => React.ReactNode;
}) {
  return (
    <div className="tbs-grid-wrap">
      <table className="tbs-grid">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={c.width ? { minWidth: c.width } : undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: 24, color: "#666" }}>
                No records
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id}
                className={selectedId === row.id ? "selected" : ""}
                onClick={() => onSelect?.(row)}
                style={{ cursor: onSelect ? "pointer" : undefined }}
              >
                {columns.map((c) => (
                  <td key={c.key}>{toCell(renderCell(row, c.key, i))}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}
