import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { MockInterviewsView } from "@/components/interviews/mock-interviews-view";
import { RecruiterInterviewsView } from "@/components/interviews/recruiter-interviews-view";

export default async function StudentInterviewsPage() {
  const user = await requireRole([UserRoleCode.STUDENT]);

  return (
    <DashboardShell user={user}>
      <div className="space-y-8">
        <MockInterviewsView userRole="STUDENT" />
        <RecruiterInterviewsView userRole="STUDENT" />
      </div>
    </DashboardShell>
  );
}
