import { failSave, ok, requireAuth, bad } from "@/lib/tbs/api";

export const maxDuration = 30;
export const runtime = "nodejs";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as {
      to?: string;
      subject?: string;
      text?: string;
      fileName?: string;
      pdfBase64?: string;
    };
    const to = String(body.to || "").trim();
    if (!validEmail(to)) return bad("Valid email required");
    const pdfBase64 = String(body.pdfBase64 || "").replace(/^data:application\/pdf;base64,/, "");
    if (!pdfBase64 || pdfBase64.length < 80) return bad("PDF missing");

    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return ok({ ok: false, fallback: true, to });
    }

    const from =
      process.env.ENQUIRY_FROM_EMAIL?.trim() ||
      "SHYAM LOGISTIC <onboarding@resend.dev>";
    const fileName = (body.fileName || "document.pdf").replace(/[^\w.\-]+/g, "_");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: body.subject || "SHYAM LOGISTICS document",
        text: body.text || "Please find the attached PDF.",
        attachments: [{ filename: fileName, content: pdfBase64 }],
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Resend send-doc failed", res.status, errText);
      return ok({ ok: false, fallback: true, to });
    }
    return ok({ ok: true, to });
  } catch (e) {
    return failSave(e);
  }
}
