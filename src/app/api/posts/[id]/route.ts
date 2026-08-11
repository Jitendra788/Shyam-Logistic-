import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getPosts, savePosts, slugify } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const posts = await getPosts();
  const idx = posts.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const title = String(body.title ?? posts[idx].title).trim();
  let slug = slugify(String(body.slug ?? posts[idx].slug ?? title));
  if (!slug) slug = posts[idx].slug;

  const slugClash = posts.some((p) => p.slug === slug && p.id !== id);
  if (slugClash) {
    return NextResponse.json(
      { error: "Slug already used by another post" },
      { status: 400 }
    );
  }

  posts[idx] = {
    ...posts[idx],
    title,
    slug,
    excerpt: String(body.excerpt ?? posts[idx].excerpt).trim(),
    content: String(body.content ?? posts[idx].content).trim(),
    category: String(body.category ?? posts[idx].category).trim() || "General",
    author: String(body.author ?? posts[idx].author).trim(),
    coverImage: String(body.coverImage ?? posts[idx].coverImage).trim(),
    published:
      body.published === undefined
        ? posts[idx].published
        : Boolean(body.published),
    updatedAt: new Date().toISOString(),
  };

  await savePosts(posts);
  return NextResponse.json({ ok: true, post: posts[idx] });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const posts = await getPosts();
  const next = posts.filter((p) => p.id !== id);
  if (next.length === posts.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await savePosts(next);
  return NextResponse.json({ ok: true });
}
