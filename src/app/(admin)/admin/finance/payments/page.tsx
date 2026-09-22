import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PaymentsTable } from "@/components/admin/finance/payments-table";

export default async function AdminPaymentsPage() {
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
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-500">
          <Link href="/admin/finance">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Finance Overview</span>
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Fee Payment Transaction Ledger"
        description="Audit-compliant receipt ledger of verified cash, UPI, bank transfer, card, and cheque payments."
        action={
          <Badge variant="outline" className="text-xs uppercase font-semibold">
            Transaction History
          </Badge>
        }
      />
      <div className="mt-6">
        <PaymentsTable />
      </div>
    </DashboardShell>
  );
}
