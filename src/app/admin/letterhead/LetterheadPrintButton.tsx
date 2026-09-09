"use client";

export function LetterheadPrintButton() {
  return (
    <div className="lh-toolbar">
      <button type="button" className="tbs-btn tbs-btn-print" onClick={() => window.print()}>
        Print A4
      </button>
      <span style={{ fontSize: 13, color: "#64748b" }}>Letterhead — A4 portrait</span>
    </div>
  );
}
