"use client";

import Link from "next/link";

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

export function ActionButtons({
  onSave,
  onUpdate,
  onDelete,
  onPrint,
  onPrintList,
  canUpdate = false,
  canDelete = false,
  canPrint = false,
  saving = false,
  printLabel = "Print",
  extra,
}: {
  onSave?: () => void;
  onUpdate?: () => void;
  onDelete?: () => void;
  onPrint?: () => void;
  onPrintList?: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
  saving?: boolean;
  printLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="tbs-actions">
      {onSave && (
        <button type="button" className="tbs-btn" onClick={onSave} disabled={saving}>
          <span className="dot green">+</span> Save
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
      {extra}
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
                  <td key={c.key}>{renderCell(row, c.key, i)}</td>
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
