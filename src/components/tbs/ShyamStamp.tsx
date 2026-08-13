"use client";

export const SHYAM_STAMP_SRC = "/brand/shyam-stamp.png";

/** Company rubber-stamp image — use on all printouts. */
export function ShyamStamp({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SHYAM_STAMP_SRC}
      alt="SHYAM LOGISTICS stamp"
      className={`shyam-stamp shyam-stamp-${size}${className ? ` ${className}` : ""}`}
    />
  );
}

export function ShyamSignBlock({
  label = "For Shyam Logistics",
  showLine = false,
  size = "md",
}: {
  label?: string;
  showLine?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className="shyam-sign-block">
      <ShyamStamp size={size} />
      <div className="shyam-sign-label">{label}</div>
      {showLine ? <div className="shyam-sign-line">_________________</div> : null}
    </div>
  );
}
