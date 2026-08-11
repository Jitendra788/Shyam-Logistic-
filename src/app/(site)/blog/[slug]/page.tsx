import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogCard } from "@/components/BlogCard";
import { BlogCover } from "@/components/BlogCover";
import { BrandLogo, LogoMark } from "@/components/BrandLogo";
import { SEO_KEYWORDS, absoluteUrl } from "@/lib/seo";
import {
  getPostBySlug,
  getPublishedPosts,
  getSettings,
} from "@/lib/store";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found | shyamlogistic" };
  const url = absoluteUrl(`/blog/${post.slug}`);
  const title = `${post.title} | shyamlogistic Blog`;
  const description = `${post.excerpt} — Read more on the shyamlogistic (SHYAM LOGISTIC) logistics blog.`;
  return {
    title,
    description,
    keywords: [
      "shyamlogistic",
      "shyam logistic",
      post.category,
      post.title,
      "shyamlogistic blog",
      ...SEO_KEYWORDS.slice(0, 12),
    ],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt,
      authors: [post.author || "shyamlogistic"],
      images: [
        {
          url: absoluteUrl(post.coverImage || "/brand/hero.jpg"),
          alt: `${post.title} — shyamlogistic`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl(post.coverImage || "/brand/hero.jpg")],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getPostBySlug(slug),
    getSettings(),
  ]);
  if (!post) notFound();

  const paragraphs = post.content.split("\n\n").filter(Boolean);
  const date = new Date(post.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const related = (await getPublishedPosts())
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  return (
    <div>
      <article>
        <section className="page-hero">
          <div className="site-container relative z-10 max-w-3xl">
            <div className="mb-5">
              <BrandLogo
                companyName={settings.companyName}
                size="sm"
                variant="dark"
              />
            </div>
            <p className="section-label !text-gold">{post.category}</p>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/70">
              <LogoMark size={22} />
              <span>
                By {post.author} · {date}
              </span>
            </p>
          </div>
        </section>

        <div className="site-container max-w-3xl px-4 py-8 sm:py-12">
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl border border-line shadow-sm sm:mb-10 sm:rounded-2xl">
            <BlogCover
              title={post.title}
              companyName={settings.companyName}
              coverImage={post.coverImage}
              logoSize={96}
              priority
              className="absolute inset-0"
            />
          </div>

          <div className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-sand/80 px-4 py-3">
            <LogoMark size={40} />
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide">
                <span className="text-navy">
                  {settings.companyName.split(" ")[0]}
                </span>{" "}
                <span className="text-red">
                  {settings.companyName.split(" ").slice(1).join(" ")}
                </span>
              </p>
              <p className="text-xs text-muted">Official blog · GST {settings.gstin}</p>
            </div>
          </div>

          <p className="text-lg leading-relaxed text-navy/80">{post.excerpt}</p>

          <div className="prose-like mt-8 space-y-4">
            {paragraphs.map((para) => {
              if (para.includes("\n") && !para.includes(". ")) {
                const lines = para.split("\n").filter(Boolean);
                return (
                  <ul
                    key={para.slice(0, 40)}
                    className="list-disc space-y-2 pl-5 text-base leading-relaxed text-muted"
                  >
                    {lines.map((line) => (
                      <li key={line}>{line.replace(/^[-•]\s*/, "")}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p
                  key={para.slice(0, 40)}
                  className="whitespace-pre-line text-base leading-relaxed text-muted"
                >
                  {para}
                </p>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pt-8">
            <div className="btn-stack-mobile">
              <Link href="/blog" className="btn-navy">
                ← All posts
              </Link>
              <Link href="/quote" className="btn-primary">
                Get Free Quote
              </Link>
            </div>
            <BrandLogo companyName={settings.companyName} size="sm" />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-line bg-sand py-14">
          <div className="site-container">
            <div className="mb-6 flex items-center gap-3">
              <LogoMark size={36} />
              <h2 className="section-title text-3xl">More from our blog</h2>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <BlogCard
                  key={p.id}
                  post={p}
                  companyName={settings.companyName}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
