import { db } from "@/server/db/client";
import { AttendanceStatus } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";

export interface RecordSessionEventParams {
  classId: string;
  userId: string;
  userRole: string;
  eventType: "JOINED" | "LEFT" | "RECONNECTED" | "HAND_RAISED" | "MIC_TOGGLED" | "CAM_TOGGLED" | "CHAT_SENT";
  metadata?: any;
}

export class LiveAttendanceService {
  /**
   * Log real-time participant session event and update duration & status
   */
  public static async recordParticipantEvent(params: RecordSessionEventParams) {
    const now = new Date();

    // 1. Log immutable audit event
    await db.liveClassSessionEvent.create({
      data: {
        classId: params.classId,
        userId: params.userId,
        userRole: params.userRole,
        eventType: params.eventType,
        timestamp: now,
        metadata: params.metadata || {},
      },
    });

    // If event is from a student, update their live attendance record
    const student = await db.studentProfile.findUnique({
      where: { userId: params.userId },
      select: { id: true },
    });

    if (!student) return;

    const scheduledClass = await db.scheduledClass.findUnique({
      where: { id: params.classId },
      select: { batchId: true, durationMin: true },
    });

    if (!scheduledClass) return;

    let record = await db.liveClassAttendance.findUnique({
      where: {
        classId_studentId: {
          classId: params.classId,
          studentId: student.id,
        },
      },
    });

    if (!record) {
      record = await db.liveClassAttendance.create({
        data: {
          classId: params.classId,
          studentId: student.id,
          batchId: scheduledClass.batchId,
          firstJoinedAt: params.eventType === "JOINED" ? now : undefined,
          joinCount: params.eventType === "JOINED" ? 1 : 0,
          totalDurationSeconds: 0,
          attendancePercentage: 0,
          status: AttendanceStatus.ABSENT,
        },
      });
    }

    if (params.eventType === "JOINED" || params.eventType === "RECONNECTED") {
      await db.liveClassAttendance.update({
        where: { id: record.id },
        data: {
          firstJoinedAt: record.firstJoinedAt || now,
          joinCount: { increment: 1 },
        },
      });
    } else if (params.eventType === "LEFT") {
      // Calculate delta duration
      const lastJoinEvent = await db.liveClassSessionEvent.findFirst({
        where: {
          classId: params.classId,
          userId: params.userId,
          eventType: { in: ["JOINED", "RECONNECTED"] },
        },
        orderBy: { timestamp: "desc" },
      });

      let addedSeconds = 0;
      if (lastJoinEvent) {
        const diffMs = now.getTime() - new Date(lastJoinEvent.timestamp).getTime();
        addedSeconds = Math.max(0, Math.floor(diffMs / 1000));
      }

      const newTotalSeconds = (record.totalDurationSeconds || 0) + addedSeconds;
      const expectedTotalSeconds = (scheduledClass.durationMin || 60) * 60;
      const attendancePercentage = Math.min(
        100,
        parseFloat(((newTotalSeconds / expectedTotalSeconds) * 100).toFixed(1))
      );

      // Standard policy: >= 75% Present, 30% - 74% Partial, < 30% Absent
      let finalStatus: AttendanceStatus = AttendanceStatus.ABSENT;
      if (attendancePercentage >= 75) {
        finalStatus = AttendanceStatus.PRESENT;
      } else if (attendancePercentage >= 30) {
        finalStatus = AttendanceStatus.LATE;
      }

      await db.liveClassAttendance.update({
        where: { id: record.id },
        data: {
          lastLeftAt: now,
          totalDurationSeconds: newTotalSeconds,
          attendancePercentage,
          status: record.isManuallyCorrected ? record.status : finalStatus,
        },
      });
    }
  }

