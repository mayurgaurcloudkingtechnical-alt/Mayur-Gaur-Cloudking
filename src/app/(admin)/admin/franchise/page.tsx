import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { AdminFranchiseView } from "@/components/admin/franchise/admin-franchise-view";

export const dynamic = "force-dynamic";

export default async function AdminFranchisePage() {
  const user = await requireRole([
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Franchise Opportunity & Expansion Desk"
        description="Monitor nationwide franchise inquiries, territory feasibility discussions, legal agreements, and center launch pipeline."
      />
      <AdminFranchiseView />
    </DashboardShell>
  );
}
