import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { AdminEventsManagementView } from "@/components/admin/events/admin-events-management-view";

export const metadata: Metadata = {
  title: "Events & Short-Term Programs Management | SoftLab Global ERP",
  description: "Unified CMS, registrations, payment tracking and attendance oversight for events, workshops and internships.",
};

export default async function AdminEventsPage() {
  const user = await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.COUNSELOR,
  ]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Events & Short-Term Programs Management"
        description="Unified CMS for short-term vocational courses, technical workshops, and winter/summer internships with registrations and revenue analytics."
      />
      <AdminEventsManagementView />
    </DashboardShell>
  );
}
