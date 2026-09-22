import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { ReceiptPageView } from "@/components/admin/finance/receipt-page-view";

export default async function AdminReceiptPage() {
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
      <div className="print:hidden">
        <PageHeader
          title="Official Fee Receipt Generator & Print Portal"
          description="A4 Institutional dual-copy fee receipt (Student Copy & Center Copy) with in-place editable fields."
          action={
            <Badge variant="outline" className="text-xs uppercase font-semibold text-emerald-700 border-emerald-300 bg-emerald-50">
              Print-Ready A4 Document
            </Badge>
          }
        />
      </div>
      <div className="mt-4">
        <ReceiptPageView />
      </div>
    </DashboardShell>
  );
}
