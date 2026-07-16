import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listAssignments, listUsers } from "@/lib/repo";
import { TeamAdmin, type MemberStatRow } from "@/components/team-admin";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "lead") redirect("/dashboard");

  const [users, assignments] = await Promise.all([listUsers(), listAssignments()]);
  const stats: MemberStatRow[] = users.map((u) => {
    const own = assignments.filter((x) => x.ownerId === u.id);
    return {
      userId: u.id,
      total: own.length,
      active: own.filter((x) => x.status === "active").length,
      plusOne: own.filter((x) => x.classification === "plus_one").length,
      hours: own.reduce((s, x) => s + x.actualHours, 0),
    };
  });

  return <TeamAdmin users={users} stats={stats} currentUserId={session.id} />;
}
