import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getEnquiries, saveEnquiries } from "@/lib/store";
import type { EnquiryStatus } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = body.status as EnquiryStatus;

  if (!["new", "contacted", "closed"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const enquiries = await getEnquiries();
  const idx = enquiries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  enquiries[idx] = { ...enquiries[idx], status };
  await saveEnquiries(enquiries);
  return NextResponse.json({ ok: true, enquiry: enquiries[idx] });
}

export async function DELETE(_request: Request, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const enquiries = await getEnquiries();
  const next = enquiries.filter((e) => e.id !== id);
  if (next.length === enquiries.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await saveEnquiries(next);
  return NextResponse.json({ ok: true });
}
