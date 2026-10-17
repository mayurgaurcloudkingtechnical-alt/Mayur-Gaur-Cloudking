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
  recordingUrl?: string;
  transcript?: any;
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
        recordingUrl: input.recordingUrl || null,
        transcript: input.transcript ? (typeof input.transcript === "string" ? JSON.parse(input.transcript) : input.transcript) : undefined,
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
   * Real-time view filtered Post-wise / Role-wise and Reporting Manager hierarchy
   */
  static async getLiveTeamMonitoring(
    actor?: { id: string; roleCode: UserRoleCode },
    filterRole?: string,
    search?: string,
    filterManagerId?: string
  ) {
    const rolesToMonitor: UserRoleCode[] = [
      UserRoleCode.COUNSELOR,
      UserRoleCode.TELECALLER,
      UserRoleCode.ADMIN,
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.MANAGER,
      UserRoleCode.MARKETING,
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

    // Role Hierarchy Access Control:
    // 1. Manager: If actor is a MANAGER, restrict view to staff who report to them (or themselves)
    if (actor && actor.roleCode === UserRoleCode.MANAGER) {
      const myProfile = await db.staffProfile.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (myProfile) {
        whereUser.OR = [
          { staffProfile: { reportingManagerId: myProfile.id } },
          { id: actor.id },
        ];
      }
    } else if (filterManagerId && filterManagerId !== "ALL") {
      // 2. Higher Authorities (SUPER_ADMIN, DIRECTOR, ADMIN) filtering by a specific manager
      if (filterManagerId === "UNASSIGNED") {
        whereUser.staffProfile = { reportingManagerId: null };
      } else {
        whereUser.OR = [
          { staffProfile: { reportingManagerId: filterManagerId } },
          { staffProfile: { id: filterManagerId } },
        ];
      }
    }

    if (search && search.trim()) {
      const searchCond = [
        { firstName: { contains: search.trim(), mode: "insensitive" } },
        { lastName: { contains: search.trim(), mode: "insensitive" } },
        { email: { contains: search.trim(), mode: "insensitive" } },
        { phone: { contains: search.trim() } },
      ];
      if (whereUser.OR) {
        whereUser.AND = [{ OR: whereUser.OR }, { OR: searchCond }];
        delete whereUser.OR;
      } else {
        whereUser.OR = searchCond;
      }
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
            reportingManagerId: true,
            reportingManager: {
              select: {
                id: true,
                employeeId: true,
                designation: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    roleCode: true,
                  },
                },
              },
            },
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
            recordingUrl: true,
            transcript: true,
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
        reportingManagerId: u.staffProfile?.reportingManagerId || null,
        reportingManagerName: u.staffProfile?.reportingManager?.user
          ? `${u.staffProfile.reportingManager.user.firstName} ${u.staffProfile.reportingManager.user.lastName}`
          : "Head Office Direct",
        reportingManagerEmployeeId: u.staffProfile?.reportingManager?.employeeId || null,
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
      user: {
        id: (session as any).user?.id || userId,
        fullName: `${(session as any).user?.firstName || ""} ${(session as any).user?.lastName || ""}`.trim() || "Staff Member",
        phone: (session as any).user?.phone || null,
        roleCode: (session as any).user?.roleCode,
        employeeId: (session as any).user?.staffProfile?.employeeId || null,
        department: (session as any).user?.staffProfile?.department || null,
        branch: (session as any).user?.staffProfile?.branch || null,
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
    managerId?: string;
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

    if (input.managerId && input.managerId !== "ALL") {
      if (input.managerId === "UNASSIGNED") {
        where.user = { staffProfile: { reportingManagerId: null } };
      } else {
        where.user = {
          OR: [
            { staffProfile: { reportingManagerId: input.managerId } },
            { staffProfile: { id: input.managerId } },
          ],
        };
      }
    }

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
              staffProfile: {
                select: {
                  employeeId: true,
                  department: true,
                  reportingManagerId: true,
                  reportingManager: {
                    select: {
                      id: true,
                      employeeId: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true,
                        },
                      },
                    },
                  },
                },
              },
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
      logs: logs.map((log: any) => ({
        ...log,
        durationFormatted: this.formatDuration(log.durationSeconds),
        callerEmployeeId: log.user?.staffProfile?.employeeId || null,
        reportingManagerName: log.user?.staffProfile?.reportingManager?.user
          ? `${log.user.staffProfile.reportingManager.user.firstName} ${log.user.staffProfile.reportingManager.user.lastName}`
          : "Head Office Direct",
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Fetches all potential managers and directors for Callyzer hierarchy filtering
   */
  static async getReportingManagersList() {
    return db.staffProfile.findMany({
      where: {
        isActive: true,
        OR: [
          { user: { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN, UserRoleCode.MANAGER, UserRoleCode.HR] } } },
          { subordinates: { some: {} } },
        ],
      },
      select: {
        id: true,
        employeeId: true,
        department: true,
        designation: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            roleCode: true,
          },
        },
        _count: {
          select: { subordinates: true },
        },
      },
      orderBy: [{ user: { firstName: "asc" } }],
    });
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

  /**
   * Formats structured Callyzer calling report for WhatsApp group and direct message
   */
  static formatCallyzerWhatsAppReport(data: {
    staffName: string;
    employeeId?: string;
    roleCode?: string;
    dateLabel: string;
    totalCalls: number;
    totalTalkTime: string;
    incomingCalls: number;
    incomingTalkTime: string;
    outgoingCalls: number;
    outgoingTalkTime: string;
    missedCalls: number;
    rejectedCalls: number;
    neverAttendedCalls: number;
    notPickupByClient: number;
    uniqueCalls: number;
    connectedCalls: number;
    conversions: number;
    connectionRate: number;
    avgDuration: string;
  }): string {
    const lines = [
      `📊 *SOFTLAB GLOBAL — CALLYZER CALLING REPORT* 📞`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Staff Member*: ${data.staffName}${data.employeeId ? ` (${data.employeeId})` : ""}`,
      `💼 *Designation/Role*: ${data.roleCode || "Counseling / Telecalling"}`,
      `📅 *Reporting Period*: ${data.dateLabel}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `📱 *SUMMARY METRICS*:`,
      `• 📞 *Total Phone Calls*: ${data.totalCalls} [⏱️ ${data.totalTalkTime}]`,
      `• 🟢 *Incoming Calls*: ${data.incomingCalls} [⏱️ ${data.incomingTalkTime}]`,
      `• 🟠 *Outgoing Calls*: ${data.outgoingCalls} [⏱️ ${data.outgoingTalkTime}]`,
      `• 🔴 *Missed Calls*: ${data.missedCalls}`,
      `• 🚫 *Rejected Calls*: ${data.rejectedCalls}`,
      `• 📴 *Never Attended Calls*: ${data.neverAttendedCalls}`,
      `• 📵 *Not Picked by Client*: ${data.notPickupByClient}`,
      `• 👥 *Unique Calls / Clients*: ${data.uniqueCalls}`,
      ``,
      `🎯 *PERFORMANCE & EFFICIENCY*:`,
      `• ✅ *Connected Conversations*: ${data.connectedCalls} (${data.connectionRate}% Rate)`,
      `• ⏱️ *Average Talk Time*: ${data.avgDuration}`,
      `• 🌟 *Interested / Conversions*: ${data.conversions}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🌐 *SoftLab Global LMS*: https://softlabglobal.com/admin/callyzer`,
      `✨ *Daily performance auto-logged by Callyzer Telephony Engine* ✨`,
    ];
    return lines.join("\n");
  }

  /**
   * Fetches active staff list (Counselors, Telecallers, Managers) for Callyzer reporting switcher
   */
  static async getStaffMembersListForCallyzer(actor: { id: string; roleCode: UserRoleCode }) {
    const roles: UserRoleCode[] = [
      UserRoleCode.COUNSELOR,
      UserRoleCode.TELECALLER,
      UserRoleCode.ADMIN,
      UserRoleCode.MANAGER,
      UserRoleCode.DIRECTOR,
      UserRoleCode.SUPER_ADMIN,
    ];

    const where: any = {
      roleCode: { in: roles },
      status: "ACTIVE",
    };

    if (actor.roleCode === UserRoleCode.MANAGER) {
      const myProfile = await db.staffProfile.findUnique({
        where: { userId: actor.id },
        select: { id: true },
      });
      if (myProfile) {
        where.OR = [
          { staffProfile: { reportingManagerId: myProfile.id } },
          { id: actor.id },
        ];
      }
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        roleCode: true,
        phone: true,
        callingNumber: true,
        whatsappNumber: true,
        avatarUrl: true,
        staffProfile: {
          select: {
            employeeId: true,
            designation: true,
            department: true,
          },
        },
      },
      orderBy: [{ firstName: "asc" }],
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      roleCode: u.roleCode,
      employeeId: u.staffProfile?.employeeId || `SLG-${u.roleCode.slice(0, 3)}-${u.id.slice(0, 4)}`,
      designation: u.staffProfile?.designation || u.roleCode,
      department: u.staffProfile?.department || "ADMISSIONS",
      phone: u.callingNumber || u.whatsappNumber || u.phone || "",
      whatsappNumber: u.whatsappNumber || u.callingNumber || u.phone || "",
      avatarUrl: u.avatarUrl,
    }));
  }

  /**
   * Get Callyzer App Format Summary & Analysis Report
   * Exactly matches the Callyzer mobile application layout:
   * - Total Phone Calls (count + duration)
   * - Incoming Calls (count + duration)
   * - Outgoing Calls (count + duration)
   * - Missed Calls (count)
   * - Rejected Calls (count)
   * - Never Attended Calls (count)
   * - Not Pickup by Client (count)
   * - Unique Calls (count)
   * Plus hourly distribution and disposition breakdown for Analysis tab
   */
  static async getCallyzerSummaryReport(
    actor: { id: string; roleCode: UserRoleCode },
    input?: {
      userId?: string;
      preset?: "TODAY" | "YESTERDAY" | "LAST_7_DAYS" | "THIS_MONTH" | "CUSTOM";
      startDate?: string;
      endDate?: string;
    }
  ) {
    const preset = input?.preset || "TODAY";
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (preset === "TODAY") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "YESTERDAY") {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "LAST_7_DAYS") {
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "THIS_MONTH") {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === "CUSTOM" && input?.startDate && input?.endDate) {
      start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);
    }

    const formatRangeLabel = (s: Date, e: Date, p: string) => {
      const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
      const sDay = s.toLocaleDateString("en-US", opts);
      const eDay = e.toLocaleDateString("en-US", opts);
      if (p === "TODAY") {
        return `${sDay} 12:00 AM - ${sDay} 11:59 PM`;
      }
      return `${sDay} 12:00 AM - ${eDay} 11:59 PM`;
    };

    const dateRangeLabel = formatRangeLabel(start, end, preset);

    const where: any = {
      createdAt: { gte: start, lte: end },
    };

    // Determine target user
    let targetUser: any = null;
    let isTeamReport = false;

    const isDirectCaller = ([UserRoleCode.COUNSELOR, UserRoleCode.TELECALLER] as UserRoleCode[]).includes(actor.roleCode);

    if (input?.userId && input.userId !== "ALL") {
      where.userId = input.userId;
      targetUser = await db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          callingNumber: true,
          whatsappNumber: true,
          roleCode: true,
          avatarUrl: true,
          staffProfile: {
            select: {
              employeeId: true,
              department: true,
              designation: true,
            },
          },
        },
      });
    } else if (isDirectCaller) {
      // Counselor/Telecaller always defaults to themselves
      where.userId = actor.id;
      targetUser = await db.user.findUnique({
        where: { id: actor.id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          callingNumber: true,
          whatsappNumber: true,
          roleCode: true,
          avatarUrl: true,
          staffProfile: {
            select: {
              employeeId: true,
              department: true,
              designation: true,
            },
          },
        },
      });
    } else {
      isTeamReport = true;
      if (actor.roleCode === UserRoleCode.MANAGER) {
        const myProfile = await db.staffProfile.findUnique({
          where: { userId: actor.id },
          select: { id: true },
        });
        if (myProfile) {
          where.user = {
            OR: [
              { staffProfile: { reportingManagerId: myProfile.id } },
              { id: actor.id },
            ],
          };
        }
      }
    }

    const logs = await db.staffCallLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        contactName: true,
        contactPhone: true,
        callType: true,
        callStatus: true,
        disposition: true,
        durationSeconds: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPhoneCalls = logs.length;
    const totalTalkTimeSeconds = logs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    // Incoming Calls
    const incomingLogs = logs.filter((c) => c.callType === "INCOMING");
    const incomingCalls = incomingLogs.length;
    const incomingTalkTimeSeconds = incomingLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    // Outgoing Calls
    const outgoingLogs = logs.filter((c) => c.callType === "OUTGOING" || !c.callType);
    const outgoingCalls = outgoingLogs.length;
    const outgoingTalkTimeSeconds = outgoingLogs.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);

    // Missed Calls
    const missedCalls = logs.filter(
      (c) => c.callType === "MISSED" || (c.callType === "INCOMING" && (c.callStatus === "NO_ANSWER" || c.durationSeconds === 0))
    ).length;

    // Rejected Calls
    const rejectedCalls = logs.filter(
      (c) => c.callType === "REJECTED" || (c.callType === "INCOMING" && c.callStatus === "BUSY")
    ).length;

    // Never Attended Calls
    const neverAttendedCalls = logs.filter(
      (c) => c.callType === "INCOMING" && c.durationSeconds === 0
    ).length;

    // Not Pickup by Client (Outgoing calls where client didn't answer or duration 0)
    const notPickupByClient = logs.filter(
      (c) => (c.callType === "OUTGOING" || !c.callType) && (c.durationSeconds === 0 || c.callStatus === "NO_ANSWER" || c.disposition === "BUSY_NO_ANSWER")
    ).length;

    // Unique Calls (distinct phone numbers)
    const uniquePhones = new Set(
      logs.map((c) => c.contactPhone.replace(/\D/g, "").slice(-10)).filter(Boolean)
    );
    const uniqueCalls = uniquePhones.size;

    // Connected & Conversions
    const connectedCalls = logs.filter((c) => c.callStatus === "CONNECTED" || c.durationSeconds > 0).length;
    const conversions = logs.filter((c) => ["ADMISSION_CONFIRMED", "INTERESTED"].includes(c.disposition)).length;
    const connectionRate = totalPhoneCalls > 0 ? Math.round((connectedCalls / totalPhoneCalls) * 100) : 0;
    const avgDurationSeconds = totalPhoneCalls > 0 ? Math.round(totalTalkTimeSeconds / totalPhoneCalls) : 0;

    // Analysis: Hourly Distribution (0–23)
    const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => {
      const hourLogs = logs.filter((l) => new Date(l.createdAt).getHours() === hour);
      return {
        hour,
        label: `${hour % 12 === 0 ? 12 : hour % 12} ${hour >= 12 ? "PM" : "AM"}`,
        calls: hourLogs.length,
        durationSeconds: hourLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0),
        durationFormatted: this.formatDuration(hourLogs.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0)),
      };
    });

    // Analysis: Disposition Breakdown
    const dispositionCounts: Record<string, number> = {};
    for (const log of logs) {
      const disp = log.disposition || "OTHER";
      dispositionCounts[disp] = (dispositionCounts[disp] || 0) + 1;
    }

    const staffName = isTeamReport
      ? "All Staff Members (Team Total)"
      : targetUser
      ? `${targetUser.firstName} ${targetUser.lastName}`
      : `${actor.roleCode} Desk`;

    const staffEmployeeId = targetUser?.staffProfile?.employeeId || null;
    const staffPhone = targetUser?.callingNumber || targetUser?.whatsappNumber || targetUser?.phone || null;

    // Generate pre-formatted WhatsApp text
    const whatsappText = this.formatCallyzerWhatsAppReport({
      staffName,
      employeeId: staffEmployeeId || undefined,
      roleCode: targetUser?.roleCode || (isTeamReport ? "All Team" : actor.roleCode),
      dateLabel: dateRangeLabel,
      totalCalls: totalPhoneCalls,
      totalTalkTime: this.formatDuration(totalTalkTimeSeconds),
      incomingCalls,
      incomingTalkTime: this.formatDuration(incomingTalkTimeSeconds),
      outgoingCalls,
      outgoingTalkTime: this.formatDuration(outgoingTalkTimeSeconds),
      missedCalls,
      rejectedCalls,
      neverAttendedCalls,
      notPickupByClient,
      uniqueCalls,
      connectedCalls,
      conversions,
      connectionRate,
      avgDuration: this.formatDuration(avgDurationSeconds),
    });

    const whatsappGroupShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
    const staffCleanPhone = staffPhone ? staffPhone.replace(/\D/g, "").slice(-10) : "";
    const staffDirectWhatsappUrl = staffCleanPhone
      ? `https://wa.me/91${staffCleanPhone}?text=${encodeURIComponent(whatsappText)}`
      : null;

    return {
      dateRangeLabel,
      preset,
      isTeamReport,
      staffInfo: {
        userId: targetUser?.id || null,
        name: staffName,
        employeeId: staffEmployeeId,
        roleCode: targetUser?.roleCode || (isTeamReport ? "TEAM" : actor.roleCode),
        phone: staffPhone,
        avatarUrl: targetUser?.avatarUrl || null,
      },
      summary: {
        totalPhoneCalls,
        totalTalkTimeSeconds,
        totalTalkTimeFormatted: this.formatDuration(totalTalkTimeSeconds),
        incomingCalls,
        incomingTalkTimeSeconds,
        incomingTalkTimeFormatted: this.formatDuration(incomingTalkTimeSeconds),
        outgoingCalls,
        outgoingTalkTimeSeconds,
        outgoingTalkTimeFormatted: this.formatDuration(outgoingTalkTimeSeconds),
        missedCalls,
        rejectedCalls,
        neverAttendedCalls,
        notPickupByClient,
        uniqueCalls,
        connectedCalls,
        conversions,
        connectionRate,
        avgDurationSeconds,
        avgDurationFormatted: this.formatDuration(avgDurationSeconds),
      },
      analysis: {
        hourlyDistribution,
        dispositionCounts,
        recentCallLogs: logs.slice(0, 15).map((l) => ({
          ...l,
          durationFormatted: this.formatDuration(l.durationSeconds),
        })),
      },
      whatsapp: {
        text: whatsappText,
        groupShareUrl: whatsappGroupShareUrl,
        staffDirectUrl: staffDirectWhatsappUrl,
      },
    };
  }
}
