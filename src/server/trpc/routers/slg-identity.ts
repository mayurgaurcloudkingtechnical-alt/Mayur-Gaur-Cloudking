import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode, UserStatus } from "@prisma/client";
import { SlgIdentityService } from "@/server/services/slg-identity.service";
import { SlgRbacService } from "@/server/services/slg-rbac.service";
import { TRPCError } from "@trpc/server";

const adminRoles = [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN];
const onboardingRoles = [...adminRoles, UserRoleCode.HR];

function assertTenant(ctx: { user: any }) {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required." });
  }
  const tenantId = ctx.user.tenantId;
  if (!tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access Denied: User is not assigned to an active tenant organization.",
    });
  }
  return { tenantId, user: ctx.user };
}

export const slgIdentityRouter = router({
  /**
   * Retrieves comprehensive profile and organizational context for an employee.
   * Telecallers/Counselors can only view self; Managers can view their reporting tree.
   */
  getEmployeeProfile: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      const targetUserId = input?.userId || user.id;

      // Enforce server-side boundary check
      await SlgRbacService.assertCanManageEmployee(
        {
          id: user.id,
          tenantId,
          roleCode: user.roleCode,
          tenantBranchId: user.tenantBranchId,
          tenantDepartmentId: user.tenantDepartmentId,
        },
        targetUserId
      );

      return SlgIdentityService.getEmployeeProfile(tenantId, targetUserId);
    }),

  /**
   * Onboards an existing SOFTLAB GLOBAL employee into Call Intelligence.
   */
  onboardEmployee: requireRoleProcedure(onboardingRoles)
    .input(
      z.object({
        targetUserId: z.string().min(1),
        tenantBranchId: z.string().optional(),
        tenantDepartmentId: z.string().optional(),
        reportingManagerId: z.string().optional(),
        canAccessMobile: z.boolean().optional(),
        canAccessDesktop: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);

      return SlgIdentityService.onboardEmployee({
        tenantId,
        actorUserId: user.id,
        targetUserId: input.targetUserId,
        tenantBranchId: input.tenantBranchId,
        tenantDepartmentId: input.tenantDepartmentId,
        reportingManagerId: input.reportingManagerId,
        canAccessMobile: input.canAccessMobile,
        canAccessDesktop: input.canAccessDesktop,
      });
    }),

  /**
   * Updates an employee's organizational placement and application access.
   */
  updateHierarchy: requireRoleProcedure(onboardingRoles)
    .input(
      z.object({
        targetUserId: z.string().min(1),
        tenantBranchId: z.string().nullable().optional(),
        tenantDepartmentId: z.string().nullable().optional(),
        reportingManagerId: z.string().nullable().optional(),
        canAccessMobile: z.boolean().optional(),
        canAccessDesktop: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);

      await SlgRbacService.assertCanManageEmployee(
        {
          id: user.id,
          tenantId,
          roleCode: user.roleCode,
          tenantBranchId: user.tenantBranchId,
          tenantDepartmentId: user.tenantDepartmentId,
        },
        input.targetUserId
      );

      return SlgIdentityService.updateHierarchy({
        tenantId,
        actorUserId: user.id,
        targetUserId: input.targetUserId,
        tenantBranchId: input.tenantBranchId,
        tenantDepartmentId: input.tenantDepartmentId,
        reportingManagerId: input.reportingManagerId,
        canAccessMobile: input.canAccessMobile,
        canAccessDesktop: input.canAccessDesktop,
      });
    }),

  /**
   * Updates employee account status (ACTIVE, INACTIVE, SUSPENDED).
   * Automatically revokes sessions and hardware on suspension.
   */
  updateEmployeeStatus: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        targetUserId: z.string().min(1),
        status: z.nativeEnum(UserStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);

      if (input.targetUserId === user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Administrators cannot suspend their own active accounts.",
        });
      }

      return SlgIdentityService.updateStatus(tenantId, user.id, input.targetUserId, input.status);
    }),

  /**
   * Lists employees within the tenant, filtered according to caller's RBAC scope.
   */
  listEmployees: protectedProcedure
    .input(
      z.object({
        branchId: z.string().optional(),
        departmentId: z.string().optional(),
        status: z.nativeEnum(UserStatus).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);

      const scopeTier = SlgRbacService.getScopeTier({
        id: user.id,
        tenantId,
        roleCode: user.roleCode,
        tenantBranchId: user.tenantBranchId,
        tenantDepartmentId: user.tenantDepartmentId,
      });

      // Enforce branch/department filters based on caller scope
      const effectiveBranchId = scopeTier === "BRANCH" ? user.tenantBranchId || undefined : input.branchId;
      const effectiveDeptId = scopeTier === "DEPARTMENT" ? user.tenantDepartmentId || undefined : input.departmentId;

      return SlgIdentityService.listEmployees(tenantId, {
        branchId: effectiveBranchId,
        departmentId: effectiveDeptId,
        status: input.status,
        search: input.search,
      });
    }),

  /**
   * Lists existing SOFTLAB GLOBAL users eligible for Call Intelligence onboarding.
   */
  listAvailableUsers: requireRoleProcedure(onboardingRoles).query(async ({ ctx }) => {
    const { tenantId } = assertTenant(ctx);
    return SlgIdentityService.listAvailableSlgUsers(tenantId);
  }),
});
