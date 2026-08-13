import { bad, ok, requireAuth } from "@/lib/tbs/api";
import { getMasters, getParties, nextCode, saveParties, uid } from "@/lib/tbs/store";
import type { Party } from "@/lib/tbs/types";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  const [parties, masters] = await Promise.all([getParties(), getMasters()]);
  return ok({ parties, masters, nextCode: nextCode(parties, "partyCode", 1047) });
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = (await req.json()) as Partial<Party>;
  if (!body.partyName?.trim()) return bad("Party Name required");
  const parties = await getParties();
  const party: Party = {
    id: uid("p"),
    partyCode: body.partyCode || nextCode(parties, "partyCode", 1047),
    partyName: body.partyName.trim(),
    contactNo: body.contactNo || "",
    address: body.address || "",
    gstTin: body.gstTin || "",
    partyType: body.partyType || "Customer",
    panNo: body.panNo || "",
    opBalance: Number(body.opBalance) || 0,
    accountStartFrom: body.accountStartFrom || new Date().toISOString().slice(0, 10),
  };
  parties.unshift(party);
  await saveParties(parties);
  return ok(party, 201);
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const body = (await req.json()) as Party;
  if (!body.id) return bad("id required");
  const parties = await getParties();
  const idx = parties.findIndex((p) => p.id === body.id);
  if (idx < 0) return bad("Not found", 404);
  parties[idx] = { ...parties[idx], ...body };
  await saveParties(parties);
  return ok(parties[idx]);
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return bad("id required");
  const parties = await getParties();
  await saveParties(parties.filter((p) => p.id !== id));
  return ok({ ok: true });
}
