import { db } from "@/server/db/client";
import { Prisma } from "@prisma/client";

export interface LogAuditParams {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  previousData?: Prisma.InputJsonValue | null;
  newData?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Logs an immutable security or business mutation event into PostgreSQL.
   */
  static async log(params: LogAuditParams) {
    try {
      return await db.auditLog.create({
        data: {
          actorId: params.actorId ?? null,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          previousData: params.previousData ?? undefined,
          newData: params.newData ?? undefined,
          ipAddress: params.ipAddress ?? null,
          userAgent: params.userAgent ?? null,
        },
      });
    } catch (error) {
      // In production, fallback to structured console logging so audit failure does not crash transactions
      console.error("[AuditService] Failed to persist audit log:", error);
      return null;
    }
  }

  /**
   * Retrieves recent audit logs for system administrators.
   */
  static async getRecentLogs(limit = 50, resourceType?: string) {
    return db.auditLog.findMany({
      where: resourceType ? { resourceType } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roleCode: true,
          },
        },
      },
    });
  }
}
