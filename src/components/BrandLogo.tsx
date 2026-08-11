import Image from "next/image";
import Link from "next/link";

/** Official SHYAM logo (flute / S mark + wordmark artwork). */
export const DEFAULT_LOGO_URL = "/brand/shyam-logo.png";
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
    logoH: 44,
    logoW: 64,
    text: "text-[0.95rem] xs:text-base sm:text-[1.15rem]",
    gap: "gap-2 sm:gap-2.5",
  },
  md: {
    logoH: 56,
    logoW: 80,
    text: "text-lg sm:text-2xl",
    gap: "gap-2.5 sm:gap-3",
  },
  lg: {
    logoH: 68,
    logoW: 96,
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
  const src = logoUrl?.trim() || DEFAULT_LOGO_URL;

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
          alt=""
          fill
          priority={size === "sm"}
          className="object-contain object-left"
          sizes={`${s.logoW * 2}px`}
        />
      </span>

      {showWordmark && (
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
