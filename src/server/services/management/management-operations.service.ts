import { db } from "@/server/db/client";
import { AuditService } from "@/server/services/audit.service";
import {
  UserRoleCode,
  ClassSessionStatus,
  AttendanceStatus,
  AlertSeverity,
  AlertStatus,
  CorrectionStatus,
  Prisma,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface DateFilterRange {
  from?: Date | string;
  to?: Date | string;
}

export class ManagementOperationsService {
  /**
   * Returns a complete high-level live operations overview
   */
  public static async getLiveOperationsOverview() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [
      activeRunningClasses,
      todayScheduledClasses,
      todayCompletedClasses,
      todayCancelledClasses,
      trainersActiveCount,
      activeLiveAttendance,
      todayMockInterviews,
      todayRecruiterInterviews,
      openAlertsCount,
      criticalAlertsCount,
      recentCorrectionsCount,
      youtubeQueueMetrics,
      notificationsSentCount,
      callsTodayMetrics,
    ] = await Promise.all([
      // 1. Live classes currently in progress
      db.scheduledClass.findMany({
        where: {
          status: ClassSessionStatus.IN_PROGRESS,
        },
        include: {
          batch: {
            include: { course: { select: { title: true } } },
          },
          trainer: {
            include: { user: { select: { firstName: true, lastName: true, email: true } } },
          },
          _count: {
            select: { liveAttendances: true },
          },
        },
        take: 10,
        orderBy: { startedAt: "desc" },
      }),

      // 2. Today's scheduled
      db.scheduledClass.count({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: ClassSessionStatus.SCHEDULED,
        },
      }),

      // 3. Today's completed
      db.scheduledClass.count({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: ClassSessionStatus.COMPLETED,
        },
      }),

      // 4. Today's cancelled
      db.scheduledClass.count({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: ClassSessionStatus.CANCELLED,
        },
      }),

      // 5. Active faculty currently teaching
      db.scheduledClass.groupBy({
        by: ["trainerId"],
        where: {
          status: ClassSessionStatus.IN_PROGRESS,
          trainerId: { not: null },
        },
      }),

      // 6. Active students in live classes
      db.liveClassAttendance.count({
        where: {
          class: { status: ClassSessionStatus.IN_PROGRESS },
        },
      }),

      // 7. Mock interviews today
      db.mockInterview.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: { id: true, status: true, overallScore: true },
      }),

      // 8. Recruiter interviews today
      db.recruiterInterview.findMany({
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
        },
        select: { id: true, status: true, selectionDecision: true },
      }),

      // 9. Open alerts count
      db.managementAlert.count({
        where: { status: AlertStatus.OPEN },
      }),

      // 10. Critical alerts
      db.managementAlert.count({
        where: {
          status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          severity: AlertSeverity.CRITICAL,
        },
      }),

      // 11. Recent corrections (last 24 hours)
      db.recordCorrectionLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),

      // 12. YouTube publish queue status
      db.youTubePublishQueue.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // 13. Notifications dispatched today
      db.notification.count({
        where: {
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),

      // 14. Staff calls logged today
      db.staffCallLog.aggregate({
        where: {
          startedAt: { gte: todayStart, lte: todayEnd },
        },
        _count: { id: true },
        _sum: { durationSeconds: true },
      }),
    ]);

    // Parse YouTube queue stats
    const ytStats = {
      queued: 0,
      uploading: 0,
      published: 0,
      failed: 0,
      blocked: 0,
    };
    youtubeQueueMetrics.forEach((item) => {
      if (item.status === "QUEUED") ytStats.queued = item._count.status;
      if (item.status === "UPLOADING") ytStats.uploading = item._count.status;
      if (item.status === "PUBLISHED") ytStats.published = item._count.status;
      if (item.status === "FAILED") ytStats.failed = item._count.status;
      if (item.status === "BLOCKED_PRIVACY") ytStats.blocked = item._count.status;
    });

    // Mock interview metrics
    const mockCompleted = todayMockInterviews.filter((m) => m.status === "COMPLETED").length;
    const mockPendingFeedback = todayMockInterviews.filter(
      (m) => m.status !== "COMPLETED" && m.status !== "CANCELLED"
    ).length;

    // Recruiter interview metrics
    const recruiterSelected = todayRecruiterInterviews.filter(
      (r) => r.selectionDecision === "SELECTED"
    ).length;
    const recruiterPending = todayRecruiterInterviews.filter(
      (r) => !r.selectionDecision && r.status !== "CANCELLED"
    ).length;

    return {
      timestamp: now.toISOString(),
      timestampIst: now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      classes: {
        runningCount: activeRunningClasses.length,
        todayScheduled: todayScheduledClasses,
        todayCompleted: todayCompletedClasses,
        todayCancelled: todayCancelledClasses,
        activeTrainers: trainersActiveCount.length,
        activeStudentParticipants: activeLiveAttendance,
        runningList: activeRunningClasses.map((c) => ({
          id: c.id,
          title: c.title,
          batchName: c.batch.name,
          batchCode: c.batch.code,
          courseTitle: c.batch.course.title,
          trainerName: c.trainer
            ? `${c.trainer.user.firstName} ${c.trainer.user.lastName}`
            : "Unassigned",
          startedAt: c.startedAt ? c.startedAt.toISOString() : null,
          durationMin: c.durationMin,
          participantsCount: c._count.liveAttendances,
          roomCode: c.roomCode,
        })),
      },
      interviews: {
        mockTotalToday: todayMockInterviews.length,
        mockCompleted,
        mockPendingFeedback,
        recruiterTotalToday: todayRecruiterInterviews.length,
        recruiterSelected,
        recruiterPending,
      },
      alerts: {
        openCount: openAlertsCount,
        criticalCount: criticalAlertsCount,
      },
      corrections: {
        last24hCount: recentCorrectionsCount,
      },
      communications: {
        notificationsToday: notificationsSentCount,
        callsTodayCount: callsTodayMetrics._count.id || 0,
        callsTodayMinutes: Math.round((callsTodayMetrics._sum.durationSeconds || 0) / 60),
      },
      youtube: ytStats,
    };
  }

  /**
   * Comprehensive live classroom oversight with participant counts and drill-down
   */
  public static async getLiveClassroomOversight(params: {
    status?: ClassSessionStatus;
    batchId?: string;
    trainerId?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ScheduledClassWhereInput = {};

    if (params.status) where.status = params.status;
    if (params.batchId) where.batchId = params.batchId;
    if (params.trainerId) where.trainerId = params.trainerId;

    if (params.dateFrom || params.dateTo) {
      where.scheduledAt = {};
      if (params.dateFrom) where.scheduledAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.scheduledAt.lte = new Date(params.dateTo);
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { batch: { name: { contains: params.search, mode: "insensitive" } } },
        { batch: { code: { contains: params.search, mode: "insensitive" } } },
        { batch: { course: { title: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    const [classes, total] = await Promise.all([
      db.scheduledClass.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ status: "asc" }, { scheduledAt: "desc" }],
        include: {
          batch: {
            include: {
              course: { select: { id: true, title: true } },
              _count: { select: { enrollments: true } },
            },
          },
          trainer: {
            include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
          },
          recordings: {
            select: { id: true, status: true, isPublishedToYouTube: true, youTubeUrl: true },
          },
          _count: {
            select: { liveAttendances: true, liveSessionEvents: true },
          },
        },
      }),
      db.scheduledClass.count({ where }),
    ]);

    return {
      classes: classes.map((c) => ({
        id: c.id,
        title: c.title,
        status: c.status,
        statusReason: c.statusReason,
        scheduledAt: c.scheduledAt.toISOString(),
        scheduledAtIst: c.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        startedAt: c.startedAt ? c.startedAt.toISOString() : null,
        endedAt: c.endedAt ? c.endedAt.toISOString() : null,
        durationMin: c.durationMin,
        mode: c.mode,
        roomCode: c.roomCode,
        batchId: c.batchId,
        batchName: c.batch.name,
        batchCode: c.batch.code,
        courseId: c.batch.course.id,
        courseTitle: c.batch.course.title,
        eligibleEnrollmentsCount: c.batch._count.enrollments,
        actualJoinedCount: c._count.liveAttendances,
        sessionEventsCount: c._count.liveSessionEvents,
        trainerId: c.trainerId,
        trainerName: c.trainer
          ? `${c.trainer.user.firstName} ${c.trainer.user.lastName}`
          : "Unassigned Faculty",
        trainerEmail: c.trainer?.user.email || null,
        isRecordingEnabled: c.isRecordingEnabled,
        allowAutoPublishYouTube: c.allowAutoPublishYouTube,
        recordings: c.recordings,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Retrieves participant roster and join/leave records for a specific live class
   */
  public static async getClassParticipantsRoster(classId: string) {
    const classSession = await db.scheduledClass.findUnique({
      where: { id: classId },
      include: {
        batch: {
          include: {
            course: true,
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                student: { include: { user: true } },
              },
            },
          },
        },
        liveAttendances: {
          include: {
            student: { include: { user: true } },
          },
        },
      },
    });

    if (!classSession) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class session not found." });
    }

    const attendanceMap = new Map(classSession.liveAttendances.map((a) => [a.studentId, a]));

    const roster = classSession.batch.enrollments.map((enr) => {
      const student = enr.student;
      const att = attendanceMap.get(student.id);

      return {
        studentId: student.id,
        studentCode: student.studentId,
        name: student.user ? `${student.user.firstName} ${student.user.lastName}` : "Unknown Student",
        email: student.user?.email || "",
        phone: student.user?.phone || student.whatsappNumber || "",
        hasJoined: !!att,
        firstJoinedAt: att?.firstJoinedAt?.toISOString() || null,
        lastLeftAt: att?.lastLeftAt?.toISOString() || null,
        totalDurationSeconds: att?.totalDurationSeconds || 0,
        attendancePercentage: att?.attendancePercentage || 0,
        status: att?.status || "ABSENT",
        isManuallyCorrected: att?.isManuallyCorrected || false,
        correctionReason: att?.correctionReason || null,
      };
    });

    return {
      classId: classSession.id,
      title: classSession.title,
      batchCode: classSession.batch.code,
      batchName: classSession.batch.name,
      totalEnrolled: classSession.batch.enrollments.length,
      totalAttended: classSession.liveAttendances.length,
      roster,
    };
  }

  /**
   * Detailed interview lifecycle oversight (Mocks + Recruiters)
   */
  public static async getInterviewsOversight(params: {
    category?: "MOCK" | "RECRUITER";
    status?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const mockWhere: Prisma.MockInterviewWhereInput = {};
    const recruiterWhere: Prisma.RecruiterInterviewWhereInput = {};

    if (params.status) {
      mockWhere.status = params.status;
      recruiterWhere.status = params.status;
    }

    if (params.dateFrom || params.dateTo) {
      mockWhere.scheduledAt = {};
      recruiterWhere.scheduledAt = {};
      if (params.dateFrom) {
        mockWhere.scheduledAt.gte = new Date(params.dateFrom);
        recruiterWhere.scheduledAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        mockWhere.scheduledAt.lte = new Date(params.dateTo);
        recruiterWhere.scheduledAt.lte = new Date(params.dateTo);
      }
    }

    if (params.search) {
      mockWhere.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { student: { user: { firstName: { contains: params.search, mode: "insensitive" } } } },
        { student: { user: { lastName: { contains: params.search, mode: "insensitive" } } } },
      ];
      recruiterWhere.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { student: { user: { firstName: { contains: params.search, mode: "insensitive" } } } },
        { student: { user: { lastName: { contains: params.search, mode: "insensitive" } } } },
      ];
    }

    if (params.category === "MOCK") {
      const [mocks, total] = await Promise.all([
        db.mockInterview.findMany({
          where: mockWhere,
          skip,
          take: limit,
          orderBy: { scheduledAt: "desc" },
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            interviewer: { select: { firstName: true, lastName: true, email: true } },
          },
        }),
        db.mockInterview.count({ where: mockWhere }),
      ]);

      return {
        category: "MOCK",
        total,
        page,
        totalPages: Math.ceil(total / limit),
        items: mocks.map((m) => ({
          id: m.id,
          category: "MOCK" as const,
          title: m.title,
          interviewType: m.interviewType,
          status: m.status,
          scheduledAt: m.scheduledAt.toISOString(),
          scheduledAtIst: m.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          durationMin: m.durationMin,
          roomCode: m.roomCode,
          studentName: `${m.student.user.firstName} ${m.student.user.lastName}`,
          studentEmail: m.student.user.email,
          interviewerName: `${m.interviewer.firstName} ${m.interviewer.lastName}`,
          overallScore: m.overallScore,
          scores: {
            comm: m.scoreCommunication,
            tech: m.scoreTechnical,
            conf: m.scoreConfidence,
            problem: m.scoreProblemSolving,
          },
          recommendations: m.recommendations,
          feedbackSubmittedAt: m.feedbackSubmittedAt?.toISOString() || null,
        })),
      };
    }

    if (params.category === "RECRUITER") {
      const [recruiters, total] = await Promise.all([
        db.recruiterInterview.findMany({
          where: recruiterWhere,
          skip,
          take: limit,
          orderBy: { scheduledAt: "desc" },
          include: {
            student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
            recruiter: { select: { firstName: true, lastName: true, email: true } },
            jobDrive: { select: { title: true, company: { select: { name: true } } } },
          },
        }),
        db.recruiterInterview.count({ where: recruiterWhere }),
      ]);

      return {
        category: "RECRUITER",
        total,
        page,
        totalPages: Math.ceil(total / limit),
        items: recruiters.map((r) => ({
          id: r.id,
          category: "RECRUITER" as const,
          title: r.title,
          stage: r.stage,
          status: r.status,
          scheduledAt: r.scheduledAt.toISOString(),
          scheduledAtIst: r.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          durationMin: r.durationMin,
          roomCode: r.roomCode,
          companyName: r.jobDrive?.company.name || "Corporate Partner",
          jobTitle: r.jobDrive?.title || "Recruitment Drive",
          studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
          studentEmail: r.student.user.email,
          recruiterName: `${r.recruiter.firstName} ${r.recruiter.lastName}`,
          selectionDecision: r.selectionDecision,
          feedback: r.feedback,
        })),
      };
    }

    // Default: fetch combined summary
    const [recentMocks, recentRecruiters, mockCount, recruiterCount] = await Promise.all([
      db.mockInterview.findMany({
        where: mockWhere,
        take: 10,
        orderBy: { scheduledAt: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          interviewer: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.recruiterInterview.findMany({
        where: recruiterWhere,
        take: 10,
        orderBy: { scheduledAt: "desc" },
        include: {
          student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
          recruiter: { select: { firstName: true, lastName: true, email: true } },
          jobDrive: { select: { title: true, company: { select: { name: true } } } },
        },
      }),
      db.mockInterview.count({ where: mockWhere }),
      db.recruiterInterview.count({ where: recruiterWhere }),
    ]);

    return {
      category: "ALL",
      totalMocks: mockCount,
      totalRecruiters: recruiterCount,
      recentMocks: recentMocks.map((m) => ({
        id: m.id,
        category: "MOCK" as const,
        title: m.title,
        status: m.status,
        scheduledAt: m.scheduledAt.toISOString(),
        scheduledAtIst: m.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        studentName: `${m.student.user.firstName} ${m.student.user.lastName}`,
        interviewerName: `${m.interviewer.firstName} ${m.interviewer.lastName}`,
        overallScore: m.overallScore,
        roomCode: m.roomCode,
      })),
      recentRecruiters: recentRecruiters.map((r) => ({
        id: r.id,
        category: "RECRUITER" as const,
        title: r.title,
        stage: r.stage,
        status: r.status,
        scheduledAt: r.scheduledAt.toISOString(),
        scheduledAtIst: r.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        companyName: r.jobDrive?.company.name || "Corporate Recruiter",
        studentName: `${r.student.user.firstName} ${r.student.user.lastName}`,
        recruiterName: `${r.recruiter.firstName} ${r.recruiter.lastName}`,
        selectionDecision: r.selectionDecision,
        roomCode: r.roomCode,
      })),
    };
  }

  /**
   * Communications & Telephony Oversight (WhatsApp, Notifications, Calls)
   */
  public static async getCommunicationsOversight(params: {
    channel?: "WHATSAPP" | "NOTIFICATION" | "CALL";
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const notifWhere: Prisma.NotificationWhereInput = {};
    const callWhere: Prisma.StaffCallLogWhereInput = {};

    if (params.dateFrom || params.dateTo) {
      notifWhere.createdAt = {};
      callWhere.startedAt = {};
      if (params.dateFrom) {
        notifWhere.createdAt.gte = new Date(params.dateFrom);
        callWhere.startedAt.gte = new Date(params.dateFrom);
      }
      if (params.dateTo) {
        notifWhere.createdAt.lte = new Date(params.dateTo);
        callWhere.startedAt.lte = new Date(params.dateTo);
      }
    }

    if (params.search) {
      notifWhere.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { message: { contains: params.search, mode: "insensitive" } },
      ];
      callWhere.OR = [
        { contactName: { contains: params.search, mode: "insensitive" } },
        { contactPhone: { contains: params.search, mode: "insensitive" } },
        { notes: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [notifications, totalNotifs, callLogs, totalCalls] = await Promise.all([
      db.notification.findMany({
        where: notifWhere,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
      }),
      db.notification.count({ where: notifWhere }),
      db.staffCallLog.findMany({
        where: callWhere,
        skip,
        take: limit,
        orderBy: { startedAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.staffCallLog.count({ where: callWhere }),
    ]);

    return {
      notifications: {
        total: totalNotifs,
        items: notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          priority: n.priority,
          isRead: n.isRead,
          createdAt: n.createdAt.toISOString(),
          createdAtIst: n.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          recipientName: `${n.user.firstName} ${n.user.lastName}`,
          recipientPhone: n.user.phone,
          recipientEmail: n.user.email,
        })),
      },
      calls: {
        total: totalCalls,
        items: callLogs.map((c) => ({
          id: c.id,
          contactName: c.contactName,
          contactPhone: c.contactPhone,
          callType: c.callType,
          callStatus: c.callStatus,
          disposition: c.disposition,
          durationSeconds: c.durationSeconds,
          startedAt: c.startedAt.toISOString(),
          startedAtIst: c.startedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          staffName: `${c.user.firstName} ${c.user.lastName}`,
          notes: c.notes,
        })),
      },
      integrationHealth: {
        metaWhatsAppConfigured: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        callyzerConfigured: !!process.env.CALLYZER_CLIENT_KEY,
        youtubeConfigured: !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
        databaseHealthy: true,
      },
    };
  }

  /**
   * YouTube Publishing Queue Oversight
   */
  public static async getYouTubePublishingOversight(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.YouTubePublishQueueWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { videoTitle: { contains: params.search, mode: "insensitive" } },
        { courseTitle: { contains: params.search, mode: "insensitive" } },
        { lectureTopic: { contains: params.search, mode: "insensitive" } },
        { trainerName: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.youTubePublishQueue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.youTubePublishQueue.count({ where }),
    ]);

    return {
      items: items.map((q) => ({
        id: q.id,
        recordingId: q.recordingId,
        classId: q.classId,
        courseTitle: q.courseTitle,
        moduleTitle: q.moduleTitle,
        lectureTopic: q.lectureTopic,
        trainerName: q.trainerName,
        targetPrivacy: q.targetPrivacy,
        status: q.status,
        attemptCount: q.attemptCount,
        lastAttemptAt: q.lastAttemptAt?.toISOString() || null,
        errorMessage: q.errorMessage,
        videoTitle: q.videoTitle,
        videoDescription: q.videoDescription,
        tags: q.tags,
        thumbnailUrl: q.thumbnailUrl,
        youTubeVideoId: q.youTubeVideoId,
        youTubeUrl: q.youTubeUrl,
        publishedAt: q.publishedAt?.toISOString() || null,
        createdAt: q.createdAt.toISOString(),
        createdAtIst: q.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Chronological Unified Activity Timeline merging AuditLog, SessionEvents, and Corrections
   */
  public static async getActivityTimeline(params: {
    resourceType?: string;
    actorId?: string;
    search?: string;
    limit?: number;
  }) {
    const limit = params.limit || 50;

    const auditLogs = await db.auditLog.findMany({
      where: {
        resourceType: params.resourceType || undefined,
        actorId: params.actorId || undefined,
        action: params.search ? { contains: params.search, mode: "insensitive" } : undefined,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: { id: true, firstName: true, lastName: true, email: true, roleCode: true },
        },
      },
    });

    const corrections = await db.recordCorrectionLog.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: {
          select: { firstName: true, lastName: true, email: true, roleCode: true },
        },
      },
    });

    // Merge and sort in descending order
    const mergedEvents = [
      ...auditLogs.map((a) => ({
        id: a.id,
        source: "AUDIT" as const,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        actorName: a.actor ? `${a.actor.firstName} ${a.actor.lastName}` : "System / Automated Job",
        actorRole: a.actor?.roleCode || "SYSTEM",
        actorEmail: a.actor?.email || null,
        previousData: a.previousData,
        newData: a.newData,
        createdAt: a.createdAt.toISOString(),
        createdAtIst: a.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      })),
      ...corrections.map((c) => ({
        id: c.id,
        source: "CORRECTION" as const,
        action: `CORRECTION_${c.recordType}`,
        resourceType: c.recordType,
        resourceId: c.recordId,
        actorName: `${c.requestedBy.firstName} ${c.requestedBy.lastName}`,
        actorRole: c.requestedBy.roleCode,
        actorEmail: c.requestedBy.email,
        previousData: { field: c.fieldChanged, old: c.oldValue },
        newData: { field: c.fieldChanged, new: c.newValue, reason: c.changeReason },
        createdAt: c.createdAt.toISOString(),
        createdAtIst: c.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      })),
    ].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());

    return mergedEvents.slice(0, limit);
  }

  /**
   * Automated scan that identifies operational discrepancies and creates deduplicated ManagementAlerts
   */
  public static async scanAndGenerateAlerts() {
    const now = new Date();
    const alertsCreated: string[] = [];

    // 1. Scheduled class failed to start (scheduled > 15 mins ago, still SCHEDULED)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const overdueStartClasses = await db.scheduledClass.findMany({
      where: {
        status: ClassSessionStatus.SCHEDULED,
        scheduledAt: { lte: fifteenMinsAgo, gte: twoHoursAgo },
      },
      include: {
        batch: true,
        trainer: { include: { user: true } },
      },
    });

    for (const cls of overdueStartClasses) {
      const existing = await db.managementAlert.findFirst({
        where: {
          relatedRecordId: cls.id,
          type: "CLASS_START_OVERDUE",
          status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
        },
      });

      if (!existing) {
        const trainerName = cls.trainer
          ? `${cls.trainer.user.firstName} ${cls.trainer.user.lastName}`
          : "Unassigned";
        await db.managementAlert.create({
          data: {
            type: "CLASS_START_OVERDUE",
            title: `Class Overdue for Start: ${cls.title}`,
            description: `Batch ${cls.batch.code} lecture was scheduled for ${cls.scheduledAt.toLocaleTimeString("en-IN")} IST but has not been commenced by faculty (${trainerName}).`,
            severity: AlertSeverity.HIGH,
            sourceModule: "CLASSROOM",
            relatedRecordId: cls.id,
            metadata: { batchId: cls.batchId, trainerId: cls.trainerId },
          },
        });
        alertsCreated.push(`CLASS_START_OVERDUE:${cls.id}`);
      }
    }

    // 2. Attendance finalization overdue (endedAt was > 1 hour ago, but AttendanceRecord not mirrored)
    const endedClasses = await db.scheduledClass.findMany({
      where: {
        status: ClassSessionStatus.COMPLETED,
        endedAt: { lte: new Date(Date.now() - 60 * 60 * 1000) },
      },
      take: 10,
    });

    for (const cls of endedClasses) {
      const mirrored = await db.attendanceRecord.findUnique({
        where: { sessionId: cls.id },
      });

      if (!mirrored) {
        const existing = await db.managementAlert.findFirst({
          where: {
            relatedRecordId: cls.id,
            type: "ATTENDANCE_NOT_FINALIZED",
            status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
          },
        });

        if (!existing) {
          await db.managementAlert.create({
            data: {
              type: "ATTENDANCE_NOT_FINALIZED",
              title: `Live Session Attendance Not Finalized: ${cls.title}`,
              description: `Session concluded over 1 hour ago, but attendance records have not been finalized into LMS roll-call tables.`,
              severity: AlertSeverity.MEDIUM,
              sourceModule: "ATTENDANCE",
              relatedRecordId: cls.id,
            },
          });
          alertsCreated.push(`ATTENDANCE_NOT_FINALIZED:${cls.id}`);
        }
      }
    }

    // 3. YouTube Publishing Failure with >= 2 attempts
    const failedYtJobs = await db.youTubePublishQueue.findMany({
      where: {
        status: "FAILED",
        attemptCount: { gte: 2 },
      },
    });

    for (const yt of failedYtJobs) {
      const existing = await db.managementAlert.findFirst({
        where: {
          relatedRecordId: yt.id,
          type: "YOUTUBE_PUBLISH_FAILED",
          status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] },
        },
      });

      if (!existing) {
        await db.managementAlert.create({
          data: {
            type: "YOUTUBE_PUBLISH_FAILED",
            title: `YouTube Publication Failed: ${yt.videoTitle}`,
            description: `Auto-upload failed after ${yt.attemptCount} attempts. Error: ${yt.errorMessage || "Unknown provider API error"}`,
            severity: AlertSeverity.HIGH,
            sourceModule: "YOUTUBE",
            relatedRecordId: yt.id,
            metadata: { recordingId: yt.recordingId, classId: yt.classId },
          },
        });
        alertsCreated.push(`YOUTUBE_PUBLISH_FAILED:${yt.id}`);
      }
    }

    return { scannedAt: now.toISOString(), newAlertsCount: alertsCreated.length, alertsCreated };
  }

  /**
   * Retrieves management alerts
   */
  public static async getAlerts(params: {
    status?: AlertStatus;
    severity?: AlertSeverity;
    sourceModule?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.ManagementAlertWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.severity) where.severity = params.severity;
    if (params.sourceModule) where.sourceModule = params.sourceModule;

    const [alerts, total] = await Promise.all([
      db.managementAlert.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        include: {
          acknowledgedBy: { select: { firstName: true, lastName: true, email: true } },
          resolvedBy: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      db.managementAlert.count({ where }),
    ]);

    return {
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        description: a.description,
        severity: a.severity,
        status: a.status,
        sourceModule: a.sourceModule,
        relatedRecordId: a.relatedRecordId,
        acknowledgedBy: a.acknowledgedBy
          ? `${a.acknowledgedBy.firstName} ${a.acknowledgedBy.lastName}`
          : null,
        acknowledgedAt: a.acknowledgedAt?.toISOString() || null,
        resolvedBy: a.resolvedBy ? `${a.resolvedBy.firstName} ${a.resolvedBy.lastName}` : null,
        resolvedAt: a.resolvedAt?.toISOString() || null,
        resolutionNotes: a.resolutionNotes,
        createdAt: a.createdAt.toISOString(),
        createdAtIst: a.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Acknowledges an active operational alert
   */
  public static async acknowledgeAlert(alertId: string, userId: string) {
    const alert = await db.managementAlert.update({
      where: { id: alertId },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedById: userId,
        acknowledgedAt: new Date(),
      },
    });

    await AuditService.log({
      actorId: userId,
      action: "MANAGEMENT_ALERT_ACKNOWLEDGED",
      resourceType: "ManagementAlert",
      resourceId: alertId,
      newData: { status: AlertStatus.ACKNOWLEDGED },
    });

    return alert;
  }

  /**
   * Resolves an operational alert with documented resolution notes
   */
  public static async resolveAlert(params: {
    alertId: string;
    userId: string;
    resolutionNotes: string;
  }) {
    const alert = await db.managementAlert.update({
      where: { id: params.alertId },
      data: {
        status: AlertStatus.RESOLVED,
        resolvedById: params.userId,
        resolvedAt: new Date(),
        resolutionNotes: params.resolutionNotes.trim(),
      },
    });

    await AuditService.log({
      actorId: params.userId,
      action: "MANAGEMENT_ALERT_RESOLVED",
      resourceType: "ManagementAlert",
      resourceId: params.alertId,
      newData: { status: AlertStatus.RESOLVED, notes: params.resolutionNotes },
    });

    return alert;
  }

  /**
   * Applies an audited operational record edit with full pre/post state preservation
   */
  public static async editOperationalRecord(params: {
    recordType: "SCHEDULED_CLASS" | "LIVE_ATTENDANCE" | "MOCK_INTERVIEW" | "RECRUITER_INTERVIEW" | "YOUTUBE_QUEUE";
    recordId: string;
    changeReason: string;
    actorId: string;
    actorRole: UserRoleCode;
    updates: Record<string, any>;
  }) {
    if (!params.changeReason || params.changeReason.trim().length < 5) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "A meaningful change reason (at least 5 characters) is mandatory for management corrections.",
      });
    }

    let previousSnapshot: Record<string, any> = {};
    let updatedSnapshot: Record<string, any> = {};

    switch (params.recordType) {
      case "SCHEDULED_CLASS": {
        const existing = await db.scheduledClass.findUnique({
          where: { id: params.recordId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Class not found." });

        previousSnapshot = {
          title: existing.title,
          scheduledAt: existing.scheduledAt.toISOString(),
          durationMin: existing.durationMin,
          trainerId: existing.trainerId,
          status: existing.status,
          agendaNotes: existing.agendaNotes,
        };

        const updateData: Prisma.ScheduledClassUpdateInput = {};
        if (params.updates.title) updateData.title = params.updates.title.trim();
        if (params.updates.scheduledAt) updateData.scheduledAt = new Date(params.updates.scheduledAt);
        if (params.updates.durationMin) updateData.durationMin = Number(params.updates.durationMin);
        if (params.updates.trainerId !== undefined) {
          updateData.trainer = params.updates.trainerId
            ? { connect: { id: params.updates.trainerId } }
            : { disconnect: true };
        }
        if (params.updates.status) updateData.status = params.updates.status as ClassSessionStatus;
        if (params.updates.agendaNotes !== undefined) updateData.agendaNotes = params.updates.agendaNotes;

        const result = await db.scheduledClass.update({
          where: { id: params.recordId },
          data: updateData,
        });

        updatedSnapshot = {
          title: result.title,
          scheduledAt: result.scheduledAt.toISOString(),
          durationMin: result.durationMin,
          trainerId: result.trainerId,
          status: result.status,
          agendaNotes: result.agendaNotes,
        };
        break;
      }

      case "LIVE_ATTENDANCE": {
        const existing = await db.liveClassAttendance.findUnique({
          where: { id: params.recordId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Attendance record not found." });

        previousSnapshot = {
          status: existing.status,
          totalDurationSeconds: existing.totalDurationSeconds,
          attendancePercentage: existing.attendancePercentage,
        };

        const updateData: Prisma.LiveClassAttendanceUpdateInput = {
          isManuallyCorrected: true,
          correctedById: params.actorId,
          correctionReason: params.changeReason.trim(),
        };

        if (params.updates.status) updateData.status = params.updates.status as AttendanceStatus;
        if (params.updates.totalDurationSeconds !== undefined) {
          updateData.totalDurationSeconds = Number(params.updates.totalDurationSeconds);
        }

        const result = await db.liveClassAttendance.update({
          where: { id: params.recordId },
          data: updateData,
        });

        updatedSnapshot = {
          status: result.status,
          totalDurationSeconds: result.totalDurationSeconds,
          attendancePercentage: result.attendancePercentage,
          correctedById: result.correctedById,
        };
        break;
      }

      case "MOCK_INTERVIEW": {
        const existing = await db.mockInterview.findUnique({
          where: { id: params.recordId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Mock interview not found." });

        previousSnapshot = {
          title: existing.title,
          scheduledAt: existing.scheduledAt.toISOString(),
          interviewerId: existing.interviewerId,
          status: existing.status,
          overallScore: existing.overallScore,
        };

        const updateData: Prisma.MockInterviewUpdateInput = {};
        if (params.updates.title) updateData.title = params.updates.title.trim();
        if (params.updates.scheduledAt) updateData.scheduledAt = new Date(params.updates.scheduledAt);
        if (params.updates.interviewerId) {
          updateData.interviewer = { connect: { id: params.updates.interviewerId } };
        }
        if (params.updates.status) updateData.status = params.updates.status;
        if (params.updates.instructions !== undefined) updateData.instructions = params.updates.instructions;
        if (params.updates.recommendations !== undefined) updateData.recommendations = params.updates.recommendations;

        const result = await db.mockInterview.update({
          where: { id: params.recordId },
          data: updateData,
        });

        updatedSnapshot = {
          title: result.title,
          scheduledAt: result.scheduledAt.toISOString(),
          interviewerId: result.interviewerId,
          status: result.status,
        };
        break;
      }

      case "RECRUITER_INTERVIEW": {
        const existing = await db.recruiterInterview.findUnique({
          where: { id: params.recordId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Recruiter interview not found." });

        previousSnapshot = {
          title: existing.title,
          scheduledAt: existing.scheduledAt.toISOString(),
          stage: existing.stage,
          status: existing.status,
          selectionDecision: existing.selectionDecision,
        };

        const updateData: Prisma.RecruiterInterviewUpdateInput = {};
        if (params.updates.title) updateData.title = params.updates.title.trim();
        if (params.updates.scheduledAt) updateData.scheduledAt = new Date(params.updates.scheduledAt);
        if (params.updates.stage) updateData.stage = params.updates.stage;
        if (params.updates.status) updateData.status = params.updates.status;
        if (params.updates.selectionDecision) updateData.selectionDecision = params.updates.selectionDecision;
        if (params.updates.meetingInstructions !== undefined) {
          updateData.meetingInstructions = params.updates.meetingInstructions;
        }

        const result = await db.recruiterInterview.update({
          where: { id: params.recordId },
          data: updateData,
        });

        updatedSnapshot = {
          title: result.title,
          scheduledAt: result.scheduledAt.toISOString(),
          stage: result.stage,
          status: result.status,
          selectionDecision: result.selectionDecision,
        };
        break;
      }

      case "YOUTUBE_QUEUE": {
        const existing = await db.youTubePublishQueue.findUnique({
          where: { id: params.recordId },
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "YouTube queue item not found." });

        previousSnapshot = {
          videoTitle: existing.videoTitle,
          targetPrivacy: existing.targetPrivacy,
          tags: existing.tags,
        };

        const updateData: Prisma.YouTubePublishQueueUpdateInput = {};
        if (params.updates.videoTitle) updateData.videoTitle = params.updates.videoTitle.trim();
        if (params.updates.videoDescription) updateData.videoDescription = params.updates.videoDescription;
        if (params.updates.targetPrivacy) updateData.targetPrivacy = params.updates.targetPrivacy;
        if (params.updates.tags) updateData.tags = params.updates.tags;
        if (params.updates.status) updateData.status = params.updates.status;

        const result = await db.youTubePublishQueue.update({
          where: { id: params.recordId },
          data: updateData,
        });

        updatedSnapshot = {
          videoTitle: result.videoTitle,
          targetPrivacy: result.targetPrivacy,
          tags: result.tags,
          status: result.status,
        };
        break;
      }
    }

    // Record auditable correction log
    const correctionLog = await db.recordCorrectionLog.create({
      data: {
        recordType: params.recordType,
        recordId: params.recordId,
        fieldChanged: Object.keys(params.updates).join(", "),
        oldValue: JSON.stringify(previousSnapshot),
        newValue: JSON.stringify(updatedSnapshot),
        changeReason: params.changeReason.trim(),
        status: CorrectionStatus.APPLIED,
        requestedById: params.actorId,
        approvedById: params.actorId,
        approvedAt: new Date(),
      },
    });

    // Write to central immutable AuditLog
    await AuditService.log({
      actorId: params.actorId,
      action: `MANAGEMENT_CORRECTION_${params.recordType}`,
      resourceType: params.recordType,
      resourceId: params.recordId,
      previousData: previousSnapshot,
      newData: {
        ...updatedSnapshot,
        changeReason: params.changeReason.trim(),
        correctionLogId: correctionLog.id,
      },
    });

    return { success: true, correctionId: correctionLog.id, updatedSnapshot };
  }

  /**
   * Generates a structured operational report dataset for CSV/PDF export
   */
  public static async generateOperationalReport(params: {
    reportType: "DAILY_OPERATIONS" | "ATTENDANCE_SUMMARY" | "INTERVIEW_OUTCOMES" | "AUDIT_TRAIL";
    dateFrom?: string;
    dateTo?: string;
  }) {
    const from = params.dateFrom ? new Date(params.dateFrom) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const to = params.dateTo ? new Date(params.dateTo) : new Date();

    switch (params.reportType) {
      case "DAILY_OPERATIONS": {
        const classes = await db.scheduledClass.findMany({
          where: { scheduledAt: { gte: from, lte: to } },
          include: {
            batch: { include: { course: true } },
            trainer: { include: { user: true } },
            _count: { select: { liveAttendances: true } },
          },
          orderBy: { scheduledAt: "desc" },
        });

        const rows = classes.map((c) => ({
          ClassId: c.id,
          Title: c.title,
          BatchCode: c.batch.code,
          BatchName: c.batch.name,
          Course: c.batch.course.title,
          Faculty: c.trainer ? `${c.trainer.user.firstName} ${c.trainer.user.lastName}` : "Unassigned",
          Status: c.status,
          ScheduledTime: c.scheduledAt.toISOString(),
          ScheduledTimeIST: c.scheduledAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          DurationMin: c.durationMin,
          JoinedStudentsCount: c._count.liveAttendances,
        }));

        return { reportType: params.reportType, totalRecords: rows.length, generatedAt: new Date().toISOString(), rows };
      }

      case "ATTENDANCE_SUMMARY": {
        const attendances = await db.liveClassAttendance.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: {
            student: { include: { user: true } },
            class: { include: { batch: true } },
          },
          orderBy: { createdAt: "desc" },
        });

        const rows = attendances.map((a) => ({
          AttendanceId: a.id,
          ClassTitle: a.class.title,
          BatchCode: a.class.batch.code,
          StudentCode: a.student.studentId,
          StudentName: a.student.user ? `${a.student.user.firstName} ${a.student.user.lastName}` : "Unknown",
          JoinTime: a.firstJoinedAt?.toISOString() || "",
          TotalSeconds: a.totalDurationSeconds,
          Percentage: a.attendancePercentage,
          Status: a.status,
          ManuallyCorrected: a.isManuallyCorrected ? "YES" : "NO",
          CorrectionReason: a.correctionReason || "",
        }));

        return { reportType: params.reportType, totalRecords: rows.length, generatedAt: new Date().toISOString(), rows };
      }

      case "INTERVIEW_OUTCOMES": {
        const mocks = await db.mockInterview.findMany({
          where: { scheduledAt: { gte: from, lte: to } },
          include: { student: { include: { user: true } }, interviewer: true },
          orderBy: { scheduledAt: "desc" },
        });

        const rows = mocks.map((m) => ({
          InterviewId: m.id,
          Type: m.interviewType,
          Title: m.title,
          Student: `${m.student.user.firstName} ${m.student.user.lastName}`,
          Interviewer: `${m.interviewer.firstName} ${m.interviewer.lastName}`,
          Status: m.status,
          ScoreCommunication: m.scoreCommunication || 0,
          ScoreTechnical: m.scoreTechnical || 0,
          ScoreConfidence: m.scoreConfidence || 0,
          ScoreProblemSolving: m.scoreProblemSolving || 0,
          OverallScore: m.overallScore || 0,
          ScheduledAt: m.scheduledAt.toISOString(),
          Recommendations: m.recommendations || "",
        }));

        return { reportType: params.reportType, totalRecords: rows.length, generatedAt: new Date().toISOString(), rows };
      }

      case "AUDIT_TRAIL": {
        const logs = await db.auditLog.findMany({
          where: { createdAt: { gte: from, lte: to } },
          include: { actor: true },
          take: 500,
          orderBy: { createdAt: "desc" },
        });

        const rows = logs.map((l) => ({
          LogId: l.id,
          Action: l.action,
          ResourceType: l.resourceType,
          ResourceId: l.resourceId,
          Actor: l.actor ? `${l.actor.firstName} ${l.actor.lastName} (${l.actor.roleCode})` : "SYSTEM",
          ActorEmail: l.actor?.email || "",
          CreatedAt: l.createdAt.toISOString(),
          CreatedAtIST: l.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
          IpAddress: l.ipAddress || "",
        }));

        return { reportType: params.reportType, totalRecords: rows.length, generatedAt: new Date().toISOString(), rows };
      }
    }
  }
}
