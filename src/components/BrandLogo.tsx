import Image from "next/image";
import Link from "next/link";

/** Full Shyam logo art (peacock + flute + Shyam word) */
export const DEFAULT_LOGO_URL = "/brand/shyam-brand-logo.png";
/** Compact circular mark for clear header display */
export const DEFAULT_MARK_URL = "/brand/shyam-mark.png";

type BrandLogoProps = {
  companyName?: string;
  /** Custom uploaded logo; empty uses official Shyam mark */
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showWordmark?: boolean;
};

const sizes = {
  sm: {
    mark: 46,
    markSm: 48,
    first: "text-[0.95rem] sm:text-[1.1rem]",
    second: "text-[1.05rem] sm:text-[1.25rem]",
    gap: "gap-2.5 sm:gap-3",
  },
  md: {
    mark: 58,
    markSm: 62,
    first: "text-lg sm:text-xl",
    second: "text-xl sm:text-2xl",
    gap: "gap-3",
  },
  lg: {
    mark: 70,
    markSm: 76,
    first: "text-xl sm:text-2xl",
    second: "text-2xl sm:text-3xl",
    gap: "gap-3.5",
  },
};

/** Compact circular mark (blog badges, bylines). */
export function LogoMark({ size }: { size: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-line/80"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={DEFAULT_MARK_URL}
        alt=""
        fill
        className="object-contain p-[5%]"
        sizes={`${size}px`}
      />
    </span>
  );
}

/**
 * Header brand: peacock mark (clear) + SHYAM / LOGISTIC text.
 * LOGISTIC is larger so it stays readable on mobile.
 */
export function BrandLogo({
  companyName = "SHYAM LOGISTIC",
  logoUrl = "",
  size = "sm",
  variant = "light",
  showWordmark = true,
}: BrandLogoProps) {
  const s = sizes[size];
  const parts = companyName.trim().split(/\s+/);
  const first = parts[0] || "SHYAM";
  const second = parts.slice(1).join(" ") || "LOGISTIC";
  const custom = logoUrl?.trim() || "";
  const isDefaultBrand =
    !custom ||
    /shyam-logo|shyam-brand|shyam-mark|\/brand\/logo/i.test(custom);
  // Use crisp circular mark for default brand so feathers stay visible at small size
  const markSrc = isDefaultBrand ? DEFAULT_MARK_URL : custom;
  const useSquareCustom = Boolean(custom && !isDefaultBrand);

  return (
    <Link
      href="/"
      className={`group inline-flex max-w-full min-w-0 items-center ${s.gap}`}
      aria-label={companyName}
    >
      <span
        className={`relative shrink-0 overflow-hidden bg-white shadow-[0_1px_3px_rgba(10,31,61,0.1)] ${
          useSquareCustom ? "rounded-lg" : "rounded-full ring-1 ring-navy/10"
        }`}
        style={{
          width: useSquareCustom ? s.markSm * 1.15 : s.markSm,
          height: s.markSm,
          minWidth: s.mark,
          minHeight: s.mark,
        }}
      >
        <Image
          src={markSrc}
          alt=""
          fill
          priority={size === "sm"}
          className={
            useSquareCustom
              ? "object-contain p-0.5"
              : "object-contain p-[4%]"
          }
          sizes={`${s.markSm * 2}px`}
        />
      </span>

      {showWordmark && (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={`truncate font-display font-bold uppercase tracking-[0.04em] ${s.first} ${
              variant === "dark" ? "text-white" : "text-navy"
            }`}
          >
            {first}
          </span>
          {second ? (
            <span
              className={`mt-0.5 truncate font-display font-extrabold uppercase tracking-[0.12em] text-red sm:tracking-[0.14em] ${s.second}`}
            >
              {second}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
