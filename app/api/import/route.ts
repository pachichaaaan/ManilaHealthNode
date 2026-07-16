import { NextResponse } from "next/server";
import { parseWorkbook } from "@/lib/import";
import { clearAssignments, createAssignment, createUser, listAssignments, listUsers } from "@/lib/repo";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MEMBER_ACCENTS = ["sky", "emerald", "rose", "violet", "slate"];

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "lead") {
    return NextResponse.json({ error: "Only a team lead can import the workbook." }, { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  let rows;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    rows = await parseWorkbook(buffer);
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("not found")
        ? err.message
        : "Could not read that workbook. Export it as .xlsx and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No assignments found in the Master Tracker sheet." },
      { status: 400 },
    );
  }

  // Map each row's member name to an account, creating new members as needed.
  const users = await listUsers();
  const byName = new Map(users.map((u) => [u.name.trim().toLowerCase(), u]));
  const memberPasswordHash = await hashPassword("keystone");
  let accountsCreated = 0;
  let accentIdx = 0;

  const ownerIdFor = new Map<string, string>();
  for (const name of new Set(rows.map((r) => r.member))) {
    const key = name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      ownerIdFor.set(name, existing.id);
      continue;
    }
    const created = await createUser({
      name: name.trim(),
      email: `${key.replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "")}@keystone.team`,
      passwordHash: memberPasswordHash,
      role: "member",
      accent: MEMBER_ACCENTS[accentIdx++ % MEMBER_ACCENTS.length],
    });
    ownerIdFor.set(name, created.id);
    accountsCreated += 1;
  }

  const replaced = (await listAssignments()).length;
  await clearAssignments();
  for (const row of rows) {
    const { member, ...rest } = row;
    await createAssignment({ ...rest, ownerId: ownerIdFor.get(member) as string });
  }

  return NextResponse.json({ imported: rows.length, replaced, accountsCreated });
}
