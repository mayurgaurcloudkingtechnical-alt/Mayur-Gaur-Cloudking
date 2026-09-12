import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { FinanceOverviewView } from "@/components/admin/finance/finance-overview-view";

export default async function AdminFinancePage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.ACCOUNTANT,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Finance & Accounts ERP"
        description="Institutional tuition billing, installment management, and offline fee collection ledger."
        action={
          <Badge variant="default" className="text-xs uppercase bg-emerald-600 text-white font-medium">
            {user.roleCode.replace(/_/g, " ")} • Accounts Authority
          </Badge>
        }
      />
      <div className="mt-6">
        <FinanceOverviewView />
      </div>
    </DashboardShell>
  );
}
