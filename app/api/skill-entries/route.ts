import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listSkillEntries, upsertSkillEntry } from "@/lib/repo";
import { skillEntrySchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await listSkillEntries();
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = skillEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const entry = await upsertSkillEntry(parsed.data);
  return NextResponse.json(entry);
}
