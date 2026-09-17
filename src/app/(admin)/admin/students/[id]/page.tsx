import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { StudentDetailView } from "@/components/admin/students/student-detail-view";

interface AdminStudentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.COUNSELOR,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <StudentDetailView studentId={params.id} />
    </DashboardShell>
  );
}
