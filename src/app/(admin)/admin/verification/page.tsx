import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { VerificationHubView } from "@/components/admin/verification/verification-hub-view";

export default async function AdminVerificationPage() {
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
        title="Statutory Verification & Identity Hub"
        description="UIDAI-compliant Aadhaar management, Income Tax PAN, RBI Bank verification, and GSTIN compliance."
        action={
          <Badge variant="default" className="text-xs uppercase bg-primary text-primary-foreground font-semibold">
            {user.roleCode.replace(/_/g, " ")} • Statutory Compliance
          </Badge>
        }
      />
      <div className="mt-6">
        <VerificationHubView />
      </div>
    </DashboardShell>
  );
}
