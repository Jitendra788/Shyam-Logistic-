import { bad, failSave, ok, requireAuth } from "@/lib/tbs/api";
import { getNotes, getParties, nextCode, saveNotes, uid } from "@/lib/tbs/store";
import type { NoteVoucher } from "@/lib/tbs/types";

export async function GET(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const type = new URL(req.url).searchParams.get("type");
    const [notes, parties] = await Promise.all([getNotes(), getParties()]);
    return ok({
      notes: type ? notes.filter((n) => n.type === type) : notes,
      parties,
    });
  } catch (e) {
    return failSave(e);
  }
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as Partial<NoteVoucher>;
    if (!body.type) return bad("type required");
    const notes = await getNotes();
    const same = notes.filter((n) => n.type === body.type);
    const row: NoteVoucher = {
      id: uid("n"),
      type: body.type,
      date: body.date || new Date().toISOString().slice(0, 10),
      partyName: body.partyName || "",
      amount: Number(body.amount) || 0,
      narration: body.narration || "",
      voucherNo: body.voucherNo || nextCode(same, "voucherNo", 1),
    };
    notes.unshift(row);
    await saveNotes(notes);
    return ok(row, 201);
  } catch (e) {
    return failSave(e);
  }
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const body = (await req.json()) as NoteVoucher;
    if (!body.id) return bad("id required");
    const notes = await getNotes();
    const idx = notes.findIndex((n) => n.id === body.id);
    if (idx < 0) return bad("Not found", 404);
    notes[idx] = { ...notes[idx], ...body };
    await saveNotes(notes);
    return ok(notes[idx]);
  } catch (e) {
    return failSave(e);
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;
  try {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("id required");
    const notes = await getNotes();
    await saveNotes(notes.filter((n) => n.id !== id));
    return ok({ ok: true });
  } catch (e) {
    return failSave(e);
  }
}
