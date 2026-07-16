import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssignments, listUsers } from "@/lib/repo";
import { AssignmentsView } from "@/components/assignments-view";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isLead = session.role === "lead";
  const assignments = await listAssignments(isLead ? undefined : session.id);
  const owners = isLead ? (await listUsers()).map((u) => ({ id: u.id, name: u.name })) : [];

  return (
    <AssignmentsView assignments={assignments} role={session.role} currentUserId={session.id} owners={owners} />
  );
}
