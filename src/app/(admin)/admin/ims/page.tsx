import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { ImsAdminView } from "@/components/admin/ims/ims-admin-view";

export const metadata = {
  title: "IT Infrastructure & Managed Services (IMS) Admin — SOFTLAB GLOBAL",
};

export default async function AdminImsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <ImsAdminView />
    </DashboardShell>
  );
}
