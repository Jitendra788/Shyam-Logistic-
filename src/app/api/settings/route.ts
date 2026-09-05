import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getSettings, publicSettings, saveSettings } from "@/lib/store";
import type { SiteSettings } from "@/lib/types";

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(publicSettings(settings));
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as SiteSettings;
    if (!body.companyName || !Array.isArray(body.locations)) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }
    const existing = await getSettings();
    const {
      emailPdfReady: _ready,
      gmailAppPassword: incomingPass,
      ...rest
    } = body;
    const gmailAppPassword =
      typeof incomingPass === "string" && incomingPass.trim()
        ? incomingPass.trim()
        : existing.gmailAppPassword || "";
    const next = { ...existing, ...rest, gmailAppPassword };
    await saveSettings(next);
    return NextResponse.json({ ok: true, settings: publicSettings(next) });
  } catch {
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
