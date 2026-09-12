import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { TrainerScheduleView } from "@/components/trainer/trainer-schedule-view";

export default async function TrainerClassesPage() {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <TrainerScheduleView />
    </DashboardShell>
  );
}
