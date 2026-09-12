import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, JobType, JobDriveStatus, PlacementApplicationStatus, InterviewRoundType } from "@prisma/client";
import { CorporatePartnerService } from "@/server/services/corporate-partner.service";
import { JobDriveService } from "@/server/services/job-drive.service";
import { PlacementApplicationService } from "@/server/services/placement-application.service";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";

import { AuthenticatedUser } from "@/server/auth/rbac";

const adminRoles = [UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.PLACEMENT_OFFICER];

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

export const placementRouter = router({
  // Partner Procedures
  createPartner: requireRoleProcedure(adminRoles)
    .input(z.object({
      name: z.string().min(1),
      industry: z.string().optional(),
      website: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.createPartner(asAuthUser(ctx.user), input);
    }),


  updatePartner: requireRoleProcedure(adminRoles)
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      contactPerson: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      location: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.updatePartner(asAuthUser(ctx.user), input);
    }),

  listPartners: protectedProcedure
    .input(z.object({ onlyActive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return CorporatePartnerService.listPartners(input?.onlyActive);
    }),

  getPartnerById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return CorporatePartnerService.getPartnerById(input.id);
    }),

  // Job Drive Procedures
  createJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({
      companyId: z.string(),
      title: z.string().min(1),
      slug: z.string().optional(),
      jobType: z.nativeEnum(JobType).optional(),
      description: z.string(),
      eligibilityCriteria: z.string().optional(),
      minPassingPercentage: z.number().optional(),
      requireCertification: z.boolean().optional(),
      targetCourseId: z.string().optional(),
      salaryPackage: z.string().optional(),
      location: z.string().optional(),
      openingsCount: z.number().optional(),
      deadline: z.date().optional(),
      driveDate: z.date().optional(),
      status: z.nativeEnum(JobDriveStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return JobDriveService.createJobDrive(asAuthUser(ctx.user), input);
    }),

  updateJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({
      id: z.string(),
      companyId: z.string().optional(),
      title: z.string().optional(),
      jobType: z.nativeEnum(JobType).optional(),
      description: z.string().optional(),
      eligibilityCriteria: z.string().optional(),
      minPassingPercentage: z.number().optional(),
      requireCertification: z.boolean().optional(),
      targetCourseId: z.string().optional(),
      salaryPackage: z.string().optional(),
      location: z.string().optional(),
      openingsCount: z.number().optional(),
      deadline: z.date().optional(),
      driveDate: z.date().optional(),
      status: z.nativeEnum(JobDriveStatus).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return JobDriveService.updateJobDrive(asAuthUser(ctx.user), input);
    }),

  listAdminDrives: requireRoleProcedure(adminRoles)
    .input(z.object({ status: z.nativeEnum(JobDriveStatus).optional() }).optional())
    .query(async ({ input }) => {
      return JobDriveService.listAdminDrives(input?.status);
    }),

  getDriveDetails: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return JobDriveService.getDriveById(input.id);
    }),

  // Student Drives & Profile
  listEligibleDrives: protectedProcedure
    .query(async ({ ctx }) => {
      const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }
      return JobDriveService.listEligibleDrivesForStudent(student.id);
    }),

  getMyPlacementProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }
      return PlacementApplicationService.getStudentPlacementProfile(student.id);
    }),

  updateMyPlacementProfile: protectedProcedure
    .input(z.object({
      headline: z.string().optional(),
      bio: z.string().optional(),
      resumeUrl: z.string().optional(),
      portfolioUrl: z.string().optional(),
      githubUrl: z.string().optional(),
      linkedinUrl: z.string().optional(),
      skills: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }
      return PlacementApplicationService.upsertPlacementProfile(ctx.user.id, {
        studentProfileId: student.id,
        ...input,
      });
    }),

  applyForDrive: protectedProcedure
    .input(z.object({
      jobDriveId: z.string(),
      coverNote: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }
      return PlacementApplicationService.applyForJobDrive(ctx.user.id, {
        studentProfileId: student.id,
        jobDriveId: input.jobDriveId,
        coverNote: input.coverNote,
      });
    }),

  getMyApplications: protectedProcedure
    .query(async ({ ctx }) => {
      const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
      if (!student) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }
      return PlacementApplicationService.listStudentApplications(student.id);
    }),

  // Application Pipeline Management (Admin/Placement Officer)
  listDriveApplications: requireRoleProcedure(adminRoles)
    .input(z.object({
      jobDriveId: z.string(),
      status: z.nativeEnum(PlacementApplicationStatus).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return PlacementApplicationService.listDriveApplications(asAuthUser(ctx.user), input.jobDriveId, input.status);
    }),

  updateApplicationStatus: requireRoleProcedure(adminRoles)
    .input(z.object({
      applicationId: z.string(),
      status: z.nativeEnum(PlacementApplicationStatus),
      offeredPackage: z.string().optional(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.updateApplicationStatus(asAuthUser(ctx.user), input);
    }),

  scheduleInterviewRound: requireRoleProcedure(adminRoles)
    .input(z.object({
      applicationId: z.string(),
      roundNumber: z.number(),
      roundType: z.nativeEnum(InterviewRoundType),
      scheduledAt: z.date().optional(),
      meetingLink: z.string().optional(),
      feedback: z.string().optional(),
      passed: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.scheduleInterviewRound(asAuthUser(ctx.user), input);
    }),

  recordInterviewFeedback: requireRoleProcedure(adminRoles)
    .input(z.object({
      roundId: z.string(),
      feedback: z.string(),
      passed: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.recordInterviewFeedback(asAuthUser(ctx.user), input.roundId, input.feedback, input.passed);
    }),

});
