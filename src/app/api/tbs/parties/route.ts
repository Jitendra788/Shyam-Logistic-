import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import {
  getMasters,
  getParties,
  nextCode,
  nudgeMasters,
  saveSlice,
  uid,
} from "@/lib/tbs/store";
import type { Party } from "@/lib/tbs/types";
import { duplicateDocMessage, findDupByNo } from "@/lib/tbs/nextCode";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const [parties, masters] = await Promise.all([getParties(), getMasters()]);
    return ok({ parties, masters, nextCode: nextCode(parties, "partyCode", 1) });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<Party>;
    if (!body.partyName?.trim()) return bad("Party Name required");
    const [parties, masters] = await Promise.all([getParties(), getMasters()]);
    const partyName = body.partyName.trim();
    const partyCode =
      String(body.partyCode || "").trim() || nextCode(parties, "partyCode", 1);
    if (
      parties.some((p) => p.partyName.trim().toLowerCase() === partyName.toLowerCase())
    ) {
      return bad(duplicateDocMessage("Party Name", partyName));
    }
    if (findDupByNo(parties, "partyCode", partyCode)) {
      return bad(duplicateDocMessage("Party Code", partyCode));
    }
    const party: Party = {
      id: uid("p"),
      partyCode,
      partyName,
      contactNo: body.contactNo || "",
      email: String(body.email || "").trim(),
      address: body.address || "",
      gstTin: body.gstTin || "",
      partyType: body.partyType || "Consigner/Consignee",
      panNo: body.panNo || "",
      opBalance: Number(body.opBalance) || 0,
      accountStartFrom:
        body.accountStartFrom || new Date().toISOString().slice(0, 10),
    };
    await saveSlice({
      parties: [party, ...parties],
      masters: nudgeMasters(masters, { partyTypes: [party.partyType] }),
    });
    return ok(party, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Party;
    if (!body.id) return bad("id required");
    const [parties, masters] = await Promise.all([getParties(), getMasters()]);
    const idx = parties.findIndex((p) => p.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    const partyName = String(body.partyName || parties[idx].partyName).trim();
    const partyCode = String(body.partyCode || parties[idx].partyCode).trim();
    if (
      parties.some(
        (p) =>
          p.id !== body.id &&
          p.partyName.trim().toLowerCase() === partyName.toLowerCase(),
      )
    ) {
      return bad(duplicateDocMessage("Party Name", partyName));
    }
    if (findDupByNo(parties, "partyCode", partyCode, body.id)) {
      return bad(duplicateDocMessage("Party Code", partyCode));
    }
    const next = [...parties];
    next[idx] = {
      ...parties[idx],
      ...body,
      partyName,
      partyCode,
      email: String(body.email ?? parties[idx].email ?? "").trim(),
    };
    await saveSlice({
      parties: next,
      masters: nudgeMasters(masters, { partyTypes: [next[idx].partyType] }),
    });
    return ok(next[idx]);
  } catch (e) {
    return failSave(e);
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return bad("id required");
    const parties = await getParties();
    await saveSlice({ parties: parties.filter((p) => p.id !== id) });
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
