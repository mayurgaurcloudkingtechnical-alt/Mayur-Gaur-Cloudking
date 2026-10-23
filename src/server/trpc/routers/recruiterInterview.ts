import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { TRPCError } from "@trpc/server";
import { UserRoleCode } from "@prisma/client";
import { RecruiterInterviewService } from "@/server/services/interviews/recruiter-interview.service";

const RECRUITER_OR_PLACEMENT_ROLES = [
  UserRoleCode.RECRUITER,
  UserRoleCode.PLACEMENT_OFFICER,
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.HR,
  UserRoleCode.INSTITUTION_ADMIN,
  UserRoleCode.INSTITUTION_OFFICER,
];

export const recruiterInterviewRouter = router({
  /**
   * Schedule recruiter interview round for a shortlisted candidate
   */
  schedule: requireRoleProcedure(RECRUITER_OR_PLACEMENT_ROLES)
    .input(
      z.object({
        title: z.string().min(3),
        jobDriveId: z.string().optional(),
        recruiterId: z.string(),
        studentId: z.string(),
        scheduledAt: z.coerce.date(),
        durationMin: z.number().int().min(15).max(180).default(45),
        stage: z.string().default("TECHNICAL"),
        meetingInstructions: z.string().optional(),
        institutionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return RecruiterInterviewService.scheduleInterview(input);
    }),

  /**
   * List recruiter interviews for recruiter (scoped to logged-in recruiter)
   */
  listRecruiterInterviews: requireRoleProcedure(RECRUITER_OR_PLACEMENT_ROLES).query(async ({ ctx }) => {
    const isRecruiter = ctx.user.roleCode === UserRoleCode.RECRUITER;

    return ctx.db.recruiterInterview.findMany({
      where: isRecruiter ? { recruiterId: ctx.user.id } : {},
      orderBy: { scheduledAt: "asc" },
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
            placementProfile: { select: { resumeUrl: true, skills: true, headline: true } },
          },
        },
        jobDrive: {
          select: { title: true, company: { select: { name: true } } },
        },
      },
    });
  }),

  /**
   * List recruiter interviews for student (own only)
   */
  listStudentInterviews: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!student) return [];

    return ctx.db.recruiterInterview.findMany({
      where: { studentId: student.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        recruiter: {
          select: { firstName: true, lastName: true },
        },
        jobDrive: {
          select: { title: true, company: { select: { name: true } } },
        },
      },
    });
  }),

  /**
   * Submit recruiter decision & feedback
   */
  submitDecision: requireRoleProcedure(RECRUITER_OR_PLACEMENT_ROLES)
    .input(
      z.object({
        interviewId: z.string(),
        selectionDecision: z.enum(["SELECTED", "REJECTED", "NEXT_ROUND", "ON_HOLD"]),
        feedback: z.string().optional(),
        privateNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return RecruiterInterviewService.submitDecision(input);
    }),
});
