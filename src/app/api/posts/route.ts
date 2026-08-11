import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPosts, savePosts, slugify } from "@/lib/store";
import type { BlogPost } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "1";
  const posts = await getPosts();

  if (all) {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      posts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );
  }

  return NextResponse.json(
    posts
      .filter((p) => p.published)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  );
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const posts = await getPosts();
    let slug = slugify(String(body.slug || title));
    if (!slug) slug = `post-${Date.now()}`;

    const existing = posts.some((p) => p.slug === slug);
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const now = new Date().toISOString();
    const post: BlogPost = {
      id: `post-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      slug,
      title,
      excerpt: String(body.excerpt || "").trim(),
      content: String(body.content || "").trim(),
      category: String(body.category || "General").trim() || "General",
      author: String(body.author || "SHYAM LOGISTIC").trim(),
      coverImage:
        String(body.coverImage || "/brand/blog/cargo-safe.jpg").trim() ||
        "/brand/blog/cargo-safe.jpg",
      published: Boolean(body.published),
      createdAt: now,
      updatedAt: now,
    };

    posts.unshift(post);
    await savePosts(posts);
    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
