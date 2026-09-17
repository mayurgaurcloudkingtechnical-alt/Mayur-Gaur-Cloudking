import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { StudentsView } from "@/components/admin/students/students-view";

export default async function AdminStudentsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student Registry & Academic Management"
        description="Search, enroll, and monitor institutional learners, batch allocations, academic records, and fee ledgers."
      />
      <div className="mt-6">
        <StudentsView />
      </div>
    </DashboardShell>
  );
}
