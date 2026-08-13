"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/types";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Logistics Guide",
  author: "SHYAM LOGISTIC",
  coverImage: "/brand/blog/cargo-safe.jpg",
  published: true,
};

export default function AdminBlogPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const me = await fetch("/api/auth/me");
    const meData = await me.json();
    if (!meData.authenticated) {
      router.replace("/admin/login");
      return;
    }
    const res = await fetch("/api/posts?all=1");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField<K extends keyof typeof emptyForm>(
    key: K,
    value: (typeof emptyForm)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function startEdit(post: BlogPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      author: post.author,
      coverImage: post.coverImage,
      published: post.published,
    });
    setMessage("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onCoverPick(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setField("coverImage", data.url as string);
      setMessage("Cover image uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const url = editingId ? `/api/posts/${editingId}` : "/api/posts";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setMessage(editingId ? "Post updated." : "Post published.");
      setEditingId(null);
      setForm(emptyForm);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this blog post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) startCreate();
    }
  }

  if (loading) return <p className="text-muted">Loading blog posts...</p>;

  return (
    <div className="space-y-10">
      <div>
        <p className="section-label">Content</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-navy">
          Blog posts
        </h1>
        <p className="mt-1 text-sm text-muted">
          Create and manage articles shown on /blog and the home page.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-navy">
            {editingId ? "Edit post" : "New post"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={startCreate}
              className="text-sm font-semibold text-red"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Title *"
            value={form.title}
            onChange={(v) => setField("title", v)}
            required
          />
          <Field
            label="Slug (optional)"
            value={form.slug}
            onChange={(v) => setField("slug", v)}
            placeholder="auto-from-title"
          />
          <Field
            label="Category"
            value={form.category}
            onChange={(v) => setField("category", v)}
          />
          <Field
            label="Author"
            value={form.author}
            onChange={(v) => setField("author", v)}
          />
          <label className="flex items-center gap-2 pt-2 text-sm font-medium md:col-span-2 md:pt-0">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setField("published", e.target.checked)}
            />
            Published (visible on website)
          </label>
        </div>

        {/* Cover image upload — phone gallery / camera + laptop files */}
        <div className="rounded-xl border border-dashed border-line bg-sand/40 p-4">
          <p className="mb-2 text-sm font-medium text-ink">Cover image</p>
          <p className="mb-3 text-xs text-muted">
            Phone: gallery or camera · Laptop: choose a file · JPG, PNG, or
            WebP (max 5 MB)
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-line bg-navy/10 sm:max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.coverImage || "/brand/hero.jpg"}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-mid"
                disabled={uploading}
                onChange={(e) => onCoverPick(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  className="btn-navy !min-h-0 !py-2 !text-sm"
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "Choose / Upload image"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold text-navy"
                  onClick={() => {
                    setField("coverImage", "/brand/blog/cargo-safe.jpg");
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  Use default
                </button>
              </div>
              <p className="break-all text-xs text-muted">
                Path: {form.coverImage}
              </p>
            </div>
          </div>
        </div>

        <TextArea
          label="Excerpt"
          value={form.excerpt}
          onChange={(v) => setField("excerpt", v)}
        />
        <TextArea
          label="Content (paragraphs separated by blank line)"
          value={form.content}
          onChange={(v) => setField("content", v)}
          tall
        />

        {message && <p className="text-sm text-success">{message}</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={saving || uploading} className="btn-primary">
          {saving ? "Saving..." : editingId ? "Update post" : "Create post"}
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="font-display text-2xl font-bold text-navy">
          All posts ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p className="text-muted">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-wrap items-start gap-4 rounded-xl border border-line bg-white p-4"
            >
              <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage || "/brand/hero.jpg"}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-navy">{post.title}</h3>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase ${
                      post.published
                        ? "bg-success/10 text-success"
                        : "bg-sand text-muted"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {post.category} · /blog/{post.slug}
                </p>
              </div>
              <div className="flex gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className="text-navy hover:underline"
                >
                  Edit
                </button>
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-steel hover:underline"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => remove(post.id)}
                  className="text-danger hover:underline"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        className="input-field"
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  tall,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  tall?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <textarea
        className={`input-field resize-y ${tall ? "min-h-48" : "min-h-24"}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
