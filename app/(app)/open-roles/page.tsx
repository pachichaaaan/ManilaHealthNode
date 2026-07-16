import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listInterestedRoleIds, listRoles } from "@/lib/repo";
import { OpenRolesView } from "@/components/open-roles-view";

export const dynamic = "force-dynamic";

export default async function OpenRolesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [roles, interestedIds] = await Promise.all([
    listRoles(),
    listInterestedRoleIds(session.id),
  ]);

  return <OpenRolesView roles={roles} interestedIds={interestedIds} />;
}
