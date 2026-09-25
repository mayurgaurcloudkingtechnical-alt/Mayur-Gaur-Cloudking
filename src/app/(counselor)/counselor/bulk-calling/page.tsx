import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { BulkCallingDashboard } from "@/components/bulk-calling/bulk-calling-dashboard";

export default async function CounselorBulkCallingPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Outbound AI Calling & Bulk Data Desk"
        description="Upload prospective student spreadsheets, run sequential AI outreach, and review qualified candidate handoffs."
      />
      <BulkCallingDashboard userRole={user.roleCode} userId={user.id} />
    </DashboardShell>
  );
}
