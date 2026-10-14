import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface LogCallInput {
  contactName: string;
  contactPhone: string;
  callType?: "OUTGOING" | "INCOMING" | "MISSED" | "REJECTED";
  callStatus?: "CONNECTED" | "BUSY" | "NO_ANSWER" | "FAILED";
  disposition: string; // "INTERESTED", "ADMISSION_CONFIRMED", "CALLBACK", "FOLLOW_UP", "NOT_INTERESTED", "BUSY_NO_ANSWER", "WRONG_NUMBER", "ENQUIRY_RESOLVED"
  durationSeconds: number;
  notes?: string;
  nextFollowUpDate?: Date;
  leadId?: string;
}

export interface UpdateLiveStatusInput {
  status: "AVAILABLE" | "ON_CALL" | "ON_BREAK" | "WRAP_UP" | "OFFLINE";
  currentCallContact?: string;
  currentCallPhone?: string;
  breakReason?: string;
}

export class StaffCallyzerService {
  /**
   * Helper to format seconds into "Xh Ym Zs"
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
   * Get or initialize a staff member's live presence session
   */
  static async getOrCreateLiveSession(userId: string) {
    let session = await db.staffLiveSession.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            roleCode: true,
            staffProfile: {
              select: {
                id: true,
                employeeId: true,
                department: true,
                designation: true,
                branch: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { staffProfile: true },
      });

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      session = await db.staffLiveSession.create({
        data: {
          userId,
          staffProfileId: user.staffProfile?.id || null,
          roleCode: user.roleCode,
          department: user.staffProfile?.department || null,
          status: "AVAILABLE",
          dailyTargetCalls: 50,
          todayCallsCount: 0,
          todayTalkTimeSeconds: 0,
          todayConnectedCount: 0,
          todayConversionsCount: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              roleCode: true,
              staffProfile: {
                select: {
                  id: true,
                  employeeId: true,
                  department: true,
                  designation: true,
                  branch: true,
                },
              },
            },
          },
        },
      });
    }

    return session;
  }

  /**
   * Update live state (Available, On Call, Break, Offline)
   */
  static async updateLiveStatus(userId: string, input: UpdateLiveStatusInput) {
    await this.getOrCreateLiveSession(userId);

    const now = new Date();
    const dataToUpdate: any = {
      status: input.status,
      lastActiveAt: now,
    };

    if (input.status === "ON_CALL") {
      dataToUpdate.currentCallContact = input.currentCallContact || null;
      dataToUpdate.currentCallPhone = input.currentCallPhone || null;
      dataToUpdate.currentCallStartedAt = now;
      dataToUpdate.breakReason = null;
      dataToUpdate.breakStartedAt = null;
    } else if (input.status === "ON_BREAK") {
      dataToUpdate.breakReason = input.breakReason || "Short Break";
      dataToUpdate.breakStartedAt = now;
      dataToUpdate.currentCallContact = null;
      dataToUpdate.currentCallPhone = null;
      dataToUpdate.currentCallStartedAt = null;
    } else {
      // AVAILABLE, OFFLINE, WRAP_UP
      dataToUpdate.currentCallContact = null;
      dataToUpdate.currentCallPhone = null;
      dataToUpdate.currentCallStartedAt = null;
      dataToUpdate.breakReason = null;
      dataToUpdate.breakStartedAt = null;
    }

    const updated = await db.staffLiveSession.update({
      where: { userId },
      data: dataToUpdate,
    });

    return updated;
  }

  /**
   * Log an outgoing or incoming call with complete disposition and duration
   */
  static async logCallActivity(userId: string, input: LogCallInput) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: { staffProfile: true },
    });
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

    // Try finding lead by ID or phone if leadId not passed
    let matchedLeadId = input.leadId || null;
    if (!matchedLeadId && input.contactPhone) {
      const cleanPhone = input.contactPhone.replace(/\D/g, "").slice(-10);
      const existingLead = await db.lead.findFirst({
        where: { phone: { contains: cleanPhone } },
        select: { id: true },
      });
      if (existingLead) matchedLeadId = existingLead.id;
    }

    // 1. Create StaffCallLog
    const callLog = await db.staffCallLog.create({
      data: {
        userId,
        staffProfileId: user.staffProfile?.id || null,
        leadId: matchedLeadId,
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone.trim(),
        callType: input.callType || "OUTGOING",
        callStatus: input.callStatus || "CONNECTED",
        disposition: input.disposition,
        durationSeconds: Math.max(0, input.durationSeconds || 0),
        notes: input.notes?.trim() || null,
        nextFollowUpDate: input.nextFollowUpDate || null,
        roleCode: user.roleCode,
      },
    });

    // 2. Synchronize with Lead Activity and Follow-up if lead linked
    if (matchedLeadId) {
      await db.leadActivity.create({
        data: {
          leadId: matchedLeadId,
          userId,
          activityType: "CALL_CONNECTED",
          disposition: input.disposition,
          notes: `[Callyzer Call Log: ${this.formatDuration(input.durationSeconds)}] ${input.notes || ""}`.trim(),
        },
      });

      if (input.nextFollowUpDate) {
        await db.followUpHistory.create({
          data: {
            leadId: matchedLeadId,
            type: "CALL",
            notes: input.notes?.trim() || `Follow-up scheduled after call disposition: ${input.disposition}`,
            nextFollowUpDate: input.nextFollowUpDate,
            performedById: userId,
          },
        });

        await db.lead.update({
          where: { id: matchedLeadId },
          data: {
            nextFollowUp: input.nextFollowUpDate,
            lastInteraction: new Date(),
          },
        });
      }

      // Update lead temperature and status based on disposition
      if (input.disposition === "ADMISSION_CONFIRMED") {
        await db.lead.update({
          where: { id: matchedLeadId },
          data: { status: "ADMISSION_DONE" as any, temperature: "HOT" },
        }).catch(() => null);
      } else if (input.disposition === "INTERESTED") {
        await db.lead.update({
          where: { id: matchedLeadId },
          data: { temperature: "HOT" },
        }).catch(() => null);
      }
    }

    // 3. Update StaffLiveSession counters
    const isConnected = input.callStatus === "CONNECTED" || input.durationSeconds > 0;
    const isConversion = ["ADMISSION_CONFIRMED", "INTERESTED"].includes(input.disposition);

    await db.staffLiveSession.upsert({
      where: { userId },
      create: {
        userId,
        staffProfileId: user.staffProfile?.id || null,
        roleCode: user.roleCode,
        department: user.staffProfile?.department || null,
        status: "AVAILABLE",
        dailyTargetCalls: 50,
        todayCallsCount: 1,
        todayTalkTimeSeconds: input.durationSeconds,
        todayConnectedCount: isConnected ? 1 : 0,
        todayConversionsCount: isConversion ? 1 : 0,
        lastActiveAt: new Date(),
      },
      update: {
        todayCallsCount: { increment: 1 },
        todayTalkTimeSeconds: { increment: input.durationSeconds },
        todayConnectedCount: { increment: isConnected ? 1 : 0 },
        todayConversionsCount: { increment: isConversion ? 1 : 0 },
        status: "AVAILABLE",
        currentCallContact: null,
        currentCallPhone: null,
        currentCallStartedAt: null,
        lastActiveAt: new Date(),
      },
    });

    return callLog;
  }

  /**
   * Callyzer Live Team Monitoring Dashboard (For Super Admin, Director, Admin, Manager)
   * Real-time view filtered Post-wise / Role-wise
   */
  static async getLiveTeamMonitoring(filterRole?: string, search?: string) {
    const rolesToMonitor: UserRoleCode[] = [
      UserRoleCode.COUNSELOR,
      UserRoleCode.TELECALLER,
      UserRoleCode.ADMIN,
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.DIRECTOR,
    ];

    // Today's boundaries in UTC / Local
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const whereUser: any = {
      roleCode: filterRole && filterRole !== "ALL" ? (filterRole as UserRoleCode) : { in: rolesToMonitor },
      status: "ACTIVE",
    };

    if (search && search.trim()) {
      whereUser.OR = [
        { firstName: { contains: search.trim(), mode: "insensitive" } },
        { lastName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim() } },
      ];
    }

    const users = await db.user.findMany({
      where: whereUser,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        roleCode: true,
        callingNumber: true,
        whatsappNumber: true,
        staffProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            branch: true,
            workLocation: true,
          },
        },
        staffLiveSession: true,
        staffCallLogs: {
          where: {
            createdAt: { gte: startOfToday, lte: endOfToday },
          },
          select: {
            id: true,
            contactName: true,
            contactPhone: true,
            callType: true,
            callStatus: true,
            disposition: true,
            durationSeconds: true,
            notes: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { firstName: "asc" },
    });

    const now = new Date();

    // Map each staff member to a rich Callyzer monitoring record
    const staffList = users.map((u: any) => {
      const todayLogs = u.staffCallLogs || [];
      const totalCallsToday = todayLogs.length;
      const totalTalkTimeSeconds = todayLogs.reduce((acc: number, curr: any) => acc + (curr.durationSeconds || 0), 0);
      const connectedCalls = todayLogs.filter((c: any) => c.callStatus === "CONNECTED" || (c.durationSeconds && c.durationSeconds > 0)).length;
      const conversions = todayLogs.filter((c: any) => ["ADMISSION_CONFIRMED", "INTERESTED"].includes(c.disposition)).length;
      const avgDurationSeconds = totalCallsToday > 0 ? Math.round(totalTalkTimeSeconds / totalCallsToday) : 0;

      // Determine live state
      const session = u.staffLiveSession;
      let liveStatus = session?.status || "AVAILABLE";
      let currentCallDuration = 0;
      let breakDuration = 0;

      if (session?.status === "ON_CALL" && session.currentCallStartedAt) {
        currentCallDuration = Math.max(0, Math.floor((now.getTime() - new Date(session.currentCallStartedAt).getTime()) / 1000));
      } else if (session?.status === "ON_BREAK" && session.breakStartedAt) {
        breakDuration = Math.max(0, Math.floor((now.getTime() - new Date(session.breakStartedAt).getTime()) / 1000));
      }

      // Inactivity check: if no activity for 30 mins and not on call, consider idle
      const lastActiveAt = session?.lastActiveAt || u.staffCallLogs?.[0]?.createdAt || null;
      let idleMinutes = 0;
      if (lastActiveAt && liveStatus !== "ON_CALL") {
        idleMinutes = Math.max(0, Math.floor((now.getTime() - new Date(lastActiveAt).getTime()) / 60000));
      }

      const dailyTarget = session?.dailyTargetCalls || 50;
      const targetProgressPercent = Math.min(100, Math.round((totalCallsToday / dailyTarget) * 100));

      return {
        userId: u.id,
        fullName: `${u.firstName} ${u.lastName}`,
        email: u.email,
        phone: u.callingNumber || u.phone || "—",
        avatarUrl: u.avatarUrl,
        roleCode: u.roleCode,
        employeeId: u.staffProfile?.employeeId || `SLG-${u.roleCode.slice(0, 3)}-${u.id.slice(0, 4)}`,
        department: u.staffProfile?.department || "ADMISSIONS",
        designation: u.staffProfile?.designation || u.roleCode,
        branch: u.staffProfile?.branch || "PRAYAGRAJ_MAIN",
        liveStatus,
        currentCallContact: session?.currentCallContact || null,
        currentCallPhone: session?.currentCallPhone || null,
        currentCallDurationSeconds: currentCallDuration,
        currentCallDurationFormatted: this.formatDuration(currentCallDuration),
        breakReason: session?.breakReason || null,
        breakDurationSeconds: breakDuration,
        breakDurationFormatted: this.formatDuration(breakDuration),
        idleMinutes,
        lastActiveAt,
        dailyTarget,
        todayCallsCount: totalCallsToday,
        targetProgressPercent,
        todayTalkTimeSeconds: totalTalkTimeSeconds,
        todayTalkTimeFormatted: this.formatDuration(totalTalkTimeSeconds),
        todayConnectedCount: connectedCalls,
        todayConversionsCount: conversions,
        avgDurationSeconds,
        avgDurationFormatted: this.formatDuration(avgDurationSeconds),
        recentCalls: todayLogs.slice(0, 5),
      };
    });

    // High-Level Live Summary Counters
    const totalStaffCount = staffList.length;
    const currentlyOnCall = staffList.filter((s) => s.liveStatus === "ON_CALL").length;
    const currentlyAvailable = staffList.filter((s) => s.liveStatus === "AVAILABLE").length;
    const currentlyOnBreak = staffList.filter((s) => s.liveStatus === "ON_BREAK").length;
    const currentlyOffline = staffList.filter((s) => s.liveStatus === "OFFLINE").length;

    const totalTeamCallsToday = staffList.reduce((acc, s) => acc + s.todayCallsCount, 0);
    const totalTeamTalkTimeSeconds = staffList.reduce((acc, s) => acc + s.todayTalkTimeSeconds, 0);
    const totalTeamConnected = staffList.reduce((acc, s) => acc + s.todayConnectedCount, 0);
    const totalTeamConversions = staffList.reduce((acc, s) => acc + s.todayConversionsCount, 0);
    const teamConnectionRate = totalTeamCallsToday > 0 ? Math.round((totalTeamConnected / totalTeamCallsToday) * 100) : 0;

    // Role-wise breakdowns (Counselors vs Telecallers vs Marketing)
    const counselorStats = staffList.filter((s) => s.roleCode === "COUNSELOR");
    const telecallerStats = staffList.filter((s) => s.roleCode === "TELECALLER");
    const marketingStats = staffList.filter((s) => ["ADMIN", "MANAGER", "DIRECTOR"].includes(s.roleCode));

    return {
      summary: {
        totalStaffCount,
        currentlyOnCall,
        currentlyAvailable,
        currentlyOnBreak,
        currentlyOffline,
        totalTeamCallsToday,
        totalTeamTalkTimeSeconds,
        totalTeamTalkTimeFormatted: this.formatDuration(totalTeamTalkTimeSeconds),
        totalTeamConnected,
        totalTeamConversions,
        teamConnectionRate,
      },
      roleBreakdowns: {
        counselors: {
          count: counselorStats.length,
          activeNow: counselorStats.filter((s) => s.liveStatus === "ON_CALL").length,
          callsToday: counselorStats.reduce((acc, s) => acc + s.todayCallsCount, 0),
          talkTimeFormatted: this.formatDuration(counselorStats.reduce((acc, s) => acc + s.todayTalkTimeSeconds, 0)),
          conversions: counselorStats.reduce((acc, s) => acc + s.todayConversionsCount, 0),
        },
        telecallers: {
          count: telecallerStats.length,
          activeNow: telecallerStats.filter((s) => s.liveStatus === "ON_CALL").length,
          callsToday: telecallerStats.reduce((acc, s) => acc + s.todayCallsCount, 0),
          talkTimeFormatted: this.formatDuration(telecallerStats.reduce((acc, s) => acc + s.todayTalkTimeSeconds, 0)),
          conversions: telecallerStats.reduce((acc, s) => acc + s.todayConversionsCount, 0),
        },
        marketing: {
          count: marketingStats.length,
          activeNow: marketingStats.filter((s) => s.liveStatus === "ON_CALL").length,
          callsToday: marketingStats.reduce((acc, s) => acc + s.todayCallsCount, 0),
          talkTimeFormatted: this.formatDuration(marketingStats.reduce((acc, s) => acc + s.todayTalkTimeSeconds, 0)),
          conversions: marketingStats.reduce((acc, s) => acc + s.todayConversionsCount, 0),
        },
      },
      staffList,
    };
  }

  /**
   * Staff Personal Workstation State (For Telecaller, Counselor, Marketing)
   */
  static async getMyWorkstationState(userId: string) {
    const session = await this.getOrCreateLiveSession(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [todayCalls, pendingTasks] = await Promise.all([
      db.staffCallLog.findMany({
        where: {
          userId,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.dailyWorkTask.findMany({
        where: {
          assignedStaff: { userId },
          status: { in: ["ASSIGNED", "IN_PROGRESS", "DRAFT"] },
        },
        orderBy: { dueDate: "asc" },
        take: 10,
      }),
    ]);

    const totalCallsToday = todayCalls.length;
    const totalTalkTimeSeconds = todayCalls.reduce((acc, curr) => acc + curr.durationSeconds, 0);
    const connectedCalls = todayCalls.filter((c) => c.callStatus === "CONNECTED" || c.durationSeconds > 0).length;
    const conversions = todayCalls.filter((c) => ["ADMISSION_CONFIRMED", "INTERESTED"].includes(c.disposition)).length;

    const now = new Date();
    let currentCallDuration = 0;
    if (session.status === "ON_CALL" && session.currentCallStartedAt) {
      currentCallDuration = Math.max(0, Math.floor((now.getTime() - new Date(session.currentCallStartedAt).getTime()) / 1000));
    }

    return {
      session: {
        status: session.status,
        currentCallContact: session.currentCallContact,
        currentCallPhone: session.currentCallPhone,
        currentCallStartedAt: session.currentCallStartedAt,
        currentCallDurationSeconds: currentCallDuration,
        currentCallDurationFormatted: this.formatDuration(currentCallDuration),
        breakReason: session.breakReason,
        dailyTargetCalls: session.dailyTargetCalls,
      },
      todayMetrics: {
        totalCallsToday,
        totalTalkTimeSeconds,
        totalTalkTimeFormatted: this.formatDuration(totalTalkTimeSeconds),
        connectedCalls,
        conversions,
        targetProgressPercent: Math.min(100, Math.round((totalCallsToday / session.dailyTargetCalls) * 100)),
      },
      todayCalls,
      pendingTasks,
    };
  }

  /**
   * List Call Logs with multi-filter (for Callyzer Call Logs Tab & Export)
   */
  static async listCallLogs(input: {
    userId?: string;
    roleCode?: string;
    disposition?: string;
    date?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = input.page || 1;
    const pageSize = input.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (input.userId) where.userId = input.userId;
    if (input.roleCode && input.roleCode !== "ALL") where.roleCode = input.roleCode;
    if (input.disposition && input.disposition !== "ALL") where.disposition = input.disposition;

    if (input.date) {
      const selected = new Date(input.date);
      const start = new Date(selected);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selected);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { gte: start, lte: end };
    }

    if (input.search && input.search.trim()) {
      where.OR = [
        { contactName: { contains: input.search.trim(), mode: "insensitive" } },
        { contactPhone: { contains: input.search.trim() } },
        { notes: { contains: input.search.trim(), mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      db.staffCallLog.count({ where }),
      db.staffCallLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              roleCode: true,
              avatarUrl: true,
            },
          },
          lead: {
            select: {
              id: true,
              fullName: true,
              status: true,
              source: true,
            },
          },
        },
      }),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        durationFormatted: this.formatDuration(log.durationSeconds),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Edit Call Log (Notes, Disposition, Next Follow-up)
   */
  static async updateCallLog(input: {
    callLogId: string;
    disposition?: string;
    notes?: string;
    nextFollowUpDate?: Date;
  }) {
    const updated = await db.staffCallLog.update({
      where: { id: input.callLogId },
      data: {
        ...(input.disposition ? { disposition: input.disposition } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.nextFollowUpDate !== undefined ? { nextFollowUpDate: input.nextFollowUpDate } : {}),
      },
    });

    return updated;
  }
}
