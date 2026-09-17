import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { SettingsView } from "@/components/admin/settings/settings-view";

export default async function AdminSettingsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Settings & Authority Control Center"
        description="Configure granular RBAC permissions, campus branding, Razorpay payment gateway credentials, and external integrations."
      />
      <div className="mt-6">
        <SettingsView />
      </div>
    </DashboardShell>
  );
}
