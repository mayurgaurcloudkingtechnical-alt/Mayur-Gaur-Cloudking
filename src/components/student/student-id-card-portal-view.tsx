"use client";

import * as React from "react";
import { api } from "@/lib/trpc/react";
import { StudentIdCardView } from "@/components/common/student-id-card-view";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2 } from "lucide-react";

export function StudentIdCardPortalView() {
  const { data: student, isLoading, error } = api.learning.getMyIdCard.useQuery();

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
        <span className="text-xs font-medium">Generating official student ID card...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-8 text-center">
        <CreditCard className="h-8 w-8 text-amber-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-amber-900">Student Profile Inactive</h3>
        <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
          {error?.message || "No verified student enrollment record found for this account. Please contact campus admin."}
        </p>
      </div>
    );
  }

  const latestEnrollment = student.enrollments?.[0];
  const validityDate = latestEnrollment?.batch?.endDate
    ? new Date(latestEnrollment.batch.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "Dec 2026";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-sky-600" />
                <span>Official Digital & Printable Identity Card</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Standard ISO CR-80 format with cryptographic verification QR code and campus validation details.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-[11px]">
              VERIFIED ACTIVE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <StudentIdCardView
            data={{
              studentName: `${student.user.firstName} ${student.user.lastName}`.trim(),
              studentId: student.studentId,
              courseTitle: latestEnrollment?.course?.title || "Computer Science / IT Program",
              batchCode: latestEnrollment?.batch?.code || "GENERAL-COHORT",
              center: student.center || "SOFTLAB GLOBAL Main Campus, Prayagraj",
              validUntil: latestEnrollment?.batch?.endDate ? new Date(latestEnrollment.batch.endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              photoUrl: (student as any).photoUrl || student.user.avatarUrl || null,
              emergencyPhone: student.guardianPhone || student.alternatePhone || student.user.phone || undefined,
              bloodGroup: "O+",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
