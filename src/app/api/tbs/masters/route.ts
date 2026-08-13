import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import { getMasters, saveMasters } from "@/lib/tbs/store";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return ok({ masters: await getMasters() });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as { particulars?: string };
    const p = String(body.particulars || "").trim();
    if (!p) return bad("Type Particulars first");
    const masters = await getMasters();
    const exists = masters.particulars.some(
      (x) => x.toLowerCase() === p.toLowerCase(),
    );
    if (!exists) {
      masters.particulars = [p, ...masters.particulars];
      await saveMasters(masters);
    }
    return ok({ masters });
  } catch (e) {
    return failSave(e);
  }
}
