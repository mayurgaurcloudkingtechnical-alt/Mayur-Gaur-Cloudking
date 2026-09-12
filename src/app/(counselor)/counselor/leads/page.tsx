import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { CounselorLeadsView } from "@/components/counselor/counselor-leads-view";

export default async function CounselorLeadsPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Lead Pipeline & Inquiries"
        description="Review candidate inquiries, log interaction history, and coordinate admission outreach."
      />
      <CounselorLeadsView basePath="/counselor/leads" />
    </DashboardShell>
  );
}
