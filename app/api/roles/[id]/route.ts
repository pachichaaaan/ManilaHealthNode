import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteRole } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await deleteRole(id);
  return NextResponse.json({ ok: true });
}
