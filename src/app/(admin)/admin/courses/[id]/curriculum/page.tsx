import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { CurriculumCmsView } from "@/components/admin/curriculum/curriculum-cms-view";

interface CurriculumPageProps {
  params: {
    id: string;
  };
}

export default async function AdminCurriculumPage({ params }: CurriculumPageProps) {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <CurriculumCmsView courseId={params.id} baseBackHref="/admin/courses" />
    </DashboardShell>
  );
}
