import type { Metadata } from "next";
import { BlogCard } from "@/components/BlogCard";
import { BrandLogo } from "@/components/BrandLogo";
import { PageHero } from "@/components/PageHero";
import { pageMeta } from "@/lib/page-meta";
import { getPublishedPosts, getSettings } from "@/lib/store";

export const metadata: Metadata = pageMeta({
  title: "Blog | FTL, PTL and Freight Tips for India",
  description:
    "Read the SHYAM LOGISTIC blog for freight guides: FTL vs PTL, cargo packing tips, and pan-India transport advice for businesses.",
  path: "/blog",
  keywords: [
    "SHYAM LOGISTIC blog",
    "shyamlogistic blog",
    "logistics blog India",
    "FTL vs PTL guide",
  ],
});

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    getPublishedPosts(),
    getSettings(),
  ]);

  return (
    <div>
      <PageHero
        eyebrow="Insights & Updates"
        title="Our Blog"
        subtitle="Practical freight guides and logistics tips to help you move cargo smarter across India."
      />

      <section className="py-12 sm:py-16 md:py-20">
        <div className="site-container">
          <div className="mb-10 flex justify-center sm:justify-start">
            <BrandLogo companyName={settings.companyName} size="md" />
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center text-muted">
              Blog posts will appear here soon.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <BlogCard
                  key={post.id}
                  post={post}
                  companyName={settings.companyName}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
