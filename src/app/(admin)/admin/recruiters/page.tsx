import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { RecruiterCrmView } from "@/components/admin/recruiters/recruiter-crm-view";

export const metadata: Metadata = {
  title: "Corporate Recruiters & Hiring CRM | SoftLab Global",
  description:
    "Corporate partnership management, domain-wise tech openings, bulk campus hiring drives, and candidate matchmaker.",
};

export default async function AdminRecruitersPage() {
  await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.HR,
    UserRoleCode.PLACEMENT_OFFICER,
    UserRoleCode.RECRUITER,
  ]);

  return <RecruiterCrmView />;
}
