import React from "react";
import type { Metadata } from "next";
import {
  SkillverseAdminPortal,
  SkillverseAdminPortalErrorBoundary,
} from "@/components/skillverse/skillverse-admin-portal";

export const metadata: Metadata = {
  title: "Skillverse Academic LMS & Live Classroom Hub — SoftLab Global",
  description:
    "SLG SKILLVERSE In-House Virtual Classroom, YouTube Broadcast Automation, Batches, Attendance and Gradebooks.",
};

export default function SkillverseLmsPage() {
  return (
    <SkillverseAdminPortalErrorBoundary>
      <SkillverseAdminPortal initialTab="live_studio" portalMode="lms" />
    </SkillverseAdminPortalErrorBoundary>
  );
}
