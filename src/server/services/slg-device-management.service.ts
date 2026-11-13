import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { SlgDeviceAuditService } from "./slg-device-audit.service";

export interface RegisterDeviceInput {
  tenantId: string;
  userId: string;
  deviceUuid: string;
  deviceName?: string;
  deviceType?: string;
  deviceModel?: string;
  osVersion?: string;
  appVersion?: string;
  deviceFingerprint?: string;
}

export interface ListDevicesFilter {
  status?: string;
  deviceType?: string;
  branchId?: string;
  departmentId?: string;
  search?: string;
}

export class SlgDeviceManagementService {
  /**
   * Registers a device or updates its heartbeat.
   * New devices default to status: PENDING_APPROVAL and isAuthorized: false.
   */
  static async registerOrHeartbeat(input: RegisterDeviceInput) {
    const existing = await db.slgDeviceRegistration.findUnique({
      where: { deviceUuid: input.deviceUuid },
    });

    if (existing) {
      if (existing.status === "BLOCKED") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This device hardware has been permanently blocked by administration.",
        });
      }

      if (existing.userId !== input.userId) {
        const alerts = (existing.suspiciousActivityAlerts as any[]) || [];
        alerts.push({
          timestamp: new Date().toISOString(),
          type: "HIJACK_ATTEMPT",
          attemptedByUserId: input.userId,
          message: "Unauthorized employee attempted to register existing hardware.",
        });

        await db.slgDeviceRegistration.update({
          where: { id: existing.id },
          data: { suspiciousActivityAlerts: alerts },
        });

        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This device hardware identifier is registered to another employee. Access denied.",
        });
      }

      return db.slgDeviceRegistration.update({
        where: { id: existing.id },
        data: {
          lastSeenAt: new Date(),
          deviceName: input.deviceName || existing.deviceName,
          deviceModel: input.deviceModel || existing.deviceModel,
          osVersion: input.osVersion || existing.osVersion,
          appVersion: input.appVersion || existing.appVersion,
          deviceFingerprint: input.deviceFingerprint || existing.deviceFingerprint,
        },
      });
    }

    const created = await db.slgDeviceRegistration.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        deviceUuid: input.deviceUuid,
        deviceName: input.deviceName || input.deviceModel || "Mobile Client",
        deviceType: input.deviceType || "ANDROID",
        deviceModel: input.deviceModel || "Unknown Device",
        osVersion: input.osVersion || "Android",
        appVersion: input.appVersion || "1.0.0",
        deviceFingerprint: input.deviceFingerprint || null,
        status: "PENDING_APPROVAL",
        isAuthorized: false,
        lastSeenAt: new Date(),
      },
    });

    await SlgDeviceAuditService.logAction(input.tenantId, input.userId, "DEVICE_REGISTERED_PENDING", created.id, {
      deviceUuid: input.deviceUuid,
      model: input.deviceModel,
      fingerprint: input.deviceFingerprint,
    });

    return created;
  }

  /**
   * Approves a pending device, transitioning it to ACTIVE.
   */
  static async approveDevice(tenantId: string, approverUserId: string, deviceId: string) {
    const device = await db.slgDeviceRegistration.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.tenantId !== tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Device registration not found." });
    }

    if (device.status === "BLOCKED") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Blocked device cannot be approved directly." });
    }

    const updated = await db.slgDeviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: "ACTIVE",
        isAuthorized: true,
        approvedAt: new Date(),
        approvedByUserId: approverUserId,
      },
    });

    await SlgDeviceAuditService.logAction(tenantId, approverUserId, "DEVICE_APPROVED", device.id, {
      targetUserId: device.userId,
      deviceUuid: device.deviceUuid,
      model: device.deviceModel,
    });

    return updated;
  }

  /**
   * Rejects a pending device registration.
   */
  static async rejectDevice(tenantId: string, actorUserId: string, deviceId: string, reason?: string) {
    return this.revokeDevice(tenantId, actorUserId, deviceId, reason || "Registration rejected by administrator");
  }

  /**
   * Revokes authorization from a device.
   */
  static async revokeDevice(tenantId: string, revokerUserId: string, deviceId: string, reason?: string) {
    const device = await db.slgDeviceRegistration.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.tenantId !== tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Device registration not found." });
    }

    const updated = await db.slgDeviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: "REVOKED",
        isAuthorized: false,
        revokedAt: new Date(),
        revokedByUserId: revokerUserId,
        revocationReason: reason || "Revoked by administrator",
      },
    });

    await SlgDeviceAuditService.logAction(tenantId, revokerUserId, "DEVICE_REVOKED", device.id, {
      targetUserId: device.userId,
      deviceUuid: device.deviceUuid,
      reason: reason || "Revoked by administrator",
    });

    return updated;
  }

  /**
   * Permanently blocks a suspicious or stolen device hardware UUID.
   */
  static async blockDevice(tenantId: string, actorUserId: string, deviceId: string, reason?: string) {
    const device = await db.slgDeviceRegistration.findUnique({
      where: { id: deviceId },
    });

    if (!device || device.tenantId !== tenantId) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Device registration not found." });
    }

    const updated = await db.slgDeviceRegistration.update({
      where: { id: deviceId },
      data: {
        status: "BLOCKED",
        isAuthorized: false,
        revokedAt: new Date(),
        revokedByUserId: actorUserId,
        revocationReason: reason || "Hardware blocked for security violation",
      },
    });

    await SlgDeviceAuditService.logAction(tenantId, actorUserId, "DEVICE_BLOCKED", device.id, {
      targetUserId: device.userId,
      deviceUuid: device.deviceUuid,
      reason: reason || "Hardware blocked for security violation",
    });

    return updated;
  }

  /**
   * Device replacement workflow: retires old device and approves new device.
   */
  static async replaceDevice(params: {
    tenantId: string;
    actorUserId: string;
    userId: string;
    oldDeviceId: string;
    newDeviceId: string;
  }) {
    const oldDev = await db.slgDeviceRegistration.findUnique({ where: { id: params.oldDeviceId } });
    const newDev = await db.slgDeviceRegistration.findUnique({ where: { id: params.newDeviceId } });

    if (!oldDev || oldDev.userId !== params.userId || !newDev || newDev.userId !== params.userId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid device replacement pairing." });
    }

    await this.revokeDevice(
      params.tenantId,
      params.actorUserId,
      params.oldDeviceId,
      `Replaced by new device ${newDev.deviceUuid}`
    );

    return this.approveDevice(params.tenantId, params.actorUserId, params.newDeviceId);
  }

  /**
   * Records synchronization heartbeat and validates device status.
   */
  static async recordSync(deviceUuid: string) {
    const device = await db.slgDeviceRegistration.findUnique({
      where: { deviceUuid },
    });

    if (!device) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Device is not registered." });
    }

    if (device.status !== "ACTIVE" || !device.isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Device is not authorized for synchronization (current status: ${device.status}).`,
      });
    }

    return db.slgDeviceRegistration.update({
      where: { id: device.id },
      data: {
        lastSeenAt: new Date(),
        lastSyncAt: new Date(),
      },
    });
  }

  /**
   * Lists devices registered under a tenant with filtering.
   */
  static async listTenantDevices(tenantId: string, filter?: ListDevicesFilter) {
    const where: any = { tenantId };

    if (filter?.status) where.status = filter.status;
    if (filter?.deviceType) where.deviceType = filter.deviceType;
    if (filter?.branchId) where.user = { tenantBranchId: filter.branchId };
    if (filter?.departmentId) {
      where.user = { ...(where.user || {}), tenantDepartmentId: filter.departmentId };
    }
    if (filter?.search) {
      where.OR = [
        { deviceUuid: { contains: filter.search, mode: "insensitive" } },
        { deviceName: { contains: filter.search, mode: "insensitive" } },
        { deviceModel: { contains: filter.search, mode: "insensitive" } },
        { user: { firstName: { contains: filter.search, mode: "insensitive" } } },
        { user: { lastName: { contains: filter.search, mode: "insensitive" } } },
        { user: { email: { contains: filter.search, mode: "insensitive" } } },
      ];
    }

    return db.slgDeviceRegistration.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roleCode: true,
            tenantBranch: { select: { id: true, name: true, code: true } },
            tenantDepartment: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  /**
   * Fetches audit history for a device.
   */
  static async getDeviceHistory(tenantId: string, deviceId: string) {
    return SlgDeviceAuditService.getDeviceHistory(tenantId, deviceId);
  }
}
