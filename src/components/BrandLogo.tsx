import Link from "next/link";

type BrandLogoProps = {
  companyName?: string;
  size?: "sm" | "md" | "lg";
  /** light = navy/red on white header; dark = white/red on navy footer */
  variant?: "light" | "dark";
  showWordmark?: boolean;
};

const sizes = {
  sm: { mark: 42, text: "text-lg sm:text-[1.25rem]", gap: "gap-2.5" },
  md: { mark: 54, text: "text-xl sm:text-2xl", gap: "gap-3" },
  lg: { mark: 68, text: "text-2xl sm:text-3xl", gap: "gap-3.5" },
};

function LogoMark({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="block"
    >
      <circle cx="60" cy="60" r="58" fill="#ffffff" />
      <circle
        cx="60"
        cy="60"
        r="55"
        stroke="#0a1f3d"
        strokeWidth="5"
        fill="none"
      />
      <circle
        cx="60"
        cy="60"
        r="47"
        stroke="#dce5f0"
        strokeWidth="1.5"
        fill="none"
      />
      {/* S — navy */}
      <text
        x="28"
        y="78"
        fill="#0a1f3d"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontSize="52"
        fontWeight="900"
        letterSpacing="-2"
      >
        S
      </text>
      {/* B — red */}
      <text
        x="62"
        y="78"
        fill="#c62828"
        fontFamily="Arial Black, Arial, Helvetica, sans-serif"
        fontSize="52"
        fontWeight="900"
        letterSpacing="-2"
      >
        B
      </text>
    </svg>
  );
}

export function BrandLogo({
  companyName = "SHYAM LOGISTIC",
  size = "sm",
  variant = "light",
  showWordmark = true,
}: BrandLogoProps) {
  const s = sizes[size];
  const parts = companyName.trim().split(/\s+/);
  const first = parts[0] || "SHYAM";
  const second = parts.slice(1).join(" ") || "LOGISTIC";

  return (
    <Link
      href="/"
      className={`group inline-flex items-center ${s.gap}`}
      aria-label={companyName}
    >
      <span
        className="shrink-0 rounded-full shadow-[0_1px_3px_rgba(10,31,61,0.12)] transition group-hover:shadow-[0_2px_8px_rgba(198,40,40,0.2)]"
        style={{ width: s.mark, height: s.mark }}
      >
        <LogoMark size={s.mark} />
      </span>

      {showWordmark && (
        <span
          className={`font-display font-bold uppercase leading-[1.05] tracking-[0.03em] ${s.text}`}
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
