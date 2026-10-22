import { z } from "zod";
import { router, publicProcedure, protectedProcedure, requireRoleProcedure } from "../init";
import {
  UserRoleCode,
  JobType,
  JobDriveStatus,
  PlacementApplicationStatus,
  InterviewRoundType,
} from "@prisma/client";
import { CorporatePartnerService } from "@/server/services/corporate-partner.service";
import { JobDriveService } from "@/server/services/job-drive.service";
import { PlacementApplicationService } from "@/server/services/placement-application.service";
import { PlacementEnterpriseService } from "@/server/services/placement-enterprise.service";
import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";

const adminRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
  UserRoleCode.PLACEMENT_OFFICER,
];

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
  // ==========================================
  // DASHBOARD & ANALYTICS
  // ==========================================
  getPlacementDashboardMetrics: requireRoleProcedure(adminRoles).query(async () => {
    return PlacementEnterpriseService.getPlacementDashboardMetrics();
  }),

  // ==========================================
  // TALENT POOL & ELIGIBILITY ENGINE
  // ==========================================
  listTalentPool: requireRoleProcedure(adminRoles)
    .input(
      z
        .object({
          courseId: z.string().optional(),
          batchId: z.string().optional(),
          placementStatus: z.string().optional(),
          search: z.string().optional(),
          isPlaced: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return PlacementEnterpriseService.listTalentPool(input);
    }),

  updateStudentPlacementStatus: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        studentProfileId: z.string(),
        placementStatus: z.string(),
        isPlaced: z.boolean().optional(),
        placedCompany: z.string().optional(),
        placedPackage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.updateStudentPlacementStatus(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // CORPORATE PARTNERS & RECRUITER CRM
  // ==========================================
  createPartner: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        name: z.string().min(1),
        industry: z.string().optional(),
        website: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.createPartner(asAuthUser(ctx.user), input);
    }),

  updatePartner: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        industry: z.string().optional(),
        website: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        location: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
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

  listCorporatePartnersDetailed: requireRoleProcedure(adminRoles).query(async () => {
    return CorporatePartnerService.listCorporatePartnersDetailed();
  }),

  /**
   * Public recruiter submission from https://www.softlabglobal.com/recruiters
   */
  registerPublicRecruiter: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(1, "Company name is required"),
        industry: z.string().optional(),
        website: z.string().optional(),
        companySize: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        contactPersonName: z.string().min(1, "Contact person name is required"),
        designation: z.string().optional(),
        contactEmail: z.string().email("Valid work email is required"),
        contactPhone: z.string().min(8, "Valid phone number is required"),
        whatsappNumber: z.string().optional(),
        hiringType: z.string().optional(),
        targetDomains: z.array(z.string()).default([]),
        jobTitle: z.string().optional(),
        openingsCount: z.number().int().positive().optional(),
        salaryPackage: z.string().optional(),
        workMode: z.string().optional(),
        jobDescription: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return CorporatePartnerService.registerPublicRecruiter(input);
    }),

  /**
   * Provisions a RECRUITER role user account for corporate partner HR
   */
  createRecruiterUser: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        companyId: z.string(),
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        password: z.string().min(6).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.createRecruiterUser(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // CORPORATE STAFFING INVOICES & BILLING
  // ==========================================
  createStaffingInvoice: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        partnerId: z.string().optional(),
        companyName: z.string().min(1),
        companyGst: z.string().optional(),
        companyAddress: z.string().optional(),
        companyCity: z.string().optional(),
        companyState: z.string().optional(),
        contactPerson: z.string().optional(),
        contactEmail: z.string().optional(),
        contactPhone: z.string().optional(),
        candidateName: z.string().min(1),
        candidateEmail: z.string().optional(),
        candidatePhone: z.string().optional(),
        position: z.string().min(1),
        joinedDate: z.union([z.string(), z.date()]).optional(),
        annualCtc: z.number().positive(),
        feePercentage: z.number().min(5).max(30).optional(),
        sacCode: z.string().optional(),
        authorizedBy: z.string().optional(),
        dueDate: z.union([z.string(), z.date()]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.createStaffingInvoice(asAuthUser(ctx.user), input);
    }),

  listStaffingInvoices: requireRoleProcedure(adminRoles).query(async () => {
    return CorporatePartnerService.listStaffingInvoices();
  }),

  getStaffingInvoiceById: requireRoleProcedure(adminRoles)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return CorporatePartnerService.getStaffingInvoiceById(input.id);
    }),

  updateStaffingInvoiceStatus: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        invoiceId: z.string(),
        status: z.enum(["UNPAID", "PAID", "PARTIALLY_PAID", "CANCELLED"]),
        paymentMode: z.string().optional(),
        transactionRef: z.string().optional(),
        paidAt: z.union([z.string(), z.date()]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.updateStaffingInvoiceStatus(asAuthUser(ctx.user), input);
    }),

  dispatchStaffingInvoice: requireRoleProcedure(adminRoles)
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return CorporatePartnerService.dispatchStaffingInvoice(asAuthUser(ctx.user), input.invoiceId);
    }),

  listRecruiterContacts: requireRoleProcedure(adminRoles)
    .input(z.object({ companyId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return PlacementEnterpriseService.listRecruiterContacts(input?.companyId);
    }),

  createRecruiterContact: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        companyId: z.string(),
        name: z.string().min(1),
        designation: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        altPhone: z.string().optional(),
        linkedinUrl: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.createRecruiterContact(asAuthUser(ctx.user), input);
    }),

  updateRecruiterContact: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        designation: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        altPhone: z.string().optional(),
        linkedinUrl: z.string().optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return PlacementEnterpriseService.updateRecruiterContact(asAuthUser(ctx.user), id, data);
    }),

  deleteRecruiterContact: requireRoleProcedure(adminRoles)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.deleteRecruiterContact(asAuthUser(ctx.user), input.id);
    }),

  listRecruiterFollowUps: requireRoleProcedure(adminRoles)
    .input(
      z
        .object({
          companyId: z.string().optional(),
          recruiterId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return PlacementEnterpriseService.listRecruiterFollowUps(input);
    }),

  createRecruiterFollowUp: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        companyId: z.string(),
        recruiterId: z.string().optional(),
        type: z.string().optional(),
        notes: z.string().min(1),
        nextFollowUpDate: z.date().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.createRecruiterFollowUp(asAuthUser(ctx.user), input);
    }),

  updateRecruiterFollowUp: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        id: z.string(),
        status: z.string().optional(),
        notes: z.string().optional(),
        nextFollowUpDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return PlacementEnterpriseService.updateRecruiterFollowUp(asAuthUser(ctx.user), id, data);
    }),

  // ==========================================
  // JOB DRIVES / OPENINGS
  // ==========================================
  createJobDrive: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        companyId: z.string(),
        recruiterId: z.string().optional(),
        title: z.string().min(1),
        slug: z.string().optional(),
        department: z.string().optional(),
        jobType: z.nativeEnum(JobType).optional(),
        workMode: z.string().optional(),
        description: z.string(),
        responsibilities: z.string().optional(),
        requirements: z.string().optional(),
        benefits: z.string().optional(),
        eligibleBatchId: z.string().optional(),
        eligibilityCriteria: z.string().optional(),
        minPassingPercentage: z.number().optional(),
        minAttendancePercentage: z.number().optional(),
        requireCertification: z.boolean().optional(),
        targetCourseId: z.string().optional(),
        salaryPackage: z.string().optional(),
        minSalary: z.number().optional(),
        maxSalary: z.number().optional(),
        salaryType: z.string().optional(),
        location: z.string().optional(),
        experience: z.string().optional(),
        qualification: z.string().optional(),
        skills: z.array(z.string()).optional(),
        openingsCount: z.number().optional(),
        deadline: z.date().optional(),
        driveDate: z.date().optional(),
        interviewDate: z.date().optional(),
        joiningDate: z.date().optional(),
        venue: z.string().optional(),
        meetingLink: z.string().optional(),
        driveType: z.string().optional(),
        status: z.nativeEnum(JobDriveStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobDriveService.createJobDrive(asAuthUser(ctx.user), input);
    }),

  updateJobDrive: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        id: z.string(),
        companyId: z.string().optional(),
        recruiterId: z.string().optional(),
        title: z.string().optional(),
        department: z.string().optional(),
        jobType: z.nativeEnum(JobType).optional(),
        workMode: z.string().optional(),
        description: z.string().optional(),
        responsibilities: z.string().optional(),
        requirements: z.string().optional(),
        benefits: z.string().optional(),
        eligibleBatchId: z.string().optional(),
        eligibilityCriteria: z.string().optional(),
        minPassingPercentage: z.number().optional(),
        minAttendancePercentage: z.number().optional(),
        requireCertification: z.boolean().optional(),
        targetCourseId: z.string().optional(),
        salaryPackage: z.string().optional(),
        minSalary: z.number().optional(),
        maxSalary: z.number().optional(),
        salaryType: z.string().optional(),
        location: z.string().optional(),
        experience: z.string().optional(),
        qualification: z.string().optional(),
        skills: z.array(z.string()).optional(),
        openingsCount: z.number().optional(),
        deadline: z.date().optional(),
        driveDate: z.date().optional(),
        interviewDate: z.date().optional(),
        joiningDate: z.date().optional(),
        venue: z.string().optional(),
        meetingLink: z.string().optional(),
        driveType: z.string().optional(),
        status: z.nativeEnum(JobDriveStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobDriveService.updateJobDrive(asAuthUser(ctx.user), input);
    }),

  duplicateJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({ driveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.duplicateJobDrive(asAuthUser(ctx.user), input.driveId);
    }),

  archiveJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({ driveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.setJobDriveStatus(
        asAuthUser(ctx.user),
        input.driveId,
        JobDriveStatus.ARCHIVED
      );
    }),

  closeJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({ driveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.setJobDriveStatus(
        asAuthUser(ctx.user),
        input.driveId,
        JobDriveStatus.CLOSED
      );
    }),

  activateJobDrive: requireRoleProcedure(adminRoles)
    .input(z.object({ driveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.setJobDriveStatus(
        asAuthUser(ctx.user),
        input.driveId,
        JobDriveStatus.ACTIVE
      );
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

  // ==========================================
  // STUDENT PORTAL & PROFILE
  // ==========================================
  listEligibleDrives: protectedProcedure.query(async ({ ctx }) => {
    const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }
    return JobDriveService.listEligibleDrivesForStudent(student.id);
  }),

  getMyPlacementProfile: protectedProcedure.query(async ({ ctx }) => {
    const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }
    return PlacementApplicationService.getStudentPlacementProfile(student.id);
  }),

  updateMyPlacementProfile: protectedProcedure
    .input(
      z.object({
        headline: z.string().optional(),
        bio: z.string().optional(),
        resumeUrl: z.string().optional(),
        resumeFileName: z.string().optional(),
        portfolioUrl: z.string().optional(),
        githubUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        preferredLocation: z.string().optional(),
        preferredRole: z.string().optional(),
        expectedSalary: z.string().optional(),
        experienceMonths: z.number().optional(),
        skills: z.array(z.string()).optional(),
      })
    )
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
    .input(
      z.object({
        jobDriveId: z.string(),
        coverNote: z.string().optional(),
      })
    )
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

  getMyApplications: protectedProcedure.query(async ({ ctx }) => {
    const student = await db.studentProfile.findFirst({ where: { userId: ctx.user.id } });
    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
    }
    return PlacementApplicationService.listStudentApplications(student.id);
  }),

  // ==========================================
  // APPLICATIONS & INTERVIEWS PIPELINE
  // ==========================================
  listDriveApplications: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        jobDriveId: z.string(),
        status: z.nativeEnum(PlacementApplicationStatus).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return PlacementApplicationService.listDriveApplications(
        asAuthUser(ctx.user),
        input.jobDriveId,
        input.status
      );
    }),

  updateApplicationStatus: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        applicationId: z.string(),
        status: z.nativeEnum(PlacementApplicationStatus),
        offeredPackage: z.string().optional(),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.updateApplicationStatus(asAuthUser(ctx.user), input);
    }),

  scheduleInterviewRound: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        applicationId: z.string(),
        roundNumber: z.number(),
        roundType: z.nativeEnum(InterviewRoundType),
        scheduledAt: z.date().optional(),
        meetingLink: z.string().optional(),
        feedback: z.string().optional(),
        passed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.scheduleInterviewRound(asAuthUser(ctx.user), input);
    }),

  recordInterviewFeedback: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        roundId: z.string(),
        feedback: z.string(),
        passed: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementApplicationService.recordInterviewFeedback(
        asAuthUser(ctx.user),
        input.roundId,
        input.feedback,
        input.passed
      );
    }),

  // ==========================================
  // OFFERS & JOININGS
  // ==========================================
  createPlacementOffer: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        applicationId: z.string(),
        companyName: z.string().min(1),
        position: z.string().min(1),
        ctc: z.string().min(1),
        fixedSalary: z.string().optional(),
        variableSalary: z.string().optional(),
        bonus: z.string().optional(),
        offerDate: z.date().optional(),
        joiningDate: z.date().optional(),
        validUntil: z.date().optional(),
        location: z.string().optional(),
        offerLetterUrl: z.string().optional(),
        status: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.createPlacementOffer(asAuthUser(ctx.user), input);
    }),

  updatePlacementOffer: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        offerId: z.string(),
        ctc: z.string().optional(),
        position: z.string().optional(),
        joiningDate: z.date().optional(),
        status: z.string().optional(),
        offerLetterUrl: z.string().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { offerId, ...data } = input;
      return PlacementEnterpriseService.updatePlacementOffer(asAuthUser(ctx.user), offerId, data);
    }),

  createPlacementJoining: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        applicationId: z.string(),
        companyName: z.string().min(1),
        position: z.string().min(1),
        joinedDate: z.date(),
        employeeId: z.string().optional(),
        workEmail: z.string().optional(),
        workPhone: z.string().optional(),
        joiningProofUrl: z.string().optional(),
        status: z.string().optional(),
        followUpDate: z.date().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PlacementEnterpriseService.createPlacementJoining(asAuthUser(ctx.user), input);
    }),

  listOffersAndJoinings: requireRoleProcedure(adminRoles).query(async () => {
    return PlacementEnterpriseService.listOffersAndJoinings();
  }),
});
