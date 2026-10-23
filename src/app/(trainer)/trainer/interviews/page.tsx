import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { MockInterviewsView } from "@/components/interviews/mock-interviews-view";

export default async function TrainerInterviewsPage() {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <MockInterviewsView userRole="TRAINER" />
    </DashboardShell>
  );
}
