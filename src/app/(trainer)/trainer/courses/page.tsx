import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { CourseTopicsView } from "@/components/trainer/course-topics-view";

export default async function TrainerCoursesPage() {
  const user = await requireRole([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <CourseTopicsView />
    </DashboardShell>
  );
}
