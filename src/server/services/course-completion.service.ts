import { db } from "@/server/db/client";
import { CertificateStatus } from "@prisma/client";
import { CertificateService } from "./certificate.service";

export interface CourseCompletionCriteriaConfig {
  requireAllExamsPassed?: boolean;
  minAttendancePercentage?: number; // e.g. 75%
  requireFeeClearance?: boolean;
}

export interface CourseCompletionStatus {
  isComplete: boolean;
  totalRequiredExams: number;
  passedExamsCount: number;
  averageScorePercentage: number;
  attendancePercentage: number;
  isFeeCleared: boolean;
  certificateIssued: boolean;
  certificateNo?: string;
  rejectionReasons?: string[];
}

export class CourseCompletionService {
  /**
   * Evaluates if a student has completed all required exams, met minimum attendance,
   * cleared pending fee balances, and automatically triggers certificate issuance if criteria are met.
   */
  static async evaluateCompletion(
    studentUserId: string,
    courseId: string,
    criteriaConfig: CourseCompletionCriteriaConfig = {
      requireAllExamsPassed: true,
      minAttendancePercentage: 75,
      requireFeeClearance: true,
    }
  ): Promise<CourseCompletionStatus> {
    const rejectionReasons: string[] = [];

    const studentProfile = await db.studentProfile.findFirst({
      where: { userId: studentUserId },
    });

    if (!studentProfile) {
      return {
        isComplete: false,
        totalRequiredExams: 0,
        passedExamsCount: 0,
        averageScorePercentage: 0,
        attendancePercentage: 0,
        isFeeCleared: false,
        certificateIssued: false,
        rejectionReasons: ["Student profile not found."],
      };
    }

    const enrollment = await db.enrollment.findFirst({
      where: {
        studentId: studentProfile.id,
        courseId,
        status: "ACTIVE",
      },
    });

    if (!enrollment) {
      return {
        isComplete: false,
        totalRequiredExams: 0,
        passedExamsCount: 0,
        averageScorePercentage: 0,
        attendancePercentage: 0,
        isFeeCleared: false,
        certificateIssued: false,
        rejectionReasons: ["No active enrollment found for this course."],
      };
    }

    // 1. Examination Requirements
    const requiredExams = await db.exam.findMany({
      where: {
        courseId,
        status: "PUBLISHED",
        type: { in: ["MODULE_QUIZ", "FINAL_EXAM"] },
      },
      select: { id: true, title: true, type: true },
    });

    const passedAttempts = await db.examAttempt.findMany({
      where: {
        studentId: studentProfile.id,
        examId: { in: requiredExams.map((e: { id: string }) => e.id) },
        isPassed: true,
      },
      select: {
        examId: true,
        percentage: true,
      },
    });

    const passedExamIds = new Set(passedAttempts.map((a: { examId: string }) => a.examId));
    const allExamsPassed =
      requiredExams.length > 0
        ? requiredExams.every((e: { id: string }) => passedExamIds.has(e.id))
        : true;

    if (criteriaConfig.requireAllExamsPassed && !allExamsPassed) {
      rejectionReasons.push(
        `Passed ${passedExamIds.size} of ${requiredExams.length} required examinations.`
      );
    }

    const bestScoreByExam = new Map<string, number>();
    for (const a of passedAttempts) {
      const current = bestScoreByExam.get(a.examId) || 0;
      if (a.percentage && a.percentage > current) {
        bestScoreByExam.set(a.examId, a.percentage);
      }
    }

    const totalPassedPercentage = Array.from(bestScoreByExam.values()).reduce(
      (sum: number, p: number) => sum + p,
      0
    );
    const avgPercentage =
      bestScoreByExam.size > 0
        ? Math.round((totalPassedPercentage / bestScoreByExam.size) * 100) / 100
        : 0;

    // 2. Attendance Requirement Check
    const attendanceRecords = await db.attendanceEntry.findMany({
      where: {
        studentId: studentProfile.id,
        record: {
          batch: { courseId },
        },
      },
      select: { status: true },
    });

    let attendancePercentage = 100;
    if (attendanceRecords.length > 0) {
      const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
      attendancePercentage =
        Math.round((presentCount / attendanceRecords.length) * 10000) / 100;
    }

    const minAttendance = criteriaConfig.minAttendancePercentage ?? 75;
    if (attendanceRecords.length > 0 && attendancePercentage < minAttendance) {
      rejectionReasons.push(
        `Attendance ${attendancePercentage}% is below minimum required ${minAttendance}%.`
      );
    }

    // 3. Fee Clearance Requirement Check
    const feeStructures = await db.feeStructure.findMany({
      where: {
        studentId: studentProfile.id,
        courseId,
      },
      include: {
        installments: {
          select: { status: true, amount: true },
        },
      },
    });

    let isFeeCleared = true;
    for (const fs of feeStructures) {
      const hasPending = fs.installments.some(
        (inst) => inst.status !== "PAID" && inst.status !== "CANCELLED"
      );
      if (hasPending) {
        isFeeCleared = false;
        break;
      }
    }

    if (criteriaConfig.requireFeeClearance && !isFeeCleared) {
      rejectionReasons.push("Outstanding fee installments remain pending.");
    }

    const isComplete = rejectionReasons.length === 0;

    // Check existing certificate
    const existingCert = await db.certificate.findFirst({
      where: {
        studentId: studentProfile.id,
        courseId,
        status: CertificateStatus.VALID,
      },
    });

    if (isComplete && !existingCert) {
      const newCert = await CertificateService.issueCertificate({
        studentProfileId: studentProfile.id,
        courseId,
        enrollmentId: enrollment.id,
        metadata: {
          averageScorePercentage: avgPercentage,
          totalExamsPassed: passedExamIds.size,
          attendancePercentage,
          isFeeCleared,
        },
      });

      return {
        isComplete: true,
        totalRequiredExams: requiredExams.length,
        passedExamsCount: passedExamIds.size,
        averageScorePercentage: avgPercentage,
        attendancePercentage,
        isFeeCleared,
        certificateIssued: true,
        certificateNo: newCert.certificateNo,
      };
    }

    return {
      isComplete,
      totalRequiredExams: requiredExams.length,
      passedExamsCount: passedExamIds.size,
      averageScorePercentage: avgPercentage,
      attendancePercentage,
      isFeeCleared,
      certificateIssued: !!existingCert,
      certificateNo: existingCert?.certificateNo,
      rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : undefined,
    };
  }
}