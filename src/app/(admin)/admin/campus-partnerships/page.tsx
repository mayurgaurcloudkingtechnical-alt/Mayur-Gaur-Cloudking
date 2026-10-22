import { Metadata } from "next";
import { requireRole } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { CampusPartnershipsView } from "@/components/admin/campus-partnerships/campus-partnerships-view";

export const metadata: Metadata = {
  title: "Campus & University Partnerships | SoftLab Global Placement CRM",
  description:
    "Centralized institutional onboarding, college & university partnerships, bulk student management, campus placement drives, and mega job fairs.",
};

export default async function CampusPartnershipsPage() {
  await requireRole([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.HR,
    UserRoleCode.PLACEMENT_OFFICER,
  ]);

  return <CampusPartnershipsView />;
}
