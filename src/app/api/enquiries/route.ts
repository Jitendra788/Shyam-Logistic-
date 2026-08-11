import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { addEnquiry, getEnquiries } from "@/lib/store";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const enquiries = await getEnquiries();
  return NextResponse.json(enquiries);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const enquiry = await addEnquiry({
      name,
      phone,
      email: String(body.email || "").trim(),
      company: String(body.company || "").trim(),
      fromCity: String(body.fromCity || "").trim(),
      toCity: String(body.toCity || "").trim(),
      cargoType: String(body.cargoType || "").trim(),
      weight: String(body.weight || "").trim(),
      message: String(body.message || "").trim(),
    });

    return NextResponse.json({ ok: true, enquiry }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit enquiry" },
      { status: 500 }
    );
  }
}
