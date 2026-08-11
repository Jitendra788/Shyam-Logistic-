import { getPublishedPosts } from "@/lib/store";
import { getSiteUrl } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dayStamp(input?: string | Date): string {
  const d = input ? new Date(input) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const site = getSiteUrl().replace(/\/$/, "");
  const posts = await getPublishedPosts();
  const today = dayStamp();

  const pages: { loc: string; lastmod: string; changefreq: string; priority: string }[] =
    [
      {
        loc: `${site}/`,
        lastmod: today,
        changefreq: "weekly",
        priority: "1.0",
      },
      {
        loc: `${site}/shyamlogistic`,
        lastmod: today,
        changefreq: "weekly",
        priority: "1.0",
      },
      {
        loc: `${site}/about`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.9",
      },
      {
        loc: `${site}/services`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.95",
      },
      {
        loc: `${site}/blog`,
        lastmod: today,
        changefreq: "weekly",
        priority: "0.9",
      },
      {
        loc: `${site}/contact`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.85",
      },
      {
        loc: `${site}/quote`,
        lastmod: today,
        changefreq: "monthly",
        priority: "0.95",
      },
      ...posts.map((post) => ({
        loc: `${site}/blog/${post.slug}`,
        lastmod: dayStamp(post.updatedAt || post.createdAt),
        changefreq: "monthly",
        priority: "0.8",
      })),
    ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    pages
      .map(
        (p) =>
          `  <url>\n` +
          `    <loc>${escapeXml(p.loc)}</loc>\n` +
          `    <lastmod>${p.lastmod}</lastmod>\n` +
          `    <changefreq>${p.changefreq}</changefreq>\n` +
          `    <priority>${p.priority}</priority>\n` +
          `  </url>`
      )
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
