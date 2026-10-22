"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SkillverseLiveClassroom } from "@/components/skillverse/skillverse-live-classroom";

function LiveClassroomContent() {
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get("sessionCode") || "SV-LIVE-FOUNDATION-101";
  const userRole = (searchParams.get("role")?.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT") as
    | "TEACHER"
    | "STUDENT";
  const userName = searchParams.get("name") || (userRole === "TEACHER" ? "Faculty Educator" : "Enrolled Student");
  const userEnrollmentCode = searchParams.get("enrollmentCode") || "SV-STU-2026-101";

  return (
    <SkillverseLiveClassroom
      sessionCode={sessionCode}
      userRole={userRole}
      userName={userName}
      userEnrollmentCode={userEnrollmentCode}
    />
  );
}

export default function SkillverseLiveClassroomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white text-sm font-sans">
          Initializing SLG SKILLVERSE Live Interactive Classroom...
        </div>
      }
    >
      <LiveClassroomContent />
    </Suspense>
  );
}
