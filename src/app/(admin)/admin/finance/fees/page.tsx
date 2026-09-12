import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FeeStructuresTable } from "@/components/admin/finance/fee-structures-table";

export default async function AdminFeesLedgerPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.ACCOUNTANT,
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
        title="Tuition Fee Structures Ledger"
        description="Comprehensive directory of student enrollment fee plans, net payable amounts, and payment statuses."
        action={
          <Badge variant="outline" className="text-xs uppercase font-semibold">
            Full Ledger Mode
          </Badge>
        }
      />
      <div className="mt-6">
        <FeeStructuresTable />
      </div>
    </DashboardShell>
  );
}
