import Image from "next/image";
import Link from "next/link";

/** Full Shyam logo art (peacock + flute + Shyam word) */
export const DEFAULT_LOGO_URL = "/brand/shyam-brand-logo.webp";
/** Compact circular peacock mark (rich colours) */
export const DEFAULT_MARK_URL = "/brand/shyam-peacock-mark.webp";

type BrandLogoProps = {
  companyName?: string;
  /** Custom uploaded logo; empty uses official Shyam mark */
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showWordmark?: boolean;
  /** Destination; default public home. Pass a path so callers do not wrap another Link. */
  href?: string;
  className?: string;
};

const sizes = {
  sm: {
    mark: 44,
    markSm: 48,
    // CSS responsive - slightly smaller text on very narrow phones
    first: "text-[0.9rem] sm:text-[1.05rem] md:text-[1.1rem]",
    second: "text-[1rem] sm:text-[1.15rem] md:text-[1.25rem]",
    gap: "gap-2 sm:gap-2.5",
  },
  md: {
    mark: 62,
    markSm: 68,
    first: "text-lg sm:text-xl",
    second: "text-xl sm:text-2xl",
    gap: "gap-3",
  },
  lg: {
    mark: 76,
    markSm: 84,
    first: "text-xl sm:text-2xl",
    second: "text-2xl sm:text-3xl",
    gap: "gap-3.5",
  },
};

/** Compact circular mark (blog badges, bylines). */
export function LogoMark({ size }: { size: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full bg-gradient-to-b from-white to-[#f3f7fb] shadow-[0_1px_4px_rgba(10,31,61,0.12)] ring-1 ring-[#0a1f3d]/12"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={DEFAULT_MARK_URL}
        alt=""
        fill
        className="object-contain p-[3%]"
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
  href = "/",
  className = "",
}: BrandLogoProps) {
  const s = sizes[size];
  const parts = companyName.trim().split(/\s+/);
  const first = parts[0] || "SHYAM";
  const second = parts.slice(1).join(" ") || "LOGISTIC";
  const custom = logoUrl?.trim() || "";
  const isDefaultBrand =
    !custom ||
    /shyam-logo|shyam-brand|shyam-mark|shyam-peacock|\/brand\/logo/i.test(
      custom
    );
  // Use crisp circular mark for default brand so feathers stay visible at small size
  const markSrc = isDefaultBrand ? DEFAULT_MARK_URL : custom;
  const useSquareCustom = Boolean(custom && !isDefaultBrand);

  return (
    <Link
      href={href}
      className={`group inline-flex max-w-full min-w-0 items-center ${s.gap} ${className}`.trim()}
      aria-label={`${companyName} home`}
    >
      <span
        aria-hidden
        className={`relative shrink-0 overflow-hidden shadow-[0_1px_5px_rgba(10,31,61,0.12)] ${
          useSquareCustom
            ? "rounded-lg bg-white ring-1 ring-line"
            : "rounded-full bg-gradient-to-b from-white to-[#eef4fa] ring-1 ring-[#0a1f3d]/10"
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
          quality={75}
          className={
            useSquareCustom
              ? "object-contain p-0.5"
              : "object-contain p-[2%]"
          }
          sizes={`${s.markSm * 2}px`}
        />
      </span>

      {showWordmark && (
        <span className="flex min-w-0 flex-1 flex-col leading-none">
          <span
            className={`max-w-full truncate font-display font-bold uppercase tracking-[0.04em] ${s.first} ${
              variant === "dark" ? "text-white" : "text-navy"
            }`}
          >
            {first}
          </span>
          {second ? (
            <span
              className={`mt-0.5 max-w-full truncate font-display font-extrabold uppercase tracking-[0.1em] text-red sm:tracking-[0.14em] ${s.second}`}
            >
              {second}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
