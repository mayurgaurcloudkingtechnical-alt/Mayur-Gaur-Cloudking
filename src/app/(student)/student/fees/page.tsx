import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { StudentFeesView } from "@/components/student/student-fees-view";

export default async function StudentFeesPage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Tuition Fees & Verified Receipts"
        description="Transparent breakdown of course fee structures, installment due dates, and verified payment transactions."
        action={
          <Badge variant="default" className="text-xs bg-emerald-600 text-white font-medium">
            Student Financial Portal
          </Badge>
        }
      />
      <div className="mt-6">
        <StudentFeesView />
      </div>
    </DashboardShell>
  );
}
