import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { listSkillEntries, upsertSkillEntry, removeSkillFromEntry } from "@/lib/repo";
import { skillEntrySchema } from "@/lib/validation";
import { sendSkillChangeNotification } from "@/lib/email";

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

  const { entry, previous, action } = await upsertSkillEntry(parsed.data);

  // Fire email notification — non-blocking, never fails the request
  sendSkillChangeNotification({
    submittedBy: session.name,
    memberName: entry.name,
    action,
    submittedAt: entry.updatedAt,
    segment: entry.segment,
    level: entry.level,
    functionalSkills: entry.functionalSkills,
    businessSkills: entry.businessSkills,
    internalAssignment: entry.internalAssignment,
    previous: previous ? {
      segment: previous.segment,
      level: previous.level,
      functionalSkills: previous.functionalSkills,
      businessSkills: previous.businessSkills,
      internalAssignment: previous.internalAssignment,
    } : null,
  });

  return NextResponse.json(entry);
}

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const { name, skillType, skill } = body ?? {};
  if (
    typeof name !== "string" || !name.trim() ||
    (skillType !== "functional" && skillType !== "business") ||
    typeof skill !== "string" || !skill.trim()
  ) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await removeSkillFromEntry(name.trim(), skillType, skill.trim());
  return NextResponse.json({ ok: true });
}
