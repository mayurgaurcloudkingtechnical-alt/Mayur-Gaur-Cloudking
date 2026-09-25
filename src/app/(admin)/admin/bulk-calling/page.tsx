import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { BulkCallingDashboard } from "@/components/bulk-calling/bulk-calling-dashboard";

export default async function AdminBulkCallingPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Bulk Data Ingestion & AI Calling Automation"
        description="Role-based Excel lead import, automated one-by-one conversational outreach, and CRM pipeline synchronization."
      />
      <BulkCallingDashboard userRole={user.roleCode} userId={user.id} />
    </DashboardShell>
  );
}