  /**
   * Periodic heartbeat from client to ensure duration increments accurately even during abrupt network disconnects
   */
  public static async recordHeartbeat(params: { classId: string; userId: string; deltaSeconds: number }) {
    const student = await db.studentProfile.findUnique({
      where: { userId: params.userId },
      select: { id: true },
    });
    if (!student) return;

    const scheduledClass = await db.scheduledClass.findUnique({
      where: { id: params.classId },
      select: { batchId: true, durationMin: true },
    });
    if (!scheduledClass) return;

    const delta = Math.min(params.deltaSeconds, 60); // Maximum 60s per heartbeat to prevent client spoofing

    const record = await db.liveClassAttendance.findUnique({
      where: {
        classId_studentId: {
          classId: params.classId,
          studentId: student.id,
        },
      },
    });

    if (record) {
      const newTotalSeconds = (record.totalDurationSeconds || 0) + delta;
      const expectedTotalSeconds = (scheduledClass.durationMin || 60) * 60;
      const attendancePercentage = Math.min(
        100,
        parseFloat(((newTotalSeconds / expectedTotalSeconds) * 100).toFixed(1))
      );

      let finalStatus: AttendanceStatus = AttendanceStatus.ABSENT;
      if (attendancePercentage >= 75) {
        finalStatus = AttendanceStatus.PRESENT;
      } else if (attendancePercentage >= 30) {
        finalStatus = AttendanceStatus.LATE;
      }

      await db.liveClassAttendance.update({
        where: { id: record.id },
        data: {
          totalDurationSeconds: newTotalSeconds,
          attendancePercentage,
          status: record.isManuallyCorrected ? record.status : finalStatus,
          lastLeftAt: new Date(),
        },
      });
    }
  }

  /**
   * Finalizes class attendance and mirrors to LMS AttendanceRecord / AttendanceEntry
   */
  public static async finalizeClassAttendance(classId: string, markerUserId: string) {
    const scheduledClass = await db.scheduledClass.findUnique({
      where: { id: classId },
      include: {
        batch: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              select: { id: true, studentId: true },
            },
          },
        },
      },
    });

    if (!scheduledClass) return;

    // Create or find AttendanceRecord
    let attendanceRecord = await db.attendanceRecord.findUnique({
      where: { sessionId: classId },
    });

    if (!attendanceRecord) {
      attendanceRecord = await db.attendanceRecord.create({
        data: {
          batchId: scheduledClass.batchId,
          sessionId: classId,
          markedById: markerUserId,
          topicCovered: scheduledClass.topicCovered || scheduledClass.title,
          date: scheduledClass.scheduledAt,
        },
      });
    }

    // Mirror all enrolled students' live attendances into AttendanceEntry
    const liveAttendances = await db.liveClassAttendance.findMany({
      where: { classId },
    });

    const liveMap = new Map(liveAttendances.map((a) => [a.studentId, a]));

    for (const enrollment of scheduledClass.batch.enrollments) {
      const live = liveMap.get(enrollment.studentId);
      const status = live?.status || AttendanceStatus.ABSENT;
      const durationMins = Math.round((live?.totalDurationSeconds || 0) / 60);
      const remark = live
        ? `Live Class Attendance: ${live.attendancePercentage}% (${durationMins} mins)`
        : "Absent from live session";

      await db.attendanceEntry.upsert({
        where: {
          recordId_studentId: {
            recordId: attendanceRecord.id,
            studentId: enrollment.studentId,
          },
        },
        create: {
          recordId: attendanceRecord.id,
          studentId: enrollment.studentId,
          enrollmentId: enrollment.id,
          status,
          remark,
        },
        update: {
          status,
          remark,
        },
      });
    }
  }

  /**
   * Manual correction with full audit logging
   */
  public static async correctAttendance(params: {
    attendanceId: string;
    newStatus: AttendanceStatus;
    reason: string;
    actorUserId: string;
  }) {
    const existing = await db.liveClassAttendance.findUnique({
      where: { id: params.attendanceId },
    });

    if (!existing) {
      throw new Error("Attendance record not found.");
    }

    const updated = await db.liveClassAttendance.update({
      where: { id: params.attendanceId },
      data: {
        status: params.newStatus,
        isManuallyCorrected: true,
        correctedById: params.actorUserId,
        correctionReason: params.reason,
      },
    });

    await AuditService.log({
      actorId: params.actorUserId,
      action: "ATTENDANCE_CORRECTED",
      resourceType: "LiveClassAttendance",
      resourceId: updated.id,
      previousData: { status: existing.status },
      newData: { status: updated.status, reason: params.reason },
    });

    return updated;
  }
}
