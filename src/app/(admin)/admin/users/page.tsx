import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { UsersView } from "@/components/admin/users/users-view";

export default async function AdminUsersPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.HR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="User & Staff Management"
        description="Manage institutional staff, instructors, counselors, and administrative credentials across departments."
      />
      <div className="mt-6">
        <UsersView />
      </div>
    </DashboardShell>
  );
}
