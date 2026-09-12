import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { db } from "@/server/db/client";
import { CounselorDashboardView } from "@/components/counselor/counselor-dashboard-view";

export default async function CounselorDashboardPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  const roleRecord = await db.role.findUnique({
    where: { code: user.roleCode },
    select: { maxDiscountPercent: true },
  });

  const maxDiscount = roleRecord?.maxDiscountPercent ?? 0;

  return (
    <DashboardShell user={user}>
      <PageHeader
        title={`Counselor Workspace: ${user.firstName} ${user.lastName}`}
        description="Lead intake, student conversions, and admission enrollment desk."
        action={
          <Badge variant="default" className="text-xs">
            {user.roleCode} • Authorized
          </Badge>
        }
      />

      <CounselorDashboardView maxDiscount={maxDiscount} roleCode={user.roleCode} />
    </DashboardShell>
  );
}
