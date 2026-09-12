import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { LeadDetailView } from "@/components/counselor/lead-detail-view";

interface PageProps {
  params: { id: string };
}

export default async function AdminLeadDetailPage({ params }: PageProps) {
  const user = await requireRole([
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <LeadDetailView leadId={params.id} canAssign={true} />
    </DashboardShell>
  );
}
