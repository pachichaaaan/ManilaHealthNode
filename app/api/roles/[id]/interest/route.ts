import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { toggleInterest } from "@/lib/repo";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  try {
    const result = await toggleInterest(session.id, id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }
}
