import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { StudentLiveClassesView } from "@/components/student/student-live-classes-view";

export default async function StudentLiveClassesPage() {
  const user = await requireRole([UserRoleCode.STUDENT]);

  return (
    <DashboardShell user={user}>
      <StudentLiveClassesView />
    </DashboardShell>
  );
}
