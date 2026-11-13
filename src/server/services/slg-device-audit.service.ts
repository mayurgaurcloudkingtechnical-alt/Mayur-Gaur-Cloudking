import { db } from "@/server/db/client";

export class SlgDeviceAuditService {
  static async logAction(
    tenantId: string,
    actorUserId: string,
    action: string,
    deviceId: string,
    details: Record<string, any>
  ) {
    return db.slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action,
        entityType: "SlgDeviceRegistration",
        entityId: deviceId,
        details,
      },
    });
  }

  static async getDeviceHistory(tenantId: string, deviceId: string) {
    return db.slgAuditLog.findMany({
      where: {
        tenantId,
        entityType: "SlgDeviceRegistration",
        entityId: deviceId,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        actorUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }
}
