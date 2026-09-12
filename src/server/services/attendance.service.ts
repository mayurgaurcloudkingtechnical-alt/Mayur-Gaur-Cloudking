import { UserRoleCode, EnrollmentStatus, AttendanceStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "./audit.service";
import { TrainerService } from "./trainer.service";

export interface AttendanceEntryInput {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

export class AttendanceService {
  /**
   * Derives session attendance roster server-side from active enrollments only.
   * Cross-trainer access is strictly prohibited.
   */
  static async getSessionAttendanceRoster(ctx: any, sessionId: string) {
    const session = await ctx.db.scheduledClass.findUnique({
      where: { id: sessionId },
      include: {
        batch: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            trainers: true,
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              include: {
                student: {
                  include: {
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                  },
                },
              },
              orderBy: { student: { studentId: "asc" } },
            },
          },
        },
        attendance: {
          include: {
            entries: true,
            markedBy: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class session not found." });
    }

    // Role and trainer scoping check
    await TrainerService.verifyTrainerBatchAccess(ctx, session.batchId);

    const existingEntriesMap = new Map<string, any>();
    if (session.attendance) {
      for (const entry of session.attendance.entries) {
        existingEntriesMap.set(entry.studentId, entry);
      }
    }

    // Build roster exclusively from verified ACTIVE batch enrollments
    const roster = session.batch.enrollments.map((enr: any) => {
      const existing = existingEntriesMap.get(enr.student.id);
      return {
        enrollmentId: enr.id,
        studentProfileId: enr.student.id,
        studentId: enr.student.studentId,
        firstName: enr.student.user.firstName,
        lastName: enr.student.user.lastName,
        email: enr.student.user.email,
        status: existing?.status ?? AttendanceStatus.PRESENT,
        remark: existing?.remark ?? null,
      };
    });

    const isMarked = !!session.attendance;
    const summary = {
      totalStudents: roster.length,
      presentCount: roster.filter((r: any) => r.status === AttendanceStatus.PRESENT).length,
      absentCount: roster.filter((r: any) => r.status === AttendanceStatus.ABSENT).length,
      lateCount: roster.filter((r: any) => r.status === AttendanceStatus.LATE).length,
      excusedCount: roster.filter((r: any) => r.status === AttendanceStatus.EXCUSED).length,
    };

    return {
      session: {
        id: session.id,
        title: session.title,
        scheduledAt: session.scheduledAt,
        durationMin: session.durationMin,
        mode: session.mode,
        location: session.location,
        status: session.status,
        topicCovered: session.attendance?.topicCovered ?? session.topicCovered ?? "",
        batchId: session.batch.id,
        batchCode: session.batch.code,
        batchName: session.batch.name,
        courseTitle: session.batch.course.title,
      },
      isMarked,
      markedAt: session.attendance?.updatedAt ?? null,
      markedByName: session.attendance?.markedBy
        ? `${session.attendance.markedBy.firstName} ${session.attendance.markedBy.lastName}`
        : null,
      roster,
      summary,
    };
  }

  /**
   * Atomically saves or updates class attendance using a Prisma transaction.
   * Validates that student profiles belong to active enrollments in the session's batch.
   */
  static async saveSessionAttendance(
    ctx: any,
    input: {
      sessionId: string;
      topicCovered?: string;
      entries: AttendanceEntryInput[];
    }
  ) {
    const session = await ctx.db.scheduledClass.findUnique({
      where: { id: input.sessionId },
      include: {
        batch: {
          include: {
            trainers: true,
            enrollments: {
              where: { status: EnrollmentStatus.ACTIVE },
              select: { id: true, studentId: true },
            },
          },
        },
        attendance: true,
      },
    });

    if (!session) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Class session not found." });
    }

    await TrainerService.verifyTrainerBatchAccess(ctx, session.batchId);

    // Build map of valid active student profile IDs to enrollment IDs
    const activeStudentMap = new Map<string, string>();
    for (const enr of session.batch.enrollments) {
      activeStudentMap.set(enr.studentId, enr.id);
    }

    // Server-side validation: client submitted entries must belong to active enrolled students
    for (const entry of input.entries) {
      if (!activeStudentMap.has(entry.studentId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Student with profile ID ${entry.studentId} is not an active enrolled student in this cohort.`,
        });
      }
    }

    const wasAlreadyMarked = !!session.attendance;

    // Atomic persistence in a single Prisma transaction
    const result = await ctx.db.$transaction(async (tx: any) => {
      // 1. Upsert parent AttendanceRecord
      const record = await tx.attendanceRecord.upsert({
        where: { sessionId: input.sessionId },
        create: {
          batchId: session.batchId,
          sessionId: input.sessionId,
          date: session.scheduledAt,
          markedById: ctx.user.id,
          topicCovered: input.topicCovered?.trim() || null,
        },
        update: {
          markedById: ctx.user.id,
          topicCovered: input.topicCovered?.trim() || null,
          updatedAt: new Date(),
        },
      });

      // 2. Upsert each student's attendance entry with unique constraint [recordId, studentId]
      for (const entry of input.entries) {
        await tx.attendanceEntry.upsert({
          where: {
            recordId_studentId: {
              recordId: record.id,
              studentId: entry.studentId,
            },
          },
          create: {
            recordId: record.id,
            studentId: entry.studentId,
            enrollmentId: activeStudentMap.get(entry.studentId) || null,
            status: entry.status,
            remark: entry.remark?.trim() || null,
          },
          update: {
            status: entry.status,
            remark: entry.remark?.trim() || null,
            updatedAt: new Date(),
          },
        });
      }

      // 3. Mark ScheduledClass as COMPLETED if it was SCHEDULED, update topicCovered
      await tx.scheduledClass.update({
        where: { id: input.sessionId },
        data: {
          status: session.status === "SCHEDULED" ? "COMPLETED" : session.status,
          topicCovered: input.topicCovered?.trim() || session.topicCovered,
        },
      });

      return record;
    });

    const presentCount = input.entries.filter((e) => e.status === AttendanceStatus.PRESENT).length;
    const absentCount = input.entries.filter((e) => e.status === AttendanceStatus.ABSENT).length;
    const lateCount = input.entries.filter((e) => e.status === AttendanceStatus.LATE).length;
    const excusedCount = input.entries.filter((e) => e.status === AttendanceStatus.EXCUSED).length;

    await AuditService.log({
      actorId: ctx.user.id,
      action: wasAlreadyMarked ? "ATTENDANCE_CORRECTED" : "ATTENDANCE_SUBMITTED",
      resourceType: "AttendanceRecord",
      resourceId: result.id,
      newData: {
        sessionId: input.sessionId,
        batchId: session.batchId,
        totalEntries: input.entries.length,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
      },
    });

    return {
      success: true,
      recordId: result.id,
      summary: {
        total: input.entries.length,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
      },
    };
  }

  /**
   * Aggregates attendance statistics for an entire cohort batch.
   */
  static async getBatchAttendanceStats(ctx: any, batchId: string) {
    await TrainerService.verifyTrainerBatchAccess(ctx, batchId);

    const records = await ctx.db.attendanceRecord.findMany({
      where: { batchId },
      orderBy: { date: "desc" },
      include: {
        session: { select: { id: true, title: true, scheduledAt: true } },
        entries: true,
      },
    });

    let totalEntries = 0;
    let totalPresentOrLate = 0;

    const studentMap = new Map<string, { present: number; total: number }>();

    for (const record of records) {
      for (const entry of record.entries) {
        totalEntries += 1;
        if (entry.status === AttendanceStatus.PRESENT || entry.status === AttendanceStatus.LATE) {
          totalPresentOrLate += 1;
        }

        const curr = studentMap.get(entry.studentId) || { present: 0, total: 0 };
        curr.total += 1;
        if (entry.status === AttendanceStatus.PRESENT || entry.status === AttendanceStatus.LATE) {
          curr.present += 1;
        }
        studentMap.set(entry.studentId, curr);
      }
    }

    const overallPercentage = totalEntries > 0 ? Math.round((totalPresentOrLate / totalEntries) * 100) : 0;

    return {
      sessionsCount: records.length,
      totalEntries,
      overallPercentage,
      recentRecords: records.slice(0, 10).map((r: any) => ({
        id: r.id,
        date: r.date,
        topicCovered: r.topicCovered,
        sessionTitle: r.session?.title ?? "Class Session",
        totalMarked: r.entries.length,
        present: r.entries.filter((e: any) => e.status === AttendanceStatus.PRESENT || e.status === AttendanceStatus.LATE).length,
      })),
    };
  }
}
