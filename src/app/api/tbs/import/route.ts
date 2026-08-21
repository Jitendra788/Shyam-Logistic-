import { failSave, ok, requireAuth } from "@/lib/tbs/api";

/** Browser leftover import is disabled — lists come only from Postgres. */
export async function POST() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    return ok({ ok: true, imported: [] as string[], ignored: true });
  } catch (e) {
    return failSave(e);
  }
}
