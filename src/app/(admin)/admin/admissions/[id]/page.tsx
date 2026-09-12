import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { ApplicationDetailView } from "@/components/counselor/application-detail-view";

interface PageProps {
  params: { id: string };
}

export default async function AdminAdmissionDetailPage({ params }: PageProps) {
  const user = await requireRole([
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.SUPER_ADMIN,
  ]);

  return (
    <DashboardShell user={user}>
      <ApplicationDetailView
        applicationId={params.id}
        backHref="/admin/admissions"
      />
    </DashboardShell>
  );
}
