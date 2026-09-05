import { failSave, ok, requireAuth, bad } from "@/lib/tbs/api";
import { getSettings } from "@/lib/store";
import { sendPdfViaGmail } from "@/lib/tbs/sendPdfGmail";

export const maxDuration = 30;
export const runtime = "nodejs";

const COMPANY_NAME = "SHYAM LOGISTICS";
const COMPANY_EMAIL = "shyamlogisticscompany535@gmail.com";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fromHeader(email: string) {
  return `${COMPANY_NAME} <${email}>`;
}

async function sendResend(opts: {
  key: string;
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  fileName: string;
  pdfBase64: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      reply_to: opts.replyTo,
      subject: opts.subject,
      text: opts.text,
      attachments: [{ filename: opts.fileName, content: opts.pdfBase64 }],
    }),
  });
  const errText = res.ok ? "" : await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, errText };
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
    if (!validEmail(to)) return bad("Enter Receiver Email ID me sahi email likho");
    const pdfBase64 = String(body.pdfBase64 || "").replace(
      /^data:application\/pdf;base64,/,
      "",
    );
    if (!pdfBase64 || pdfBase64.length < 80) return bad("PDF missing");

    const settings = await getSettings().catch(() => null);
    const companyEmail =
      String(settings?.email || "").trim() || COMPANY_EMAIL;
    const gmailPass =
      String(settings?.gmailAppPassword || "").trim() ||
      process.env.SMTP_PASS?.trim() ||
      process.env.GMAIL_APP_PASSWORD?.trim() ||
      "";
    const fileName = (body.fileName || "document.pdf").replace(/[^\w.\-]+/g, "_");
    const subject = body.subject || `${COMPANY_NAME} document`;
    const text = body.text || "Please find the attached PDF.";

    if (gmailPass) {
      try {
        await sendPdfViaGmail({
          user: companyEmail,
          pass: gmailPass,
          to,
          subject,
          text,
          fileName,
          pdfBase64,
        });
        return ok({ ok: true, to, from: companyEmail });
      } catch (e) {
        console.error("Gmail SMTP send-doc failed", e);
        return bad(
          "Gmail se email nahi gayi. Website Settings me company email + Gmail App Password check karein (2-Step Verification on hona chahiye).",
        );
      }
    }

    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
      return bad(
        "Company email setup nahi hai. Admin → Website Settings me Gmail App Password save karein.",
      );
    }

    const configuredFrom =
      process.env.ENQUIRY_FROM_EMAIL?.trim() ||
      process.env.TBS_FROM_EMAIL?.trim() ||
      "";
    const payload = {
      key,
      to,
      replyTo: companyEmail,
      subject,
      text,
      fileName,
      pdfBase64,
    };

    let result = await sendResend({
      ...payload,
      from: configuredFrom || fromHeader(companyEmail),
    });
    if (!result.ok && !configuredFrom) {
      result = await sendResend({
        ...payload,
        from: fromHeader("onboarding@resend.dev"),
      });
    }
    if (!result.ok) {
      console.error("Resend send-doc failed", result.status, result.errText);
      return bad("Company email se PDF nahi gayi. Gmail App Password Website Settings me save karein.");
    }
    return ok({ ok: true, to, from: companyEmail });
  } catch (e) {
    return failSave(e);
  }
}
