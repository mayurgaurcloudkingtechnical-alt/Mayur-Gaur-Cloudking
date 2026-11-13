import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { UserRoleCode } from "@prisma/client";

export type OrganizationalScopeTier = "TENANT" | "BRANCH" | "DEPARTMENT" | "HIERARCHY" | "SELF";

export interface UserScopeContext {
  id: string;
  tenantId: string;
  roleCode: UserRoleCode;
  tenantBranchId?: string | null;
  tenantDepartmentId?: string | null;
  permissions?: string[];
}

export class SlgRbacService {
  /**
   * Evaluates the organizational scope tier of a user.
   */
  static getScopeTier(user: UserScopeContext): OrganizationalScopeTier {
    if (
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.ADMIN
    ) {
      return "TENANT";
    }

    if (user.roleCode === UserRoleCode.HR) {
      return "DEPARTMENT";
    }

    if (user.roleCode === UserRoleCode.MANAGER) {
      // Check if user is branch manager or department manager
      if (user.tenantBranchId && !user.tenantDepartmentId) {
        return "BRANCH";
      }
      if (user.tenantDepartmentId && !user.tenantBranchId) {
        return "DEPARTMENT";
      }
      return "HIERARCHY"; // Team leader / sales manager
    }

    return "SELF";
  }

  /**
   * Recursively computes all direct and indirect subordinate user IDs.
   */
  static async getSubordinateUserIds(managerUserId: string): Promise<string[]> {
    const directReports = await db.user.findMany({
      where: { reportingManagerId: managerUserId },
      select: { id: true },
    });

    const directIds = directReports.map((r) => r.id);
    let allSubordinateIds = [...directIds];

    for (const reportId of directIds) {
      const nested = await this.getSubordinateUserIds(reportId);
      allSubordinateIds = allSubordinateIds.concat(nested);
    }

    return Array.from(new Set(allSubordinateIds));
  }

  /**
   * Builds the authoritative Prisma filter for scoped data queries (calls, reports, devices).
   */
  static async resolveDataFilter(user: UserScopeContext): Promise<Record<string, any>> {
    if (!user.tenantId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User is not associated with an active tenant.",
      });
    }

    const tier = this.getScopeTier(user);

    switch (tier) {
      case "TENANT":
        return { tenantId: user.tenantId };

      case "BRANCH":
        return {
          tenantId: user.tenantId,
          ...(user.tenantBranchId ? { branchId: user.tenantBranchId } : {}),
        };

      case "DEPARTMENT":
        return {
          tenantId: user.tenantId,
          ...(user.tenantDepartmentId ? { departmentId: user.tenantDepartmentId } : {}),
        };

      case "HIERARCHY": {
        const subordinateIds = await this.getSubordinateUserIds(user.id);
        return {
          tenantId: user.tenantId,
          userId: { in: [user.id, ...subordinateIds] },
        };
      }

      case "SELF":
      default:
        return {
          tenantId: user.tenantId,
          userId: user.id,
        };
    }
  }

  /**
   * Asserts whether an actor can view or manage a target employee's records.
   */
  static async assertCanManageEmployee(actor: UserScopeContext, targetUserId: string): Promise<boolean> {
    if (actor.id === targetUserId) {
      return true;
    }

    const tier = this.getScopeTier(actor);

    if (tier === "TENANT") {
      const targetUser = await db.user.findUnique({
        where: { id: targetUserId },
        select: { tenantId: true },
      });
      if (!targetUser || targetUser.tenantId !== actor.tenantId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Employee does not belong to your tenant.",
        });
      }
      return true;
    }

    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        tenantId: true,
        tenantBranchId: true,
        tenantDepartmentId: true,
        reportingManagerId: true,
      },
    });

    if (!target || target.tenantId !== actor.tenantId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Employee does not belong to your tenant.",
      });
    }

    if (tier === "BRANCH") {
      if (target.tenantBranchId !== actor.tenantBranchId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee does not belong to your assigned branch.",
        });
      }
      return true;
    }

    if (tier === "DEPARTMENT") {
      if (target.tenantDepartmentId !== actor.tenantDepartmentId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee does not belong to your assigned department.",
        });
      }
      return true;
    }

    if (tier === "HIERARCHY") {
      const subordinates = await this.getSubordinateUserIds(actor.id);
      if (!subordinates.includes(targetUserId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Employee is not in your direct or indirect reporting tree.",
        });
      }
      return true;
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions to manage this employee.",
    });
  }

  /**
   * Asserts branch access permission.
   */
  static assertBranchAccess(user: UserScopeContext, branchId: string): void {
    const tier = this.getScopeTier(user);
    if (tier === "TENANT") return;

    if (tier === "BRANCH" && user.tenantBranchId === branchId) return;

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this branch campus is restricted.",
    });
  }
}
