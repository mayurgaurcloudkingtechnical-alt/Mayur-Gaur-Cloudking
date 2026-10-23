import crypto from "crypto";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

export interface ScheduleRecruiterInterviewParams {
  title: string;
  jobDriveId?: string;
  recruiterId: string;
  studentId: string;
  scheduledAt: Date;
  durationMin?: number;
  stage?: string;
  meetingInstructions?: string;
  institutionId?: string;
}

export interface SubmitRecruiterDecisionParams {
  interviewId: string;
  selectionDecision: "SELECTED" | "REJECTED" | "NEXT_ROUND" | "ON_HOLD";
  feedback?: string;
  privateNotes?: string;
}

export class RecruiterInterviewService {
  /**
   * Schedules a confidential recruiter interview round
   */
  public static async scheduleInterview(params: ScheduleRecruiterInterviewParams) {
    const student = await db.studentProfile.findUnique({
      where: { id: params.studentId },
      include: { user: true },
    });

    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student candidate not found." });
    }

    const recruiter = await db.user.findUnique({
      where: { id: params.recruiterId },
    });

    if (!recruiter) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Recruiter user not found." });
    }

    const roomCode = `rec-iv-${params.studentId.slice(-6)}-${crypto.randomBytes(3).toString("hex")}`;

    const interview = await db.recruiterInterview.create({
      data: {
        title: params.title.trim(),
        jobDriveId: params.jobDriveId,
        recruiterId: params.recruiterId,
        studentId: params.studentId,
        scheduledAt: params.scheduledAt,
        durationMin: params.durationMin || 45,
        stage: params.stage || "TECHNICAL",
        status: "SCHEDULED",
        roomCode,
        meetingInstructions: params.meetingInstructions,
        institutionId: params.institutionId,
      },
      include: {
        student: { include: { user: true } },
        recruiter: {
          select: { firstName: true, lastName: true, email: true },
        },
        jobDrive: {
          select: { title: true, company: { select: { name: true } } },
        },
      },
    });

    // Notify candidate
    try {
      await db.notification.create({
        data: {
          userId: student.userId,
          type: "PLACEMENT",
          title: `💼 Virtual Interview Scheduled: ${params.title}`,
          message: `Interview Stage: ${params.stage || "Technical"} | Time: ${new Date(params.scheduledAt).toLocaleString("en-IN")}`,
          link: "/student/interviews",
          metadata: { interviewId: interview.id, roomCode },
        },
      });
    } catch {}

    return interview;
  }

  /**
   * Submits recruiter selection outcome and synchronizes Placement CRM
   */
  public static async submitDecision(params: SubmitRecruiterDecisionParams) {
    const interview = await db.recruiterInterview.findUnique({
      where: { id: params.interviewId },
    });

    if (!interview) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Interview record not found." });
    }

    const updated = await db.recruiterInterview.update({
      where: { id: params.interviewId },
      data: {
        status: params.selectionDecision,
        selectionDecision: params.selectionDecision,
        feedback: params.feedback?.trim(),
        privateNotes: params.privateNotes?.trim(),
      },
    });

    // If linked to a JobDrive, update the candidate's PlacementApplication status
    if (interview.jobDriveId) {
      try {
        const app = await db.placementApplication.findFirst({
          where: {
            jobDriveId: interview.jobDriveId,
            studentId: interview.studentId,
          },
        });

        if (app) {
          let appStatus = app.status;
          if (params.selectionDecision === "SELECTED") {
            appStatus = "OFFERED" as any;
          } else if (params.selectionDecision === "REJECTED") {
            appStatus = "REJECTED" as any;
          } else if (params.selectionDecision === "NEXT_ROUND") {
            appStatus = "INTERVIEWING" as any;
          }

          await db.placementApplication.update({
            where: { id: app.id },
            data: { status: appStatus },
          });
        }
      } catch {}
    }

    return updated;
  }
}
