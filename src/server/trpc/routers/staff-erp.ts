import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import {
  UserRoleCode,
  StaffDepartment,
  LeaveType,
  LeaveRequestStatus,
  PayrollStatus,
  PaymentMethod,
  AttendanceStatus,
} from "@prisma/client";
import { StaffProfileService } from "@/server/services/staff-profile.service";
import { LeaveManagementService } from "@/server/services/leave-management.service";
import { PayrollService } from "@/server/services/payroll.service";
import { StaffHrmsService } from "@/server/services/staff-hrms.service";
import { StaffExtendedService } from "@/server/services/staff-extended.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";

const adminHRRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.HR,
  UserRoleCode.ACCOUNTANT,
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

export const staffErpRouter = router({
  // ==========================================
  // DEPARTMENTS & DESIGNATIONS
  // ==========================================
  listDepartments: requireRoleProcedure(adminHRRoles).query(async () => {
    return StaffHrmsService.listDepartments();
  }),

  createDepartment: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        code: z.string().min(2),
        name: z.string().min(2),
        description: z.string().optional(),
        headId: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.createDepartment(asAuthUser(ctx.user), input);
    }),

  updateDepartment: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        headId: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return StaffHrmsService.updateDepartment(asAuthUser(ctx.user), id, data);
    }),

  listDesignations: requireRoleProcedure(adminHRRoles)
    .input(z.object({ departmentId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return StaffHrmsService.listDesignations(input?.departmentId);
    }),

  createDesignation: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        departmentId: z.string(),
        title: z.string().min(2),
        level: z.number().int().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.createDesignation(asAuthUser(ctx.user), input);
    }),

  updateDesignation: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        level: z.number().int().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return StaffHrmsService.updateDesignation(asAuthUser(ctx.user), id, data);
    }),

  // ==========================================
  // STAFF DIRECTORY
  // ==========================================
  listStaff: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          department: z.nativeEnum(StaffDepartment).optional(),
          isActive: z.boolean().optional(),
          search: z.string().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffProfileService.listStaffProfiles(input ?? {});
    }),

  createStaffProfile: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        userId: z.string(),
        employeeId: z.string().optional(),
        department: z.nativeEnum(StaffDepartment),
        designation: z.string().min(1),
        joiningDate: z.date().optional(),
        baseSalary: z.number().int().positive(), // integer Paise
        bankAccountNumber: z.string().optional(),
        bankIfsc: z.string().optional(),
        panNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffProfileService.createStaffProfile(asAuthUser(ctx.user), input);
    }),

  updateStaffProfile: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        department: z.nativeEnum(StaffDepartment).optional(),
        designation: z.string().min(1).optional(),
        baseSalary: z.number().int().positive().optional(),
        bankAccountNumber: z.string().optional(),
        bankIfsc: z.string().optional(),
        panNumber: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { staffId, ...rest } = input;
      return StaffProfileService.updateStaffProfile(asAuthUser(ctx.user), staffId, rest);
    }),

  // ==========================================
  // STAFF ATTENDANCE
  // ==========================================
  markStaffAttendance: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        date: z.date(),
        status: z.nativeEnum(AttendanceStatus),
        checkInTime: z.string().optional(),
        checkOutTime: z.string().optional(),
        workHours: z.number().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.markAttendance(asAuthUser(ctx.user), input);
    }),

  bulkMarkStaffAttendance: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        date: z.date(),
        records: z.array(
          z.object({
            staffId: z.string(),
            status: z.nativeEnum(AttendanceStatus),
            checkInTime: z.string().optional(),
            checkOutTime: z.string().optional(),
            remarks: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.bulkMarkAttendance(asAuthUser(ctx.user), input.date, input.records);
    }),

  listStaffAttendance: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          month: z.number().int().min(1).max(12).optional(),
          year: z.number().int().optional(),
          date: z.date().optional(),
          staffId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffHrmsService.listAttendance(input);
    }),

  getStaffAttendanceSummary: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        month: z.number().int().min(1).max(12),
        year: z.number().int(),
      })
    )
    .query(async ({ input }) => {
      return StaffHrmsService.getMonthlyAttendanceSummary(input.month, input.year);
    }),

  // ==========================================
  // LEAVES
  // ==========================================
  listAllLeaves: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          status: z.nativeEnum(LeaveRequestStatus).optional(),
          department: z.nativeEnum(StaffDepartment).optional(),
          staffId: z.string().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return LeaveManagementService.listAllLeaves(input ?? {});
    }),

  reviewLeaveRequest: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        leaveRequestId: z.string(),
        status: z.enum([LeaveRequestStatus.APPROVED, LeaveRequestStatus.REJECTED]),
        rejectionReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return LeaveManagementService.reviewLeaveRequest(asAuthUser(ctx.user), input.leaveRequestId, {
        status: input.status,
        rejectionReason: input.rejectionReason,
      });
    }),

  // ==========================================
  // PAYROLL & SALARY SLIPS
  // ==========================================
  generateMonthlyPayroll: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string().optional(),
        month: z.number().int().min(1).max(12),
        year: z.number().int().min(2020),
        workingDays: z.number().int().min(1).max(31).default(30),
        allowances: z.number().int().min(0).default(0),
        deductions: z.number().int().min(0).default(0),
        remarks: z.string().optional(),
        department: z.nativeEnum(StaffDepartment).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = asAuthUser(ctx.user);
      if (input.staffId) {
        return PayrollService.generateStaffPayroll(actor, {
          staffId: input.staffId,
          month: input.month,
          year: input.year,
          workingDays: input.workingDays,
          allowances: input.allowances,
          deductions: input.deductions,
          remarks: input.remarks,
        });
      }
      return PayrollService.batchGenerateMonthlyPayroll(actor, {
        month: input.month,
        year: input.year,
        department: input.department,
        workingDays: input.workingDays,
      });
    }),

  listPayrollRecords: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          month: z.number().int().min(1).max(12).optional(),
          year: z.number().int().optional(),
          department: z.nativeEnum(StaffDepartment).optional(),
          status: z.nativeEnum(PayrollStatus).optional(),
          staffId: z.string().optional(),
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return PayrollService.listPayrollRecords(input ?? {});
    }),

  markPayrollPaid: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        payrollId: z.string(),
        paymentMethod: z.nativeEnum(PaymentMethod),
        paymentReference: z.string().min(1),
        paymentDate: z.date().optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return PayrollService.markPayrollPaid(asAuthUser(ctx.user), input.payrollId, {
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        paymentDate: input.paymentDate,
        remarks: input.remarks,
      });
    }),

  getPayrollSummaryMetrics: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          month: z.number().int().min(1).max(12).optional(),
          year: z.number().int().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const [payrollMetrics, staffMetrics] = await Promise.all([
        PayrollService.getPayrollMetrics(input?.month, input?.year),
        StaffProfileService.getStaffMetrics(),
      ]);
      return { ...payrollMetrics, ...staffMetrics };
    }),

  // ==========================================
  // STAFF TASKS
  // ==========================================
  listStaffTasks: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          staffId: z.string().optional(),
          status: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffHrmsService.listStaffTasks(input);
    }),

  createStaffTask: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        dueDate: z.date().optional(),
        priority: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.createStaffTask(asAuthUser(ctx.user), input);
    }),

  updateStaffTaskStatus: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        status: z.string(),
        completionPercentage: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffHrmsService.updateStaffTaskStatus(input.taskId, input.status, input.completionPercentage);
    }),

  // ==========================================
  // PERFORMANCE REVIEWS
  // ==========================================
  listPerformanceReviews: requireRoleProcedure(adminHRRoles)
    .input(z.object({ staffId: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return StaffHrmsService.listPerformanceReviews(input?.staffId);
    }),

  createPerformanceReview: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        reviewPeriod: z.string().min(1),
        rating: z.number().min(1).max(5),
        kpisScore: z.number().optional(),
        strengths: z.string().optional(),
        improvements: z.string().optional(),
        goals: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.createPerformanceReview(asAuthUser(ctx.user), input);
    }),

  // ==========================================
  // STAFF DOCUMENTS
  // ==========================================
  listStaffDocuments: protectedProcedure
    .input(z.object({ staffId: z.string() }))
    .query(async ({ input }) => {
      return StaffHrmsService.listStaffDocuments(input.staffId);
    }),

  uploadStaffDocument: protectedProcedure
    .input(
      z.object({
        staffId: z.string(),
        title: z.string().min(1),
        docType: z.string().min(1),
        fileUrl: z.string().min(1),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.uploadStaffDocument(asAuthUser(ctx.user), input);
    }),

  verifyStaffDocument: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        docId: z.string(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffHrmsService.verifyStaffDocument(asAuthUser(ctx.user), input.docId, input.isVerified);
    }),

  // ==========================================
  // STAFF SELF-SERVICE PROCEDURES
  // ==========================================
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.roleCode === UserRoleCode.STUDENT) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Students do not have staff access." });
    }
    const profile = await StaffProfileService.getStaffProfileByUserId(ctx.user.id);
    if (!profile) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found for this account." });
    }
    return profile;
  }),

  applyForLeave: protectedProcedure
    .input(
      z.object({
        leaveType: z.nativeEnum(LeaveType),
        startDate: z.date(),
        endDate: z.date(),
        reason: z.string().min(3),
        daysCount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.roleCode === UserRoleCode.STUDENT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Students cannot apply for staff leave." });
      }
      const profile = await StaffProfileService.getStaffProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found for this account." });
      }
      return LeaveManagementService.applyForLeave(profile.id, input);
    }),

  getMyLeaves: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.roleCode === UserRoleCode.STUDENT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
      const profile = await StaffProfileService.getStaffProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
      }
      return LeaveManagementService.listPersonalLeaves(profile.id, input?.page, input?.limit);
    }),

  getMySalarySlips: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.roleCode === UserRoleCode.STUDENT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
      const profile = await StaffProfileService.getStaffProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
      }
      return PayrollService.listPersonalSalarySlips(profile.id, input?.page, input?.limit);
    }),

  getSalarySlipDetails: protectedProcedure
    .input(z.object({ slipId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.roleCode === UserRoleCode.STUDENT) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
      }
      const profile = await StaffProfileService.getStaffProfileByUserId(ctx.user.id);
      if (!profile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Staff profile not found." });
      }
      return PayrollService.getSalarySlipForStaff(profile.id, input.slipId);
    }),

  // ==========================================
  // 9. SHIFTS MANAGEMENT
  // ==========================================
  listShifts: requireRoleProcedure(adminHRRoles).query(async () => {
    return StaffExtendedService.listShifts();
  }),

  createShift: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        name: z.string().min(1),
        code: z.string().min(1),
        startTime: z.string().min(1),
        endTime: z.string().min(1),
        breakMinutes: z.number().optional(),
        weeklyOff: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.createShift(input);
    }),

  updateShift: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        breakMinutes: z.number().optional(),
        weeklyOff: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.updateShift(input);
    }),

  assignStaffShift: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        shiftId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.assignStaffShift(input.staffId, input.shiftId);
    }),

  // ==========================================
  // 10. ASSET MANAGEMENT
  // ==========================================
  listAssets: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          category: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffExtendedService.listAssets(input);
    }),

  createAsset: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        assetTag: z.string().min(1),
        name: z.string().min(1),
        category: z.string().min(1),
        serialNumber: z.string().optional(),
        brand: z.string().optional(),
        model: z.string().optional(),
        condition: z.string().optional(),
        status: z.string().optional(),
        assignedStaffId: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.createAsset(input);
    }),

  assignAsset: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        assetId: z.string(),
        staffId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.assignAsset(input.assetId, input.staffId, input.notes);
    }),

  returnAsset: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        assetId: z.string(),
        condition: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.returnAsset(input.assetId, input.condition, input.notes);
    }),

  // ==========================================
  // 11. RECRUITMENT / ATS PIPELINE
  // ==========================================
  listJobOpenings: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          status: z.string().optional(),
          department: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffExtendedService.listJobOpenings(input);
    }),

  createJobOpening: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        title: z.string().min(1),
        department: z.string().min(1),
        employmentType: z.string().optional(),
        experienceMin: z.number().optional(),
        experienceMax: z.number().optional(),
        minSalary: z.number().optional(),
        maxSalary: z.number().optional(),
        openPositions: z.number().optional(),
        location: z.string().optional(),
        description: z.string().min(1),
        requirements: z.string().optional(),
        closingDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffExtendedService.createJobOpening({
        ...input,
        createdById: ctx.user.id,
      });
    }),

  listApplicants: requireRoleProcedure(adminHRRoles)
    .input(
      z
        .object({
          openingId: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return StaffExtendedService.listApplicants(
        input?.openingId,
        input?.status,
        input?.search
      );
    }),

  createApplicant: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        openingId: z.string(),
        fullName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        currentRole: z.string().optional(),
        currentCompany: z.string().optional(),
        experienceYears: z.number().optional(),
        expectedCtc: z.number().optional(),
        noticePeriodDays: z.number().optional(),
        resumeUrl: z.string().optional(),
        portfolioUrl: z.string().optional(),
        linkedinUrl: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.createApplicant(input);
    }),

  updateApplicantStatus: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        id: z.string(),
        status: z.string(),
        rating: z.number().optional(),
        notes: z.string().optional(),
        interviewDate: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.updateApplicantStatus(input);
    }),

  // ==========================================
  // 12. ONBOARDING & OFFBOARDING
  // ==========================================
  getOnboardingChecklist: requireRoleProcedure(adminHRRoles)
    .input(z.object({ staffId: z.string() }))
    .query(async ({ input }) => {
      return StaffExtendedService.getOnboardingChecklist(input.staffId);
    }),

  updateOnboardingChecklist: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        personalDetailsDone: z.boolean().optional(),
        documentsUploaded: z.boolean().optional(),
        bankDetailsVerified: z.boolean().optional(),
        workstationAssigned: z.boolean().optional(),
        idCardIssued: z.boolean().optional(),
        emailAccountCreated: z.boolean().optional(),
        slackOrPortalInvited: z.boolean().optional(),
        orientationCompleted: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.updateOnboardingChecklist(input);
    }),

  getOffboardingRecord: requireRoleProcedure(adminHRRoles)
    .input(z.object({ staffId: z.string() }))
    .query(async ({ input }) => {
      return StaffExtendedService.getOffboardingRecord(input.staffId);
    }),

  updateOffboardingRecord: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string(),
        resignationDate: z.date().optional(),
        lastWorkingDay: z.date().optional(),
        reasonForLeaving: z.string().optional(),
        assetsReturned: z.boolean().optional(),
        emailDeactivated: z.boolean().optional(),
        idCardReturned: z.boolean().optional(),
        accountsDuesCleared: z.boolean().optional(),
        relievingLetterIssued: z.boolean().optional(),
        experienceLetterIssued: z.boolean().optional(),
        exitInterviewNotes: z.string().optional(),
        status: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return StaffExtendedService.updateOffboardingRecord({
        ...input,
        clearedById: ctx.user.id,
      });
    }),

  // ==========================================
  // 13. DOCUMENT & LETTER GENERATOR
  // ==========================================
  listTemplates: requireRoleProcedure(adminHRRoles).query(async () => {
    return StaffExtendedService.listTemplates();
  }),

  generateLetter: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        templateKey: z.string(),
        staffId: z.string().optional(),
        applicantId: z.string().optional(),
        customVariables: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return StaffExtendedService.generateLetter(input);
    }),
});

