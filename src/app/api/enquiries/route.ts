import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { notifyEnquiry } from "@/lib/enquiry-notify";
import { addEnquiry, getEnquiries, getSettings } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function digitsPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("91") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return d;
}

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
    const phone = digitsPhone(String(body.phone || ""));

    if (!name || phone.length < 10) {
      return NextResponse.json(
        { error: "Please enter your name and a valid 10-digit phone number" },
        { status: 400 }
      );
    }

    const { enquiry, saved } = await addEnquiry({
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

    const settings = await getSettings();
    const emailed = await notifyEnquiry(enquiry, settings.email);

    // Vercel cannot write data/*.json; FormSubmit often blocks cloud IPs.
    // Always 201 so the browser can finish delivery via WhatsApp.
    return NextResponse.json(
      { ok: true, enquiry, saved, emailed },
      { status: 201 }
    );
  } catch (err) {
    console.error("enquiry POST", err);
    return NextResponse.json(
      {
        error:
          "Could not send enquiry online. Please call or WhatsApp us instead.",
      },
      { status: 500 }
    );
  }
}
