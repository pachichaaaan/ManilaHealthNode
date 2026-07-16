import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAssignment, getUserById, listAssignments } from "@/lib/repo";
import { assignmentCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Members see only their own; leads see everyone's.
  const assignments = await listAssignments(session.role === "lead" ? undefined : session.id);
  return NextResponse.json({ assignments });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = assignmentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the assignment details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { ownerId, ...rest } = parsed.data;
  // Members can only create for themselves; leads may assign to any member.
  let resolvedOwner = session.id;
  if (session.role === "lead" && ownerId) {
    const owner = await getUserById(ownerId);
    if (!owner) return NextResponse.json({ error: "Unknown owner." }, { status: 400 });
    resolvedOwner = owner.id;
  }

  const assignment = await createAssignment({ ...rest, ownerId: resolvedOwner });
  return NextResponse.json({ assignment }, { status: 201 });
}
