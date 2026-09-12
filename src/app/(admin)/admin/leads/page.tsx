import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { CounselorLeadsView } from "@/components/counselor/counselor-leads-view";

export default async function AdminLeadsPage() {
  const user = await requireRole([
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="CRM Lead Management (Administrative Overview)"
        description="Comprehensive view of all prospect inquiries, counselor assignments, and pipeline progression."
      />
      <CounselorLeadsView basePath="/admin/leads" />
    </DashboardShell>
  );
}
