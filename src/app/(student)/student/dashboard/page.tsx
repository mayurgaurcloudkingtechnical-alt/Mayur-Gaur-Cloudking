import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { StudentDashboardView } from "@/components/student/student-dashboard-view";

export default async function StudentDashboardPage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title={`Welcome, ${user.firstName}!`}
        description="Your unified student learning workspace, active courses, and cohort schedule."
        action={
          <Badge variant="default" className="text-xs bg-emerald-600 text-white font-medium">
            Student Portal • Active
          </Badge>
        }
      />
      <div className="mt-6">
        <StudentDashboardView />
      </div>
    </DashboardShell>
  );
}
