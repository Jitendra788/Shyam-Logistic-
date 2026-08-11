import Image from "next/image";
import { LogoMark } from "./BrandLogo";

type BlogCoverProps = {
  title: string;
  companyName?: string;
  coverImage?: string;
  className?: string;
  logoSize?: number;
  priority?: boolean;
};

/** Always shows a real photo + SHYAM LOGISTIC logo badge on every blog. */
export function BlogCover({
  title,
  companyName = "SHYAM LOGISTIC",
  coverImage = "/brand/hero.jpg",
  className = "",
  logoSize = 56,
  priority = false,
}: BlogCoverProps) {
  const parts = companyName.trim().split(/\s+/);
  const first = parts[0] || "SHYAM";
  const second = parts.slice(1).join(" ") || "LOGISTIC";
  const src = coverImage?.trim() || "/brand/hero.jpg";
  const mark = Math.max(40, Math.min(logoSize, 80));
  const isRemoteOrData =
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://");

  return (
    <div
      className={`relative h-full w-full min-h-[10.5rem] overflow-hidden bg-[#0a1f3d] sm:min-h-[12rem] ${className}`}
    >
      {isRemoteOrData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      ) : (
        <Image
          src={src}
          alt={title}
          fill
          priority={priority}
          unoptimized={src.startsWith("/uploads/")}
          className="object-cover object-center"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#061428]/75 via-transparent to-[#061428]/25"
      />

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 p-2 text-center sm:gap-2 sm:p-3">
        <span className="rounded-full bg-white p-0.5 shadow-lg ring-2 ring-white sm:p-1">
          <LogoMark size={mark} />
        </span>
        <p className="rounded-md bg-white/95 px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.04em] shadow sm:px-3 sm:py-1 sm:text-sm sm:tracking-[0.06em] md:text-base">
          <span className="text-[#0a1f3d]">{first}</span>{" "}
          <span className="text-[#c62828]">{second}</span>
        </p>
      </div>

      <div className="absolute left-2 top-2 z-20 flex max-w-[calc(100%-1rem)] items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-md sm:left-2.5 sm:top-2.5 sm:gap-1.5 sm:px-2">
        <LogoMark size={18} />
        <span className="truncate text-[9px] font-bold uppercase tracking-wide sm:text-[11px]">
          <span className="text-[#0a1f3d]">{first}</span>{" "}
          <span className="text-[#c62828]">{second}</span>
        </span>
      </div>
    </div>
  );
}
