import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssignments, listUsers } from "@/lib/repo";
import { ArchivedView } from "@/components/archived-view";

export const dynamic = "force-dynamic";

export default async function ArchivedPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const { member } = await searchParams;
  const assignments = await listAssignments(isLead ? undefined : session.id, { archived: true });
  const owners = isLead ? (await listUsers()).map((u) => ({ id: u.id, name: u.name })) : [];

  return (
    <ArchivedView
      assignments={assignments}
      role={session.role}
      owners={owners}
      initialMember={isLead && typeof member === "string" ? member : undefined}
    />
  );
}
