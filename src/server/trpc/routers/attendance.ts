import { z } from "zod";
import { router, requireRoleProcedure } from "../init";
import { AttendanceStatus, UserRoleCode } from "@prisma/client";
import { AttendanceService } from "@/server/services/attendance.service";

export const attendanceRouter = router({
  /**
   * Retrieves session details and active student attendance roster.
   */
  getSessionRoster: requireRoleProcedure([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return AttendanceService.getSessionAttendanceRoster(ctx, input.sessionId);
    }),

  /**
   * Atomically records or updates attendance for a class session.
   */
  saveSessionAttendance: requireRoleProcedure([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(
      z.object({
        sessionId: z.string(),
        topicCovered: z.string().optional(),
        entries: z.array(
          z.object({
            studentId: z.string(),
            status: z.nativeEnum(AttendanceStatus),
            remark: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return AttendanceService.saveSessionAttendance(ctx, input);
    }),

  /**
   * Cohort batch attendance statistics.
   */
  getBatchAttendanceStats: requireRoleProcedure([
    UserRoleCode.TRAINER,
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ])
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return AttendanceService.getBatchAttendanceStats(ctx, input.batchId);
    }),

  /**
   * Institutional attendance oversight across all cohorts.
   */
  getInstitutionalAttendance: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
  ])
    .input(
      z
        .object({
          batchId: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return AttendanceService.getInstitutionalAttendance(ctx, input);
    }),

  /**
   * Complete batch attendance workspace for daily roll-call matching Attendance.pdf.
   */
  getBatchAttendanceWorkspace: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.TRAINER,
  ])
    .input(
      z.object({
        batchId: z.string(),
        date: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const batch = await ctx.db.batch.findUnique({
        where: { id: input.batchId },
        include: {
          course: {
            include: {
              modules: {
                include: { lessons: true },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
          trainers: {
            include: {
              trainer: {
                include: {
                  user: {
                    select: { firstName: true, lastName: true },
                  },
                },
              },
            },
          },
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      email: true,
                      phone: true,
                    },
                  },
                },
              },
            },
            orderBy: { student: { studentId: "asc" } },
          },
        },
      });

      if (!batch) {
        return null;
      }

      const targetDate = input.date ? new Date(input.date) : new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingRecord = await ctx.db.attendanceRecord.findFirst({
        where: {
          batchId: input.batchId,
          date: { gte: startOfDay, lte: endOfDay },
        },
        include: { entries: true },
      });

      const entryMap = new Map<string, AttendanceStatus>();
      if (existingRecord) {
        for (const e of existingRecord.entries) {
          entryMap.set(e.studentId, e.status);
        }
      }

      const students = batch.enrollments.map((enr) => {
        const studentProfile = enr.student;
        const currentStatus = entryMap.get(studentProfile.id) || AttendanceStatus.PRESENT;
        return {
          enrollmentId: enr.id,
          studentProfileId: studentProfile.id,
          studentId: studentProfile.studentId,
          name: `${studentProfile.user.firstName} ${studentProfile.user.lastName}`,
          email: studentProfile.user.email,
          phone: studentProfile.user.phone || studentProfile.guardianPhone || "—",
          status: currentStatus,
        };
      });

      const topics: string[] = [];
      for (const mod of batch.course.modules) {
        topics.push(mod.title);
        for (const les of mod.lessons) {
          topics.push(`${mod.title} - ${les.title}`);
        }
      }

      return {
        batch: {
          id: batch.id,
          name: batch.name,
          code: batch.code,
          courseTitle: batch.course.title,
          startDate: batch.startDate,
          endDate: batch.endDate,
          location: batch.location || "Softlab Global • Lab A",
          deliveryMode: batch.deliveryMode,
        },
        topicCovered: existingRecord?.topicCovered || (topics[0] || "Overview & Fundamentals"),
        topics: topics.length > 0 ? topics : ["Overview & Fundamentals", "Practical Labs", "Project Work"],
        recordId: existingRecord?.id || null,
        students,
      };
    }),

  /**
   * Directly save or update batch attendance for a selected date.
   */
  saveBatchAttendanceDirect: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.MANAGER,
    UserRoleCode.TRAINER,
  ])
    .input(
      z.object({
        batchId: z.string(),
        date: z.string(),
        topicCovered: z.string().optional(),
        entries: z.array(
          z.object({
            studentId: z.string(),
            status: z.nativeEnum(AttendanceStatus),
            remark: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const targetDate = new Date(input.date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      let record = await ctx.db.attendanceRecord.findFirst({
        where: {
          batchId: input.batchId,
          date: { gte: startOfDay, lte: endOfDay },
        },
      });

      if (!record) {
        record = await ctx.db.attendanceRecord.create({
          data: {
            batchId: input.batchId,
            date: targetDate,
            markedById: ctx.user.id,
            topicCovered: input.topicCovered || null,
          },
        });
      } else {
        await ctx.db.attendanceRecord.update({
          where: { id: record.id },
          data: {
            topicCovered: input.topicCovered || null,
            markedById: ctx.user.id,
            updatedAt: new Date(),
          },
        });
      }

      for (const entry of input.entries) {
        await ctx.db.attendanceEntry.upsert({
          where: {
            recordId_studentId: {
              recordId: record.id,
              studentId: entry.studentId,
            },
          },
          create: {
            recordId: record.id,
            studentId: entry.studentId,
            status: entry.status,
            remark: entry.remark || null,
          },
          update: {
            status: entry.status,
            remark: entry.remark || null,
            updatedAt: new Date(),
          },
        });
      }

      return { success: true, recordId: record.id };
    }),
});

