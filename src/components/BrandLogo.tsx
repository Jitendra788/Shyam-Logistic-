import Image from "next/image";
import Link from "next/link";

/** Full Shyam logo with mor pankh (peacock) + wordmark */
export const DEFAULT_LOGO_URL = "/brand/shyam-brand-logo.png";
/** Compact circular mark for badges */
export const DEFAULT_MARK_URL = "/brand/shyam-mark.png";

type BrandLogoProps = {
  companyName?: string;
  /** Custom uploaded logo; empty uses official Shyam logo */
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showWordmark?: boolean;
};

const sizes = {
  sm: {
    logoH: 52,
    logoW: 50,
    text: "text-[0.95rem] xs:text-base sm:text-[1.15rem]",
    gap: "gap-2 sm:gap-2.5",
  },
  md: {
    logoH: 72,
    logoW: 68,
    text: "text-lg sm:text-2xl",
    gap: "gap-2.5 sm:gap-3",
  },
  lg: {
    logoH: 88,
    logoW: 84,
    text: "text-xl sm:text-3xl",
    gap: "gap-3 sm:gap-3.5",
  },
};

/** Compact circular mark (blog badges, bylines). */
export function LogoMark({ size }: { size: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={DEFAULT_MARK_URL}
        alt=""
        fill
        className="object-contain p-[6%]"
        sizes={`${size}px`}
      />
    </span>
  );
}

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
  const src = logoUrl?.trim() || DEFAULT_LOGO_URL;
  // Full brand art already has Shyam / LOGISTIC — avoid duplicate text
  const hasBuiltInWordmark =
    /shyam-logo|shyam-brand|\/brand\/logo/i.test(src) &&
    !/shyam-mark/i.test(src);
  const showText = showWordmark && !hasBuiltInWordmark;

  return (
    <Link
      href="/"
      className={`group inline-flex max-w-full min-w-0 items-center ${s.gap}`}
      aria-label={companyName}
    >
      <span
        className="relative shrink-0"
        style={{ width: s.logoW, height: s.logoH }}
      >
        <Image
          src={src}
          alt={companyName}
          fill
          priority={size === "sm"}
          className="object-contain object-left"
          sizes={`${s.logoW * 2}px`}
        />
      </span>

      {showText && (
        <span
          className={`min-w-0 truncate font-display font-bold uppercase leading-[1.05] tracking-[0.02em] sm:tracking-[0.03em] ${s.text}`}
        >
          <span className={variant === "dark" ? "text-white" : "text-navy"}>
            {first}
          </span>
          {second ? (
            <>
              {" "}
              <span className="text-red">{second}</span>
            </>
          ) : null}
        </span>
      )}
    </Link>
  );
}
