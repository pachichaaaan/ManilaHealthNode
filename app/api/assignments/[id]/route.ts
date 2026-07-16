import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteAssignment, getAssignmentById, updateAssignment } from "@/lib/repo";
import { assignmentUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await getAssignmentById(id);
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  // Members may only edit their own assignments.
  if (session.role !== "lead" && existing.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = assignmentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the assignment details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const patch = { ...parsed.data };
  // Only leads may reassign an assignment to a different owner.
  if (session.role !== "lead") delete patch.ownerId;

  const assignment = await updateAssignment(id, patch);
  return NextResponse.json({ assignment });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const existing = await getAssignmentById(id);
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  if (session.role !== "lead" && existing.ownerId !== session.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteAssignment(id);
  return NextResponse.json({ ok: true });
}
