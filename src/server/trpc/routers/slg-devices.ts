import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode } from "@prisma/client";
import { SlgDeviceManagementService } from "@/server/services/slg-device-management.service";
import { TRPCError } from "@trpc/server";

const supervisoryRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.HR,
];

const adminRoles = [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN];

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

export const slgDevicesRouter = router({
  /**
   * Registers a hardware device. Defaults to PENDING_APPROVAL.
   */
  registerDevice: protectedProcedure
    .input(
      z.object({
        deviceUuid: z.string().min(5),
        deviceName: z.string().optional(),
        deviceType: z.string().optional(),
        deviceModel: z.string().optional(),
        osVersion: z.string().optional(),
        appVersion: z.string().optional(),
        deviceFingerprint: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);

      return SlgDeviceManagementService.registerOrHeartbeat({
        tenantId,
        userId: user.id,
        deviceUuid: input.deviceUuid,
        deviceName: input.deviceName,
        deviceType: input.deviceType,
        deviceModel: input.deviceModel,
        osVersion: input.osVersion,
        appVersion: input.appVersion,
        deviceFingerprint: input.deviceFingerprint,
      });
    }),

  /**
   * Lists devices within the tenant with status and search filters.
   */
  listTenantDevices: requireRoleProcedure(supervisoryRoles)
    .input(
      z
        .object({
          status: z.string().optional(),
          deviceType: z.string().optional(),
          branchId: z.string().optional(),
          departmentId: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenant(ctx);
      return SlgDeviceManagementService.listTenantDevices(tenantId, input);
    }),

  /**
   * Approves a pending hardware device (transitions to ACTIVE).
   */
  approveDevice: requireRoleProcedure(adminRoles)
    .input(z.object({ deviceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      return SlgDeviceManagementService.approveDevice(tenantId, user.id, input.deviceId);
    }),

  /**
   * Rejects a pending hardware device registration.
   */
  rejectDevice: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        deviceId: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      return SlgDeviceManagementService.rejectDevice(tenantId, user.id, input.deviceId, input.reason);
    }),

  /**
   * Revokes authorization from an active hardware device.
   */
  revokeDevice: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        deviceId: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      return SlgDeviceManagementService.revokeDevice(tenantId, user.id, input.deviceId, input.reason);
    }),

  /**
   * Permanently blocks a compromised device hardware UUID.
   */
  blockDevice: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        deviceId: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      return SlgDeviceManagementService.blockDevice(tenantId, user.id, input.deviceId, input.reason);
    }),

  /**
   * Replaces an existing employee device with newly registered hardware.
   */
  replaceDevice: requireRoleProcedure(adminRoles)
    .input(
      z.object({
        userId: z.string().min(1),
        oldDeviceId: z.string().min(1),
        newDeviceId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tenantId, user } = assertTenant(ctx);
      return SlgDeviceManagementService.replaceDevice({
        tenantId,
        actorUserId: user.id,
        userId: input.userId,
        oldDeviceId: input.oldDeviceId,
        newDeviceId: input.newDeviceId,
      });
    }),

  /**
   * Retrieves security audit and synchronization history for a device.
   */
  getDeviceHistory: requireRoleProcedure(supervisoryRoles)
    .input(z.object({ deviceId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const { tenantId } = assertTenant(ctx);
      return SlgDeviceManagementService.getDeviceHistory(tenantId, input.deviceId);
    }),
});
