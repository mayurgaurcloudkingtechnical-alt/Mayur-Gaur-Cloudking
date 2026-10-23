import crypto from "crypto";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

export interface ScheduleMockInterviewParams {
  title: string;
  interviewType?: "HR" | "TECHNICAL" | "COMMUNICATION" | "APTITUDE" | "ROLE_SPECIFIC";
  scheduledAt: Date;
  durationMin?: number;
  studentId: string;
  interviewerId: string;
  batchId?: string;
  courseId?: string;
  instructions?: string;
  questionBank?: any;
}

export interface SubmitMockFeedbackParams {
  interviewId: string;
  scoreCommunication: number; // 1-10
  scoreTechnical: number; // 1-10
  scoreConfidence: number; // 1-10
  scoreProblemSolving: number; // 1-10
  strengths: string;
  improvements: string;
  recommendations: string;
  status?: "COMPLETED" | "RESCHEDULED" | "ABSENT" | "CANCELLED";
}

export class MockInterviewService {
  /**
   * Schedules a structured mock placement interview for a student
   */
  public static async scheduleInterview(params: ScheduleMockInterviewParams) {
    const student = await db.studentProfile.findUnique({
      where: { id: params.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }

    const interviewer = await db.user.findUnique({
      where: { id: params.interviewerId },
    });

    if (!interviewer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Interviewer account not found." });
    }

    const roomCode = `mock-iv-${params.studentId.slice(-6)}-${crypto.randomBytes(3).toString("hex")}`;

    const interview = await db.mockInterview.create({
      data: {
        title: params.title.trim(),
        interviewType: params.interviewType || "TECHNICAL",
        scheduledAt: params.scheduledAt,
        durationMin: params.durationMin || 45,
        status: "SCHEDULED",
        roomCode,
        batchId: params.batchId,
        courseId: params.courseId,
        studentId: params.studentId,
        interviewerId: params.interviewerId,
        instructions: params.instructions,
        questionBank: params.questionBank,
      },
      include: {
        student: { include: { user: true } },
        interviewer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });

    // Notify student about scheduled mock interview
    try {
      await db.notification.create({
        data: {
          userId: student.userId,
          type: "PLACEMENT",
          title: `🎯 Mock Interview Scheduled: ${params.title}`,
          message: `Interview Type: ${params.interviewType || "Technical"} | Date: ${new Date(params.scheduledAt).toLocaleString("en-IN")}`,
          link: "/student/interviews",
          metadata: { interviewId: interview.id, roomCode },
        },
      });
    } catch {}

    return interview;
  }

  /**
   * Submits structured competency feedback for a mock interview
   */
  public static async submitFeedback(params: SubmitMockFeedbackParams) {
    const existing = await db.mockInterview.findUnique({
      where: { id: params.interviewId },
      include: { student: true },
    });

    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Mock interview not found." });
    }

    const avgScore =
      ((params.scoreCommunication +
        params.scoreTechnical +
        params.scoreConfidence +
        params.scoreProblemSolving) /
        40) *
      100;
    const overallScore = Math.round(avgScore);

    const updated = await db.mockInterview.update({
      where: { id: params.interviewId },
      data: {
        status: params.status || "COMPLETED",
        scoreCommunication: params.scoreCommunication,
        scoreTechnical: params.scoreTechnical,
        scoreConfidence: params.scoreConfidence,
        scoreProblemSolving: params.scoreProblemSolving,
        overallScore,
        strengths: params.strengths.trim(),
        improvements: params.improvements.trim(),
        recommendations: params.recommendations.trim(),
        feedbackSubmittedAt: new Date(),
      },
    });

    // Mirror to StudentPlacementProfile if present
    try {
      const placementProfile = await db.studentPlacementProfile.findUnique({
        where: { studentId: existing.studentId },
      });

      if (placementProfile) {
        const currentBio = placementProfile.bio || "";
        const feedbackNote = `[Mock Interview (${existing.interviewType}) Score: ${overallScore}/100]: ${params.recommendations.slice(0, 150)}`;
        await db.studentPlacementProfile.update({
          where: { id: placementProfile.id },
          data: {
            bio: currentBio ? `${currentBio}\n${feedbackNote}` : feedbackNote,
            placementStatus: overallScore >= 70 ? "INTERVIEWING" : placementProfile.placementStatus,
          },
        });
      }
    } catch {}

    return updated;
  }
}
