import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ApplicationsListView } from "@/components/counselor/applications-list-view";

export default async function AdminAdmissionsPage() {
  const user = await requireRole([
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Institutional Admissions Oversight"
        description="Formal application review, qualification verification, and enrollment approval."
      />
      <ApplicationsListView basePath="/admin/admissions" />
    </DashboardShell>
  );
}
