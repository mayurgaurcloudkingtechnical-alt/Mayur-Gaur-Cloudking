import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { LeadDetailView } from "@/components/counselor/lead-detail-view";

interface PageProps {
  params: { id: string };
}

export default async function CounselorLeadDetailPage({ params }: PageProps) {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  const canAssign =
    user.roleCode === UserRoleCode.SUPER_ADMIN ||
    user.roleCode === UserRoleCode.ADMIN ||
    user.roleCode === UserRoleCode.MANAGER;

  return (
    <DashboardShell user={user}>
      <LeadDetailView leadId={params.id} canAssign={canAssign} />
    </DashboardShell>
  );
}
