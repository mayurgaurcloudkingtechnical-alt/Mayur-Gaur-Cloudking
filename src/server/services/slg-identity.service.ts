import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { UserStatus } from "@prisma/client";
import { SlgRbacService } from "./slg-rbac.service";

export interface OnboardEmployeeInput {
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  tenantBranchId?: string;
  tenantDepartmentId?: string;
  reportingManagerId?: string;
  canAccessMobile?: boolean;
  canAccessDesktop?: boolean;
}

export interface UpdateHierarchyInput {
  tenantId: string;
  actorUserId: string;
  targetUserId: string;
  tenantBranchId?: string | null;
  tenantDepartmentId?: string | null;
  reportingManagerId?: string | null;
  canAccessMobile?: boolean;
  canAccessDesktop?: boolean;
}

export class SlgIdentityService {
  /**
   * Resolves comprehensive employee profile, role, hierarchy, devices and permissions.
   */
  static async getEmployeeProfile(tenantId: string, userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roleCode: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        tenantId: true,
        tenantBranchId: true,
        tenantDepartmentId: true,
        reportingManagerId: true,
        canAccessMobile: true,
        canAccessDesktop: true,
        slgOnboardedAt: true,
        role: { select: { name: true, permissions: true } },
        tenant: { select: { id: true, name: true, slug: true } },
        tenantBranch: { select: { id: true, code: true, name: true, city: true } },
        tenantDepartment: { select: { id: true, code: true, name: true } },
        reportingManager: {
          select: { id: true, firstName: true, lastName: true, email: true, roleCode: true },
        },
        staffProfile: {
          select: {
            employeeId: true,
            designation: true,
            department: true,
            employmentStatus: true,
            workLocation: true,
          },
        },
        slgDeviceRegistrations: {
          select: {
            id: true,
            deviceUuid: true,
            deviceName: true,
            deviceType: true,
            status: true,
            isAuthorized: true,
            lastSeenAt: true,
            lastSyncAt: true,
            appVersion: true,
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });

    if (!user || user.tenantId !== tenantId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employee profile not found in current tenant.",
      });
    }

    const subordinatesCount = await db.user.count({
      where: { reportingManagerId: userId, tenantId },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayReport = await db.slgDailyReport.findUnique({
      where: {
        tenantId_userId_reportDate: {
          tenantId,
          userId,
          reportDate: today,
        },
      },
      select: { id: true, status: true, systemCallsTotal: true },
    });

    return {
      ...user,
      subordinatesCount,
      todayReportStatus: todayReport?.status || "NOT_SUBMITTED",
      todayCallsCount: todayReport?.systemCallsTotal || 0,
    };
  }

  /**
   * Onboards an existing SoftLab Global employee into Call Intelligence.
   */
  static async onboardEmployee(input: OnboardEmployeeInput) {
    const existingUser = await db.user.findUnique({
      where: { id: input.targetUserId },
      include: { staffProfile: true },
    });

    if (!existingUser) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Target employee user record does not exist in SOFTLAB GLOBAL master.",
      });
    }

    if (input.reportingManagerId) {
      if (input.reportingManagerId === input.targetUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "An employee cannot be their own reporting manager.",
        });
      }
      const existingSubordinates = await SlgRbacService.getSubordinateUserIds(input.targetUserId);
      if (existingSubordinates.includes(input.reportingManagerId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Circular reporting hierarchy detected. Manager cannot report to a subordinate.",
        });
      }
    }

    const updated = await db.user.update({
      where: { id: input.targetUserId },
      data: {
        tenantId: input.tenantId,
        tenantBranchId: input.tenantBranchId || existingUser.tenantBranchId,
        tenantDepartmentId: input.tenantDepartmentId || existingUser.tenantDepartmentId,
        reportingManagerId: input.reportingManagerId || existingUser.reportingManagerId,
        canAccessMobile: input.canAccessMobile !== undefined ? input.canAccessMobile : true,
        canAccessDesktop: input.canAccessDesktop !== undefined ? input.canAccessDesktop : true,
        slgOnboardedAt: new Date(),
        slgOnboardedById: input.actorUserId,
      },
    });

    await db.slgAuditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: "EMPLOYEE_ONBOARDED",
        entityType: "User",
        entityId: updated.id,
        details: {
          employeeEmail: updated.email,
          branchId: updated.tenantBranchId,
          departmentId: updated.tenantDepartmentId,
          reportingManagerId: updated.reportingManagerId,
        },
      },
    });

    return updated;
  }

  /**
   * Updates an employee's organizational hierarchy and platform permissions.
   */
  static async updateHierarchy(input: UpdateHierarchyInput) {
    const user = await db.user.findUnique({ where: { id: input.targetUserId } });

    if (!user || user.tenantId !== input.tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found in tenant." });
    }

    if (input.reportingManagerId && input.reportingManagerId === input.targetUserId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Employee cannot report to themselves." });
    }

    const updated = await db.user.update({
      where: { id: input.targetUserId },
      data: {
        tenantBranchId: input.tenantBranchId !== undefined ? input.tenantBranchId : user.tenantBranchId,
        tenantDepartmentId: input.tenantDepartmentId !== undefined ? input.tenantDepartmentId : user.tenantDepartmentId,
        reportingManagerId: input.reportingManagerId !== undefined ? input.reportingManagerId : user.reportingManagerId,
        canAccessMobile: input.canAccessMobile !== undefined ? input.canAccessMobile : user.canAccessMobile,
        canAccessDesktop: input.canAccessDesktop !== undefined ? input.canAccessDesktop : user.canAccessDesktop,
      },
    });

    await db.slgAuditLog.create({
      data: {
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        action: "EMPLOYEE_HIERARCHY_UPDATED",
        entityType: "User",
        entityId: updated.id,
        details: {
          branchId: updated.tenantBranchId,
          departmentId: updated.tenantDepartmentId,
          reportingManagerId: updated.reportingManagerId,
        },
      },
    });

    return updated;
  }

  /**
   * Updates an employee's status (ACTIVE, INACTIVE, SUSPENDED).
   * Immediately revokes active device sessions and hardware registrations when suspended.
   */
  static async updateStatus(tenantId: string, actorUserId: string, targetUserId: string, status: UserStatus) {
    const user = await db.user.findUnique({ where: { id: targetUserId } });

    if (!user || user.tenantId !== tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found in tenant." });
    }

    const updated = await db.user.update({
      where: { id: targetUserId },
      data: { status },
    });

    if (status === UserStatus.SUSPENDED || status === UserStatus.INACTIVE || status === UserStatus.DELETED) {
      await db.userDeviceSession.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await db.slgDeviceRegistration.updateMany({
        where: { userId: targetUserId, status: "ACTIVE" },
        data: {
          status: "REVOKED",
          isAuthorized: false,
          revokedAt: new Date(),
          revokedByUserId: actorUserId,
          revocationReason: `Account status changed to ${status}`,
        },
      });
    }

    await db.slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action: `EMPLOYEE_${status}`,
        entityType: "User",
        entityId: targetUserId,
        details: { previousStatus: user.status, newStatus: status },
      },
    });

    return updated;
  }

  /**
   * Lists onboarded employees with filtering.
   */
  static async listEmployees(tenantId: string, filters: {
    branchId?: string;
    departmentId?: string;
    status?: UserStatus;
    search?: string;
  }) {
    const where: any = { tenantId };

    if (filters.branchId) where.tenantBranchId = filters.branchId;
    if (filters.departmentId) where.tenantDepartmentId = filters.departmentId;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }

    return db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        roleCode: true,
        status: true,
        canAccessMobile: true,
        canAccessDesktop: true,
        slgOnboardedAt: true,
        tenantBranch: { select: { id: true, name: true, code: true } },
        tenantDepartment: { select: { id: true, name: true, code: true } },
        reportingManager: { select: { id: true, firstName: true, lastName: true } },
        staffProfile: { select: { employeeId: true, designation: true } },
      },
    });
  }

  /**
   * Lists existing SoftLab Global users available for onboarding.
   */
  static async listAvailableSlgUsers(tenantId: string) {
    return db.user.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        roleCode: true,
        tenantId: true,
        slgOnboardedAt: true,
        staffProfile: { select: { employeeId: true, designation: true, department: true } },
      },
      orderBy: { firstName: "asc" },
    });
  }
}
