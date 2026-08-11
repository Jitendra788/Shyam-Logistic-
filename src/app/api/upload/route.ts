import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const FOLDERS = new Set(["blog", "brand"]);

function safeName(original: string): string {
  const base = original
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${base || "image"}-${stamp}`;
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || form.get("folder") || "blog")
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const folder =
      kind === "logo" || kind === "founder" || kind === "brand"
        ? "brand"
        : FOLDERS.has(kind)
          ? kind
          : "blog";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file selected" },
        { status: 400 }
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP or GIF images allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";

    const prefix = kind === "logo" ? "logo" : kind === "founder" ? "founder" : "img";
    const filename = `${prefix}-${safeName(file.name)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${folder}/${filename}`;
    return NextResponse.json({ ok: true, url, filename, folder });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json(
      { error: "Upload failed. Try a smaller image." },
      { status: 500 }
    );
  }
}
