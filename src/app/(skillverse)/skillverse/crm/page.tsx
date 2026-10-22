import React from "react";
import type { Metadata } from "next";
import {
  SkillverseAdminPortal,
  SkillverseAdminPortalErrorBoundary,
} from "@/components/skillverse/skillverse-admin-portal";

export const metadata: Metadata = {
  title: "Skillverse Admissions & Academic CRM — SoftLab Global",
  description:
    "SLG SKILLVERSE Admissions CRM, Lead Pipeline, Demos, Follow-ups, and Instant Student Credential Generation.",
};

export default function SkillverseCrmPage() {
  return (
    <SkillverseAdminPortalErrorBoundary>
      <SkillverseAdminPortal initialTab="admissions" portalMode="crm" />
    </SkillverseAdminPortalErrorBoundary>
  );
}
