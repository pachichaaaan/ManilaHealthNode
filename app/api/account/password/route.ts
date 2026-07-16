import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getUserByEmail, updateUser } from "@/lib/repo";
import { hashPassword, verifyPassword } from "@/lib/password";
import { passwordChangeSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = passwordChangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  // Verify the current password against the stored hash.
  const full = await getUserByEmail(session.email);
  if (!full || !(await verifyPassword(parsed.data.currentPassword, full.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  await updateUser(session.id, { passwordHash: await hashPassword(parsed.data.newPassword) });
  return NextResponse.json({ ok: true });
}
