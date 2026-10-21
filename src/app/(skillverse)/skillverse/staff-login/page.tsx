import React from "react";
import {
  SkillverseAdminPortal,
  SkillverseAdminPortalErrorBoundary,
} from "@/components/skillverse/skillverse-admin-portal";

export default function SkillverseStaffPortalPage() {
  return (
    <SkillverseAdminPortalErrorBoundary>
      <SkillverseAdminPortal />
    </SkillverseAdminPortalErrorBoundary>
  );
}
