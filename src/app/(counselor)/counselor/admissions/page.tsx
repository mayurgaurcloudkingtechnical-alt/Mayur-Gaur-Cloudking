import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { ApplicationsListView } from "@/components/counselor/applications-list-view";

export default async function CounselorAdmissionsPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
    UserRoleCode.ADMIN,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Admission Applications Desk"
        description="Formal candidate enrollment applications submitted for academic verification."
      />
      <ApplicationsListView basePath="/counselor/admissions" />
    </DashboardShell>
  );
}
