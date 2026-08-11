import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  companyName?: string;
  /** Custom uploaded logo; empty uses built-in Shyam mark */
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  showWordmark?: boolean;
};

/** Default brand asset (Shyam monogram + wordmark) */
export const DEFAULT_LOGO_URL = "/brand/shyam-logo.png";
export const DEFAULT_MARK_URL = "/brand/shyam-mark.png";

const sizes = {
  sm: {
    logoH: 44,
    logoW: 118,
    mark: 40,
    text: "text-[0.8rem] xs:text-[0.9rem] sm:text-[1.05rem]",
    gap: "gap-2 sm:gap-2.5",
    logistic: "text-[0.65rem] sm:text-[0.72rem]",
  },
  md: {
    logoH: 56,
    logoW: 150,
    mark: 52,
    text: "text-base sm:text-xl",
    gap: "gap-2.5 sm:gap-3",
    logistic: "text-xs sm:text-sm",
  },
  lg: {
    logoH: 72,
    logoW: 190,
    mark: 64,
    text: "text-lg sm:text-2xl",
    gap: "gap-3 sm:gap-3.5",
    logistic: "text-sm sm:text-base",
  },
};

/** Compact circular mark (blog cards / avatars) */
export function LogoMark({ size }: { size: number }) {
  return (
    <span
      className="relative block shrink-0 overflow-hidden rounded-full bg-white"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={DEFAULT_MARK_URL}
        alt=""
        fill
        className="object-contain p-[8%]"
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
  const resolved = (logoUrl?.trim() || DEFAULT_LOGO_URL).trim();
  const isDefaultShyam =
    resolved === DEFAULT_LOGO_URL || resolved.includes("shyam-logo");

  // Default Shyam asset already includes the “Shyam” word — only show LOGISTIC
  const showFullText = showWordmark && !isDefaultShyam;
  const showLogisticOnly = showWordmark && isDefaultShyam && Boolean(second);

  return (
    <Link
      href="/"
      className={`group inline-flex max-w-full min-w-0 items-center ${s.gap}`}
      aria-label={companyName}
    >
      <span
        className="relative shrink-0 overflow-hidden rounded-md bg-white/95 shadow-[0_1px_3px_rgba(10,31,61,0.1)] ring-1 ring-black/5 transition group-hover:shadow-[0_2px_10px_rgba(176,112,48,0.22)]"
        style={{
          width: s.logoW,
          height: s.logoH,
          maxWidth: "42vw",
        }}
      >
        <Image
          src={resolved}
          alt=""
          fill
          priority={size === "sm"}
          className="object-contain object-center p-1 sm:p-1.5"
          sizes={`(max-width: 640px) ${s.logoW}px, ${s.logoW}px`}
        />
      </span>

      {showFullText && (
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

      {showLogisticOnly && (
        <span
          className={`hidden min-w-0 flex-col leading-none sm:flex ${variant === "dark" ? "text-white" : "text-navy"}`}
          >
          <span
            className={`font-display font-bold uppercase tracking-[0.14em] ${s.logistic}`}
          >
            {second}
          </span>
          <span
            className={`mt-0.5 block h-0.5 w-full max-w-[4.5rem] rounded-full ${
              variant === "dark" ? "bg-gold/80" : "bg-[#b07030]"
            }`}
          />
        </span>
      )}
    </Link>
  );
}
