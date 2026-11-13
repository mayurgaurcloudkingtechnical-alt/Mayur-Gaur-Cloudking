import { db } from "@/server/db/client";
import { SlgCallStatus, SlgCallType } from "@prisma/client";

export interface CallAnalyticsFilter {
  tenantId: string;
  branchId?: string;
  departmentId?: string;
  userId?: string;
  provider?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class CallAnalyticsService {
  /**
   * Formats duration in seconds to a compact string (e.g. 1h 24m 30s)
   */
  static formatDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return "0s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  /**
   * Computes comprehensive enterprise call analytics from verified database records
   */
  static async getCallAnalytics(filter: CallAnalyticsFilter) {
    const where: any = { tenantId: filter.tenantId };

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.departmentId) where.departmentId = filter.departmentId;
    if (filter.userId) where.userId = filter.userId;
    if (filter.provider && filter.provider !== "ALL") where.provider = filter.provider;

    if (filter.startDate || filter.endDate) {
      where.startedAt = {};
      if (filter.startDate) where.startedAt.gte = filter.startDate;
      if (filter.endDate) where.startedAt.lte = filter.endDate;
    }

    if (filter.search) {
      where.OR = [
        { customerPhone: { contains: filter.search } },
        { contactName: { contains: filter.search, mode: "insensitive" } },
        { agentPhone: { contains: filter.search } },
        { providerId: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    // 1. High-level aggregates
    const [
      totalCalls,
      connectedCalls,
      missedCalls,
      incomingCalls,
      outgoingCalls,
      unmatchedEmployeeCount,
      unmatchedCustomerCount,
      aggregates,
    ] = await Promise.all([
      db.slgCallLog.count({ where }),
      db.slgCallLog.count({ where: { ...where, callStatus: SlgCallStatus.CONNECTED } }),
      db.slgCallLog.count({ where: { ...where, callStatus: SlgCallStatus.MISSED } }),
      db.slgCallLog.count({ where: { ...where, callType: SlgCallType.INCOMING } }),
      db.slgCallLog.count({ where: { ...where, callType: SlgCallType.OUTGOING } }),
      db.slgCallLog.count({ where: { ...where, isEmployeeMatched: false } }),
      db.slgCallLog.count({ where: { ...where, isCustomerMatched: false } }),
      db.slgCallLog.aggregate({
        where,
        _sum: {
          durationSeconds: true,
          talkTimeSeconds: true,
        },
      }),
    ]);

    const totalDuration = aggregates._sum.durationSeconds || 0;
    const totalTalkTime = aggregates._sum.talkTimeSeconds || 0;
    const unansweredCalls = Math.max(0, totalCalls - (connectedCalls + missedCalls));

    // Average durations
    const averageCallDurationSeconds = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
    const averageHandlingTimeSeconds = connectedCalls > 0 ? Math.round(totalTalkTime / connectedCalls) : 0;
    const connectionRatePercent = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

    // 2. Provider breakdown
    const providerStatsRaw = await db.slgCallLog.groupBy({
      by: ["provider"],
      where,
      _count: { id: true },
      _sum: { talkTimeSeconds: true },
    });

    const providerBreakdown = providerStatsRaw.map((p) => ({
      provider: p.provider || "GENERIC",
      callCount: p._count.id,
      totalTalkTimeSeconds: p._sum.talkTimeSeconds || 0,
      formattedTalkTime: this.formatDuration(p._sum.talkTimeSeconds || 0),
    }));

    // 3. Failed webhook events from Audit Log
    const failedWebhooksCount = await db.slgAuditLog.count({
      where: {
        tenantId: filter.tenantId,
        action: "WEBHOOK_SECURITY_FAILURE",
      },
    });

    // 4. Employee performance breakdown
    const employeeStatsRaw = await db.slgCallLog.groupBy({
      by: ["userId"],
      where,
      _count: { id: true },
      _sum: { talkTimeSeconds: true, durationSeconds: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const userIds = employeeStatsRaw.map((e) => e.userId);
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, roleCode: true },
    });

    const employeePerformance = employeeStatsRaw.map((stat) => {
      const u = users.find((user) => user.id === stat.userId);
      const calls = stat._count.id;
      const talkTime = stat._sum.talkTimeSeconds || 0;
      return {
        userId: stat.userId,
        name: u ? `${u.firstName} ${u.lastName}` : "Unknown Agent",
        roleCode: u?.roleCode || "TELECALLER",
        totalCalls: calls,
        totalTalkTimeSeconds: talkTime,
        formattedTalkTime: this.formatDuration(talkTime),
        averageHandlingTime: calls > 0 ? this.formatDuration(Math.round(talkTime / calls)) : "0s",
      };
    });

    // 5. Recent call timeline
    const recentCalls = await db.slgCallLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        lead: { select: { id: true, fullName: true, phone: true } },
        recording: { select: { id: true, durationSeconds: true, mimeType: true } },
      },
    });

    return {
      kpis: {
        totalCalls,
        connectedCalls,
        missedCalls,
        unansweredCalls,
        incomingCalls,
        outgoingCalls,
        connectionRatePercent,
        totalDurationSeconds: totalDuration,
        formattedTotalDuration: this.formatDuration(totalDuration),
        totalTalkTimeSeconds: totalTalkTime,
        formattedTotalTalkTime: this.formatDuration(totalTalkTime),
        averageCallDurationSeconds,
        formattedAverageCallDuration: this.formatDuration(averageCallDurationSeconds),
        averageHandlingTimeSeconds,
        formattedAverageHandlingTime: this.formatDuration(averageHandlingTimeSeconds),
        unmatchedEmployeeCount,
        unmatchedCustomerCount,
        failedWebhooksCount,
      },
      providerBreakdown,
      employeePerformance,
      recentCalls,
    };
  }
}
