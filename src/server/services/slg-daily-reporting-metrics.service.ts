import { db } from "@/server/db/client";
import { SlgCallStatus } from "@prisma/client";

export class SlgDailyReportingMetricsService {
  /**
   * Automatically calculates tamper-proof verified metrics from database records.
   * Employees cannot artificially inflate or alter these system counts.
   */
  static async getVerifiedMetrics(tenantId: string, userId: string, reportDate: Date) {
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [
      callsTotal,
      callsConnected,
      callsMissed,
      callTalkTimeAgg,
      followUpsCount,
      messagesCount,
      attendanceEvents,
    ] = await Promise.all([
      db.slgCallLog.count({
        where: {
          tenantId,
          userId,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.slgCallLog.count({
        where: {
          tenantId,
          userId,
          callStatus: SlgCallStatus.CONNECTED,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.slgCallLog.count({
        where: {
          tenantId,
          userId,
          callStatus: { in: [SlgCallStatus.MISSED, SlgCallStatus.REJECTED, SlgCallStatus.UNANSWERED] },
        },
      }),
      db.slgCallLog.aggregate({
        where: {
          tenantId,
          userId,
          startedAt: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { talkTimeSeconds: true },
      }),
      db.followUpHistory.count({
        where: {
          performedById: userId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.slgWhatsAppMessage.count({
        where: {
          tenantId,
          direction: "OUTBOUND",
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
      db.attendanceEvent.findMany({
        where: {
          userId,
          timestamp: { gte: startOfDay, lte: endOfDay },
        },
        orderBy: { timestamp: "asc" },
      }),
    ]);

    // Calculate verified attendance minutes from check-in to check-out
    let attendanceMinutes = 0;
    if (attendanceEvents.length >= 2) {
      const firstIn = attendanceEvents.find((e) => e.eventType === "CHECK_IN");
      const lastOut = [...attendanceEvents].reverse().find((e) => e.eventType === "CHECK_OUT");
      if (firstIn && lastOut && lastOut.timestamp > firstIn.timestamp) {
        attendanceMinutes = Math.round((lastOut.timestamp.getTime() - firstIn.timestamp.getTime()) / 60000);
      }
    } else if (attendanceEvents.length === 1 && attendanceEvents[0]?.eventType === "CHECK_IN") {
      const now = new Date();
      const cutoff = now < endOfDay ? now : endOfDay;
      attendanceMinutes = Math.round((cutoff.getTime() - attendanceEvents[0].timestamp.getTime()) / 60000);
    }

    const talkTimeSeconds = callTalkTimeAgg._sum.talkTimeSeconds || 0;

    return {
      systemCallsTotal: callsTotal,
      systemCallsConnected: callsConnected,
      systemCallsMissed: callsMissed,
      systemTalkTimeSeconds: talkTimeSeconds,
      systemTalkTimeFormatted: this.formatSeconds(talkTimeSeconds),
      systemAttendanceMinutes: Math.max(0, attendanceMinutes),
      systemAttendanceFormatted: `${Math.floor(attendanceMinutes / 60)}h ${attendanceMinutes % 60}m`,
      systemFollowUpsCompleted: followUpsCount,
      systemMessagesSent: messagesCount,
    };
  }

  static formatSeconds(secs: number): string {
    if (!secs || secs <= 0) return "0s";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  static formatCsv(reports: any[]): string {
    const headers = [
      "Report ID",
      "Date",
      "Employee Name",
      "Email",
      "Role",
      "Status",
      "Total Calls",
      "Connected Calls",
      "Talk Time (Seconds)",
      "Attendance (Minutes)",
      "Follow-Ups Done",
      "Messages Sent",
      "Work Summary",
      "Tomorrow Plan",
      "Reviewer Feedback",
    ];

    const rows = reports.map((r) => [
      r.id,
      r.reportDate.toISOString().slice(0, 10),
      `"${r.user.firstName} ${r.user.lastName}"`,
      r.user.email,
      r.user.roleCode,
      r.status,
      r.systemCallsTotal,
      r.systemCallsConnected,
      r.systemTalkTimeSeconds,
      r.systemAttendanceMinutes,
      r.systemFollowUpsCompleted,
      r.systemMessagesSent,
      `"${(r.workSummary || "").replace(/"/g, '""')}"`,
      `"${(r.tomorrowActionPlan || "").replace(/"/g, '""')}"`,
      `"${(r.reviewerFeedback || "").replace(/"/g, '""')}"`,
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }
}
