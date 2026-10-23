import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { ManagementControlCenterView } from "@/components/admin/operations/management-control-center-view";

export default async function ManagementOperationsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.PLACEMENT_OFFICER,
    UserRoleCode.HR,
  ]);

  return (
    <DashboardShell user={user}>
      <ManagementControlCenterView user={user} />
    </DashboardShell>
  );
}
