import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAssignmentById, setAssignmentArchived } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await getAssignmentById(id);
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  // Members may only archive their own assignments.
  if (session.role !== "lead" && existing.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  // Default to archiving; pass { archived: false } to restore.
  const archived = body?.archived !== false;
  await setAssignmentArchived(id, archived);
  return NextResponse.json({ ok: true, archived });
}
