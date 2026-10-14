import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { IntelligentPlannerView } from "@/components/admin/work-planner/intelligent-planner-view";

export default async function WorkPlannerPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.HR,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Director-Led Intelligent Daily Work Planner"
        description="Analyze real-time CRM enquiries, overdue follow-ups, and recruiter vacancies to generate, approve, and distribute daily operational tasks."
      />
      <div className="mt-6">
        <IntelligentPlannerView />
      </div>
    </DashboardShell>
  );
}
