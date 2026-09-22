import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { DashboardShell } from "@/components/common/dashboard-shell";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { StudentIdCardPortalView } from "@/components/student/student-id-card-portal-view";

export const metadata = {
  title: "Student ID Card | SOFTLAB GLOBAL",
  description: "Official student identity card with verification QR code and print support.",
};

export default async function StudentIdCardPage() {
  const user = await requireRole([UserRoleCode.STUDENT, UserRoleCode.SUPER_ADMIN]);

  return (
    <DashboardShell user={user}>
      <PageHeader
        title="Student Identity Card"
        description="Your authentic SOFTLAB GLOBAL student credential. Available for digital verification and physical card printing."
        action={
          <Badge variant="default" className="text-xs bg-sky-600 text-white font-medium">
            CR-80 Standard ID
          </Badge>
        }
      />
      <div className="mt-6">
        <StudentIdCardPortalView />
      </div>
    </DashboardShell>
  );
}
