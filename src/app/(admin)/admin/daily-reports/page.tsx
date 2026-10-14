import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { DailyReportsView } from "@/components/admin/daily-reports/daily-reports-view";

export default async function DailyReportsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.HR,
    UserRoleCode.MANAGER,
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.TRAINER,
    UserRoleCode.PLACEMENT_OFFICER,
    UserRoleCode.ACCOUNTANT,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Institutional Daily Work Reporting Panel"
        description="Submit verified daily work reports with prefilled CRM activity metrics, track operational progress, and review departmental submissions."
      />
      <div className="mt-6">
        <DailyReportsView user={user} />
      </div>
    </DashboardShell>
  );
}
