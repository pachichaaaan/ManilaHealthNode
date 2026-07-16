import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createUser, getUserByEmail, listUsers } from "@/lib/repo";
import { hashPassword } from "@/lib/password";
import { userCreateSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await listUsers();
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = userCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the account details.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { password, ...rest } = parsed.data;
  if (await getUserByEmail(rest.email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({ ...rest, passwordHash });
  return NextResponse.json({ user }, { status: 201 });
}
