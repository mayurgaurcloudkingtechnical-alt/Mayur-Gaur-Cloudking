import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { AcademicContentCmsView } from "@/components/admin/academic/academic-content-cms-view";

export const metadata: Metadata = {
  title: "Academic Content CMS & Curriculum Master | SoftLab Global",
  description: "Centralized course curriculum editor, version history, safe bulk import, and complimentary English benefit management.",
};

export default async function AdminAcademicContentPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Academic Content CMS"
        description="Manage all courses, modules, topics, practicals, version history, safe bulk imports, and complimentary English enrollments."
      />
      <AcademicContentCmsView />
    </DashboardShell>
  );
}
