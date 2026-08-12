import Link from "next/link";
import type { BlogPost } from "@/lib/types";
import { BlogCover } from "./BlogCover";
import { LogoMark } from "./BrandLogo";

export function BlogCard({
  post,
  companyName = "SHYAM LOGISTIC",
}: {
  post: BlogPost;
  companyName?: string;
}) {
  const date = new Date(post.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <article className="card-grid-item group flex h-full flex-col overflow-hidden !p-0">
      <Link
        href={`/blog/${post.slug}`}
        aria-label={`Read article: ${post.title}`}
        className="relative block aspect-[16/10] w-full overflow-hidden bg-[#0a1f3d]"
      >
        <BlogCover
          title={post.title}
          companyName={companyName}
          coverImage={post.coverImage}
          logoSize={48}
          className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.03]"
        />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex min-w-0 items-center gap-2">
          <span className="shrink-0">
            <LogoMark size={26} />
          </span>
          <span className="min-w-0 truncate font-display text-[11px] font-bold uppercase tracking-wide sm:text-xs">
            <span className="text-navy">
              {companyName.split(" ")[0] || "SHYAM"}
            </span>{" "}
            <span className="text-red">
              {companyName.split(" ").slice(1).join(" ") || "LOGISTIC"}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red">
          <span>{post.category}</span>
          <span className="text-muted">·</span>
          <time className="font-medium normal-case tracking-normal text-muted">
            {date}
          </time>
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug text-navy sm:text-xl">
          <Link href={`/blog/${post.slug}`} className="hover:text-red">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="mt-4 inline-flex text-sm font-semibold text-navy hover:text-red"
        >
          Read more →
        </Link>
      </div>
    </article>
  );
}
