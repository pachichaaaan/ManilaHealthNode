import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { deleteUser, getUserById, updateUser, type UserPatch } from "@/lib/repo";
import { hashPassword } from "@/lib/password";
import { userUpdateSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the account details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // A lead can't demote or deactivate their own account (avoid locking themselves out).
  if (id === session.id && (parsed.data.role === "member" || parsed.data.active === false)) {
    return NextResponse.json({ error: "You can't change your own role or status." }, { status: 400 });
  }

  const { password, ...fields } = parsed.data;
  const patch: UserPatch = { ...fields };
  if (password) patch.passwordHash = await hashPassword(password);

  const user = await updateUser(id, patch);
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  if (id === session.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
