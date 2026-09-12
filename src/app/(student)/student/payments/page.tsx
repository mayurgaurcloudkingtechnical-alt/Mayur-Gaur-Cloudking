import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { StudentPaymentsView } from "@/components/student/student-payments-view";

export default async function StudentPaymentsPage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Payment History & Receipts"
        description="View your past transactions, payment status, and download or print verified receipts."
        action={
          <Badge variant="default" className="text-xs bg-emerald-600 text-white font-medium">
            Financial Ledger
          </Badge>
        }
      />
      <div className="mt-6">
        <StudentPaymentsView />
      </div>
    </DashboardShell>
  );
}
