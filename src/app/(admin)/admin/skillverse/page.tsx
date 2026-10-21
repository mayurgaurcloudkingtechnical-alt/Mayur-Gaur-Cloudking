import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { SkillverseAdminPortal } from "@/components/skillverse/skillverse-admin-portal";

export const metadata = {
  title: "SLG SKILLVERSE Admin & Admissions CRM — SOFTLAB GLOBAL",
};

export default async function AdminSkillversePage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.MANAGER,
    UserRoleCode.COUNSELOR,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.TRAINER,
  ]);

  return (
    <DashboardShell user={user}>
      <SkillverseAdminPortal />
    </DashboardShell>
  );
}
