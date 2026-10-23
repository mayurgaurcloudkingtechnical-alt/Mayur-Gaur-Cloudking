import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { UserRoleCode } from "@prisma/client";
import { MockInterviewService } from "@/server/services/interviews/mock-interview.service";

const INTERVIEW_STAFF_ROLES = [
  UserRoleCode.PLACEMENT_OFFICER,
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.TRAINER,
  UserRoleCode.HR,
];

export const mockInterviewRouter = router({
  /**
   * Schedule a mock interview
   */
  schedule: requireRoleProcedure(INTERVIEW_STAFF_ROLES)
    .input(
      z.object({
        title: z.string().min(3),
        interviewType: z.enum(["HR", "TECHNICAL", "COMMUNICATION", "APTITUDE", "ROLE_SPECIFIC"]).default("TECHNICAL"),
        scheduledAt: z.coerce.date(),
        durationMin: z.number().int().min(15).max(180).default(45),
        studentId: z.string(),
        interviewerId: z.string(),
        batchId: z.string().optional(),
        courseId: z.string().optional(),
        instructions: z.string().optional(),
        questionBank: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return MockInterviewService.scheduleInterview(input);
    }),

  /**
   * List mock interviews for student (own only)
   */
  listMyInterviews: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!student) return [];

    return ctx.db.mockInterview.findMany({
      where: { studentId: student.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        interviewer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }),

  /**
   * List interviews assigned to the logged-in interviewer or placement officer
   */
  listAssignedInterviews: requireRoleProcedure(INTERVIEW_STAFF_ROLES).query(async ({ ctx }) => {
    const isInterviewerOnly = ctx.user.roleCode === UserRoleCode.TRAINER;

    return ctx.db.mockInterview.findMany({
      where: isInterviewerOnly ? { interviewerId: ctx.user.id } : {},
      orderBy: { scheduledAt: "asc" },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            placementProfile: { select: { resumeUrl: true, skills: true } },
          },
        },
        interviewer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
  }),

  /**
   * Submit structured interview evaluation feedback
   */
  submitFeedback: requireRoleProcedure(INTERVIEW_STAFF_ROLES)
    .input(
      z.object({
        interviewId: z.string(),
        scoreCommunication: z.number().int().min(1).max(10),
        scoreTechnical: z.number().int().min(1).max(10),
        scoreConfidence: z.number().int().min(1).max(10),
        scoreProblemSolving: z.number().int().min(1).max(10),
        strengths: z.string().min(5),
        improvements: z.string().min(5),
        recommendations: z.string().min(5),
        status: z.enum(["COMPLETED", "RESCHEDULED", "ABSENT", "CANCELLED"]).default("COMPLETED"),
      })
    )
    .mutation(async ({ input }) => {
      return MockInterviewService.submitFeedback(input);
    }),

  /**
   * Get single mock interview details
   */
  getDetails: protectedProcedure
    .input(z.object({ interviewId: z.string() }))
    .query(async ({ ctx, input }) => {
      const interview = await ctx.db.mockInterview.findUnique({
        where: { id: input.interviewId },
        include: {
          student: {
            include: {
              user: { select: { firstName: true, lastName: true, email: true, phone: true } },
              placementProfile: true,
            },
          },
          interviewer: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      if (!interview) throw new TRPCError({ code: "NOT_FOUND", message: "Mock interview not found." });

      // Student scoping check
      if (ctx.user.roleCode === UserRoleCode.STUDENT) {
        const student = await ctx.db.studentProfile.findUnique({ where: { userId: ctx.user.id } });
        if (interview.studentId !== student?.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to this interview session." });
        }
      }

      return interview;
    }),
});
