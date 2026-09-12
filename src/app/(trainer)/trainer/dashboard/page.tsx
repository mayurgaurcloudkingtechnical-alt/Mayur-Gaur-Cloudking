import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { TrainerDashboardView } from "@/components/trainer/trainer-dashboard-view";

export default async function TrainerDashboardPage() {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title={`Faculty Portal: ${user.firstName} ${user.lastName}`}
        description="Curriculum delivery, live classes schedule, batch attendance, and teaching workspace."
        action={
          <Badge variant="default" className="text-xs">
            Faculty Access • Active
          </Badge>
        }
      />
      <TrainerDashboardView />
    </DashboardShell>
  );
}
