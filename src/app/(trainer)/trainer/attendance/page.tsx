import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { TrainerAttendanceView } from "@/components/trainer/trainer-attendance-view";

export default async function TrainerAttendancePage() {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <TrainerAttendanceView />
    </DashboardShell>
  );
}
