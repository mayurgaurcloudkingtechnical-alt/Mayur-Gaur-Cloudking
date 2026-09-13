import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { MarketingIntegrationsView } from "@/components/counselor/marketing-integrations-view";

export default async function CounselorMarketingPage() {
  const user = await requireRole([
    UserRoleCode.COUNSELOR,
    UserRoleCode.TELECALLER,
    UserRoleCode.MANAGER,
    UserRoleCode.ADMIN,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Marketing & Ads Ingestion Hub"
        description="Connect Justdial, Meta Facebook/Instagram Ads, Google Ads, WhatsApp, and Webhooks for live lead capture."
      />
      <MarketingIntegrationsView />
    </DashboardShell>
  );
}
