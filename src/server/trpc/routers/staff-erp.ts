import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import {
  UserRoleCode,
  StaffDepartment,
  LeaveType,
  LeaveRequestStatus,
  PayrollStatus,
  PaymentMethod,
} from "@prisma/client";
import { StaffProfileService } from "@/server/services/staff-profile.service";
import { LeaveManagementService } from "@/server/services/leave-management.service";
import { PayrollService } from "@/server/services/payroll.service";
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
  // ADMIN & HR PROCEDURES
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

  generateMonthlyPayroll: requireRoleProcedure(adminHRRoles)
    .input(
      z.object({
        staffId: z.string().optional(), // if provided, single; else batch
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
});
