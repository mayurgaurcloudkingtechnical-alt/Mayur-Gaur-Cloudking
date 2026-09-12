import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { EnrolledCoursesView } from "@/components/student/enrolled-courses-view";

export default async function StudentCoursesPage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="My Enrolled Courses"
        description="Access your active curriculum modules, track your lesson milestones, and continue your learning journey."
      />
      <div className="mt-6">
        <EnrolledCoursesView />
      </div>
    </DashboardShell>
  );
}
