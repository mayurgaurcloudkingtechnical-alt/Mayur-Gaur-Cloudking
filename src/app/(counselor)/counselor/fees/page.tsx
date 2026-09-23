import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { FinanceOverviewView } from "@/components/admin/finance/finance-overview-view";

export default async function CounselorFeesPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.ADMIN,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student Fee Collection & EMI Desk"
        description="Receive student EMI installments, collect tuition fees, manage fee structures, and generate official dual-copy receipts."
        action={
          <Badge variant="default" className="text-xs uppercase bg-emerald-600 text-white font-medium">
            Counselor Fee Desk
          </Badge>
        }
      />
      <div className="mt-6">
        <FinanceOverviewView />
      </div>
    </DashboardShell>
  );
}
