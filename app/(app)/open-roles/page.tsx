import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listInterestedRoleIds, listRoles } from "@/lib/repo";
import { OpenRolesView } from "@/components/open-roles-view";

export const dynamic = "force-dynamic";

export default async function OpenRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { role } = await searchParams;
  const [roles, interestedIds] = await Promise.all([
    listRoles(),
    listInterestedRoleIds(session.id),
  ]);

  return (
    <OpenRolesView
      roles={roles}
      interestedIds={interestedIds}
      canManage={session.role === "lead"}
      initialRoleId={typeof role === "string" ? role : undefined}
    />
  );
}
