import { failSave, ok, requireAuth, bad } from "@/lib/tbs/api";
import { COMPANY_GMAIL, saveGmailSmtp } from "@/lib/tbs/gmailSecret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { pass?: string; user?: string };
    const pass = String(body.pass || "").replace(/\s/g, "");
    if (pass.length < 8) return bad("Gmail App Password required");
    const user = String(body.user || COMPANY_GMAIL).trim() || COMPANY_GMAIL;
    const pgOk = await saveGmailSmtp(user, pass);
    return ok({ ok: true, stored: pgOk });
  } catch (e) {
    return failSave(e);
  }
}
