import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { AccountsFinanceHub } from "@/components/admin/finance/accounts-finance-hub";

export default async function AdminFinancePage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.ACCOUNTANT,
    UserRoleCode.COUNSELOR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Accounts & Finance ERP"
        description="Institutional GST billing, purchase bills, expenses, P&L, double-entry ledger, and automated notification routing."
        action={
          <Badge variant="default" className="text-xs uppercase bg-emerald-600 text-white font-medium">
            {user?.roleCode ? String(user.roleCode).replace(/_/g, " ") : "ADMIN"} • Accounts Authority
          </Badge>
        }
      />
      <div className="mt-6">
        <AccountsFinanceHub roleCode={user?.roleCode || "ADMIN"} />
      </div>
    </DashboardShell>
  );
}
