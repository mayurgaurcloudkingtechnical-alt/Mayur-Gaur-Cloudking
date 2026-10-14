import { z } from "zod";
import { router, publicProcedure, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, InstitutionType, InstitutionStatus } from "@prisma/client";
import { InstitutionPartnershipService } from "@/server/services/institution-partnership.service";
import { InstitutionStudentService } from "@/server/services/institution-student.service";
import { JobFairService } from "@/server/services/job-fair.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { db } from "@/server/db/client";

const adminRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.PLACEMENT_OFFICER,
];

const institutionRoles = [
  ...adminRoles,
  UserRoleCode.INSTITUTION_ADMIN,
  UserRoleCode.INSTITUTION_OFFICER,
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

export const institutionRouter = router({
  // ==========================================
  // 1. PUBLIC REGISTRATION & ONBOARDING
  // ==========================================
  registerPublicInstitution: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Institution name is required"),
        type: z.nativeEnum(InstitutionType).optional(),
        affiliation: z.string().optional(),
        recognition: z.string().optional(),
        registrationNumber: z.string().optional(),
        address: z.string().optional(),
        district: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        pincode: z.string().optional(),
        website: z.string().optional(),
        officialEmail: z.string().email("Valid institutional email is required"),
        officialPhone: z.string().optional(),
        authorizedPersonName: z.string().min(2, "Representative name is required"),
        authorizedPersonDesignation: z.string().min(2, "Representative designation is required"),
        authorizedPersonEmail: z.string().email("Representative email is required"),
        authorizedPersonPhone: z.string().min(10, "Representative phone number is required"),
        placementOfficerName: z.string().optional(),
        placementOfficerEmail: z.string().email().optional().or(z.literal("")),
        placementOfficerPhone: z.string().optional(),
        departmentsOffered: z.array(z.string()).optional(),
        estimatedStudentCount: z.number().optional(),
        agreementDocumentUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return InstitutionPartnershipService.registerPublicInstitution({
        ...input,
        placementOfficerEmail: input.placementOfficerEmail || undefined,
      });
    }),

  // ==========================================
  // 2. CENTRAL ADMIN DIRECTORY & APPROVALS
  // ==========================================
  listInstitutions: requireRoleProcedure(adminRoles)
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.union([z.nativeEnum(InstitutionStatus), z.literal("ALL")]).optional(),
          city: z.string().optional(),
          page: z.number().optional(),
          pageSize: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return InstitutionPartnershipService.listInstitutions(asAuthUser(ctx.user), input);
    }),

  getInstitution: requireRoleProcedure(institutionRoles)
    .input(z.object({ institutionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return InstitutionPartnershipService.getInstitutionById(asAuthUser(ctx.user), input.institutionId);
    }),

  reviewApproval: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        institutionId: z.string(),
        decision: z.enum(["APPROVED", "REJECTED", "CORRECTION_REQUESTED"]),
        remarks: z.string().optional(),
        provisionalAdminPassword: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return InstitutionPartnershipService.reviewApproval(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // 3. INSTITUTIONAL PORTAL DASHBOARD (SCOPED)
  // ==========================================
  getInstitutionDashboard: requireRoleProcedure(institutionRoles).query(async ({ ctx }) => {
    return InstitutionPartnershipService.getInstitutionDashboard(asAuthUser(ctx.user));
  }),

  // ==========================================
  // 4. STUDENT REGISTRATION & ROSTER
  // ==========================================
  listStudents: requireRoleProcedure(institutionRoles)
    .input(
      z
        .object({
          institutionId: z.string().optional(),
          courseName: z.string().optional(),
          passingYear: z.number().optional(),
          eligibility: z.boolean().optional(),
          search: z.string().optional(),
          page: z.number().optional(),
          pageSize: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return InstitutionStudentService.listStudents(asAuthUser(ctx.user), input);
    }),

  registerStudent: requireRoleProcedure(institutionRoles)
    .input(
      z.object({
        institutionId: z.string().optional(),
        fullName: z.string().min(2),
        email: z.string().email(),
        mobile: z.string().min(10),
        gender: z.string().optional(),
        dateOfBirth: z.date().optional(),
        address: z.string().optional(),
        pincode: z.string().optional(),
        guardianName: z.string().optional(),
        guardianPhone: z.string().optional(),
        courseName: z.string().min(1),
        department: z.string().optional(),
        degreeType: z.string().optional(),
        academicYear: z.string().min(1),
        admissionYear: z.number().optional(),
        passingYear: z.number(),
        currentSemester: z.number().optional(),
        currentYear: z.number().optional(),
        enrollmentNumber: z.string().min(1),
        rollNumber: z.string().optional(),
        academicPercentage: z.number().optional(),
        cgpa: z.number().optional(),
        activeBacklogs: z.number().optional(),
        historyBacklogs: z.number().optional(),
        technicalSkills: z.array(z.string()).optional(),
        preferredRole: z.string().optional(),
        preferredLocation: z.string().optional(),
        resumeUrl: z.string().optional(),
        consentForRecruiters: z.boolean().optional(),
        registrationFeeAmount: z.number().optional(),
        feePaymentStatus: z.enum(["NOT_APPLICABLE", "PENDING", "PAID", "WAIVED"]).optional(),
        paymentReference: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return InstitutionStudentService.registerSingleStudent(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // 5. BULK IMPORT & TEMPLATES
  // ==========================================
  getImportTemplate: requireRoleProcedure(institutionRoles).query(() => {
    return {
      templateCsv: InstitutionStudentService.getCsvTemplate(),
      fileName: "softlab_campus_student_import_template.csv",
    };
  }),

  bulkImportStudents: requireRoleProcedure(institutionRoles)
    .input(
      z.object({
        institutionId: z.string().optional(),
        fileName: z.string(),
        csvContent: z.string().min(10),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return InstitutionStudentService.processBulkStudentImport(asAuthUser(ctx.user), input);
    }),

  verifyStudentPayment: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        paymentId: z.string(),
        decision: z.enum(["VERIFY", "REJECT", "WAIVE"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return InstitutionStudentService.verifyPayment(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // 6. JOB FAIRS & CAMPUS DRIVES
  // ==========================================
  listJobFairs: requireRoleProcedure(institutionRoles)
    .input(
      z
        .object({
          search: z.string().optional(),
          status: z.string().optional(),
          fairType: z.string().optional(),
          page: z.number().optional(),
          pageSize: z.number().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return JobFairService.listJobFairs(asAuthUser(ctx.user), input);
    }),

  getJobFair: requireRoleProcedure(institutionRoles)
    .input(z.object({ jobFairId: z.string() }))
    .query(async ({ ctx, input }) => {
      return JobFairService.getJobFairById(asAuthUser(ctx.user), input.jobFairId);
    }),

  createJobFair: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        title: z.string().min(2),
        theme: z.string().optional(),
        description: z.string().optional(),
        fairType: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).optional(),
        venue: z.string().optional(),
        city: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        registrationDeadline: z.date().optional(),
        maxCapacity: z.number().optional(),
        bannerUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobFairService.createJobFair(asAuthUser(ctx.user), input);
    }),

  inviteInstitutionsToJobFair: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        jobFairId: z.string(),
        institutionIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobFairService.inviteInstitutions(asAuthUser(ctx.user), input);
    }),

  assignRecruiterStall: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        jobFairId: z.string(),
        partnerId: z.string(),
        stallNumber: z.string().optional(),
        vacanciesCount: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobFairService.assignRecruiterStall(asAuthUser(ctx.user), input);
    }),

  nominateStudentForDrive: requireRoleProcedure(institutionRoles)
    .input(
      z.object({
        jobDriveId: z.string(),
        institutionEnrollmentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobFairService.nominateStudentForDrive(asAuthUser(ctx.user), input);
    }),

  overrideEligibility: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        nominationId: z.string(),
        reason: z.string().min(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return JobFairService.overrideEligibility(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // 7. CENTRAL METRICS FOR CAMPUS MODULE
  // ==========================================
  getCentralCampusMetrics: requireRoleProcedure(adminRoles).query(async () => {
    const [
      totalInstitutions,
      pendingApprovals,
      activeColleges,
      totalStudents,
      upcomingJobFairs,
      activeDrives,
      totalNominations,
      verifiedPaymentsCount,
    ] = await Promise.all([
      db.institution.count(),
      db.institution.count({ where: { status: "PENDING_APPROVAL" } }),
      db.institution.count({ where: { status: "APPROVED" } }),
      db.studentInstitutionEnrollment.count(),
      db.jobFair.count({ where: { status: "PUBLISHED" } }),
      db.jobDrive.count({ where: { status: "ACTIVE" } }),
      db.driveNomination.count(),
      db.studentRegistrationPayment.count({ where: { paymentStatus: "VERIFIED" } }),
    ]);

    return {
      totalInstitutions,
      pendingApprovals,
      activeColleges,
      totalStudents,
      upcomingJobFairs,
      activeDrives,
      totalNominations,
      verifiedPaymentsCount,
    };
  }),
});
