import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { saveAdminPassword, verifyAdminPassword } from "@/lib/adminPassword";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");
    if (!(await verifyAdminPassword(currentPassword))) {
      return NextResponse.json(
        { error: "Current password galat hai" },
        { status: 400 },
      );
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Naya password kam se kam 8 characters ka hona chahiye" },
        { status: 400 },
      );
    }
    if (newPassword.length > 72) {
      return NextResponse.json(
        { error: "Password bahut lamba hai" },
        { status: 400 },
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Naya password purane se alag hona chahiye" },
        { status: 400 },
      );
    }
    const stored = await saveAdminPassword(newPassword);
    if (!stored) {
      return NextResponse.json(
        {
          error:
            "Password save nahi hua. Server storage (Blob/Postgres) check karo.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Password change failed" }, { status: 500 });
  }
}
