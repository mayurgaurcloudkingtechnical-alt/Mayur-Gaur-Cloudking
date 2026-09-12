import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { CounselorLeadsView } from "@/components/counselor/counselor-leads-view";

export default async function CounselorFollowUpsPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Today's Outreach & Follow-Up Queue"
        description="Active prospects scheduled for phone consultation or outreach today."
      />
      <CounselorLeadsView basePath="/counselor/leads" defaultDueToday={true} />
    </DashboardShell>
  );
}
