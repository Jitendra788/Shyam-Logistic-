import { NextResponse } from "next/server";
import { adminDisplayName, getSessionUsername } from "@/lib/auth";

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    username,
    displayName: adminDisplayName(username),
    company: "SHYAM LOGISTICS",
  });
}
