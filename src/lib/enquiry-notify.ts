import type { Enquiry } from "./types";
import { enquiryLines } from "./enquiry-format";

async function sendResend(to: string, enquiry: Enquiry): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;

  const from =
    process.env.ENQUIRY_FROM_EMAIL?.trim() ||
    "SHYAM LOGISTIC <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `New enquiry from ${enquiry.name} — shyamlogistic`,
        text: enquiryLines(enquiry),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function sendFormSubmit(to: string, enquiry: Enquiry): Promise<boolean> {
  if (!to || !to.includes("@")) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: `New enquiry from ${enquiry.name} — shyamlogistic`,
          _template: "box",
          _captcha: "false",
          name: enquiry.name,
          phone: enquiry.phone,
          email: enquiry.email || "not provided",
          company: enquiry.company || "—",
          fromCity: enquiry.fromCity || "—",
          toCity: enquiry.toCity || "—",
          cargoType: enquiry.cargoType || "—",
          weight: enquiry.weight || "—",
          message: enquiry.message || "—",
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) return false;
    const data = (await res.json().catch(() => null)) as
      | { success?: boolean | string }
      | null;
    if (!data) return res.ok;
    return data.success === true || data.success === "true";
  } catch {
    return false;
  }
}

/** Email the lead. Works on Vercel without a database. */
export async function notifyEnquiry(
  enquiry: Enquiry,
  toEmail: string
): Promise<boolean> {
  const to = toEmail.trim();
  if (await sendResend(to, enquiry)) return true;
  return sendFormSubmit(to, enquiry);
}
