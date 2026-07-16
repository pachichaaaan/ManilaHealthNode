import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssignments, listUsers } from "@/lib/repo";
import { AssignmentsView } from "@/components/assignments-view";
import { STATUSES, type Status } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ member?: string; open?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const { member, open, status } = await searchParams;
  const assignments = await listAssignments(isLead ? undefined : session.id);
  const owners = isLead ? (await listUsers()).map((u) => ({ id: u.id, name: u.name })) : [];
  const initialStatus = STATUSES.includes(status as Status) ? (status as Status) : undefined;

  return (
    <AssignmentsView
      assignments={assignments}
      role={session.role}
      currentUserId={session.id}
      owners={owners}
      initialOwnerId={isLead && typeof member === "string" ? member : undefined}
      initialOpenId={typeof open === "string" ? open : undefined}
      initialStatus={initialStatus}
    />
  );
}
