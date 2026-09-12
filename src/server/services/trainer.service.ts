import { UserRoleCode, BatchStatus, EnrollmentStatus, ContentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export class TrainerService {
  /**
   * Resolves the trainer profile associated with the authenticated user.
   */
  static async getTrainerProfile(ctx: any) {
    const role = ctx.user.roleCode as UserRoleCode;
    const isSuperAdmin = role === UserRoleCode.SUPER_ADMIN || role === UserRoleCode.DIRECTOR || role === UserRoleCode.ADMIN;

    let trainerProfile = await ctx.db.trainerProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!trainerProfile && isSuperAdmin) {
      trainerProfile = await ctx.db.trainerProfile.findFirst();
    }

    if (!trainerProfile && !isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Faculty trainer profile record not found. Please contact administration.",
      });
    }

    return { trainerProfile, isSuperAdmin };
  }

  /**
   * Verifies that the authenticated trainer is assigned to the target batch.
   */
  static async verifyTrainerBatchAccess(ctx: any, batchId: string) {
    const { trainerProfile, isSuperAdmin } = await this.getTrainerProfile(ctx);

    const batch = await ctx.db.batch.findUnique({
      where: { id: batchId },
      include: {
        trainers: true,
        course: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!batch) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Batch cohort not found." });
    }

    if (!isSuperAdmin) {
      const isAssigned = batch.trainers.some((t: any) => t.trainerId === trainerProfile?.id);
      if (!isAssigned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not authorized to view or manage this batch.",
        });
      }
    }

    return { batch, trainerProfile, isSuperAdmin };
  }

  /**
   * Overview metrics for the trainer faculty dashboard.
   */
  static async getDashboardOverview(ctx: any) {
    const { trainerProfile, isSuperAdmin } = await this.getTrainerProfile(ctx);
    const trainerId = trainerProfile?.id;

    const batchWhere = isSuperAdmin
      ? {}
      : { trainers: { some: { trainerId } } };

    const assignedBatches = await ctx.db.batch.findMany({
      where: batchWhere,
      include: {
        course: { select: { id: true, title: true, slug: true } },
        enrollments: { where: { status: EnrollmentStatus.ACTIVE } },
        classes: { orderBy: { scheduledAt: "asc" } },
      },
    });

    const activeStudentsCount = assignedBatches.reduce(
      (acc: number, b: any) => acc + b.enrollments.length,
      0
    );

    const now = new Date();
    const classWhere = isSuperAdmin
      ? { scheduledAt: { gte: now } }
      : {
          scheduledAt: { gte: now },
          OR: [
            { trainerId },
            { batch: { trainers: { some: { trainerId } } } },
          ],
        };

    const upcomingClasses = await ctx.db.scheduledClass.findMany({
      where: classWhere,
      orderBy: { scheduledAt: "asc" },
      take: 6,
      include: {
        batch: { select: { id: true, code: true, name: true } },
        trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
        attendance: { select: { id: true } },
      },
    });

    const attendanceRecordsCount = await ctx.db.attendanceRecord.count({
      where: isSuperAdmin ? {} : { batch: { trainers: { some: { trainerId } } } },
    });

    return {
      assignedBatchCount: assignedBatches.length,
      activeStudentsCount,
      scheduledClassCount: upcomingClasses.length,
      attendanceLoggedCount: attendanceRecordsCount,
      batches: assignedBatches.slice(0, 5).map((b: any) => ({
        id: b.id,
        code: b.code,
        name: b.name,
        courseTitle: b.course.title,
        status: b.status,
        deliveryMode: b.deliveryMode,
        activeStudents: b.enrollments.length,
        classesCount: b.classes.length,
      })),
      upcomingClasses: upcomingClasses.map((c: any) => ({
        id: c.id,
        batchId: c.batch.id,
        batchCode: c.batch.code,
        batchName: c.batch.name,
        title: c.title,
        scheduledAt: c.scheduledAt,
        durationMin: c.durationMin,
        mode: c.mode,
        location: c.location,
        status: c.status,
        hasAttendance: !!c.attendance,
      })),
    };
  }

  /**
   * Lists batches assigned to the faculty trainer with optional status filtering.
   */
  static async getAssignedBatches(ctx: any, filterStatus?: BatchStatus) {
    const { trainerProfile, isSuperAdmin } = await this.getTrainerProfile(ctx);
    const trainerId = trainerProfile?.id;

    const where: any = {};
    if (!isSuperAdmin) {
      where.trainers = { some: { trainerId } };
    }
    if (filterStatus) {
      where.status = filterStatus;
    }

    const batches = await ctx.db.batch.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        course: { select: { id: true, title: true, slug: true, durationWeeks: true } },
        trainers: {
          include: {
            trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          select: { id: true },
        },
        classes: {
          select: { id: true, status: true, scheduledAt: true },
        },
      },
    });

    return batches.map((b: any) => {
      const completedClasses = b.classes.filter((c: any) => c.status === "COMPLETED").length;
      return {
        id: b.id,
        code: b.code,
        name: b.name,
        courseId: b.course.id,
        courseTitle: b.course.title,
        courseSlug: b.course.slug,
        durationWeeks: b.course.durationWeeks,
        startDate: b.startDate,
        endDate: b.endDate,
        status: b.status,
        maxCapacity: b.maxCapacity,
        deliveryMode: b.deliveryMode,
        location: b.location,
        activeStudentCount: b.enrollments.length,
        totalClasses: b.classes.length,
        completedClasses,
        trainers: b.trainers.map((t: any) => ({
          id: t.trainer.id,
          name: `${t.trainer.user.firstName} ${t.trainer.user.lastName}`,
          isPrimary: t.isPrimary,
        })),
      };
    });
  }

  /**
   * Returns complete batch workspace details, including scheduled sessions and teaching roster.
   * Privacy boundary: strictly excludes financial data, discounts, passwords, or personal notes.
   */
  static async getBatchWorkspace(ctx: any, batchId: string) {
    await this.verifyTrainerBatchAccess(ctx, batchId);

    const batch = await ctx.db.batch.findUnique({
      where: { id: batchId },
      include: {
        course: {
          include: {
            modules: {
              where: { status: ContentStatus.PUBLISHED, deletedAt: null },
              orderBy: { sortOrder: "asc" },
              include: {
                lessons: {
                  where: { status: ContentStatus.PUBLISHED, deletedAt: null },
                  select: { id: true, title: true, type: true, durationMin: true },
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
        trainers: {
          include: {
            trainer: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
        classes: {
          orderBy: { scheduledAt: "asc" },
          include: {
            attendance: { select: { id: true, topicCovered: true, createdAt: true } },
            coveredLesson: { select: { id: true, title: true } },
          },
        },
        enrollments: {
          where: { status: EnrollmentStatus.ACTIVE },
          include: {
            student: {
              include: {
                user: { select: { firstName: true, lastName: true, email: true } },
              },
            },
            lessonProgress: {
              where: { isCompleted: true },
              select: { lessonId: true },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found." });
    }

    const allPublishedLessons = batch.course.modules.flatMap((m: any) => m.lessons);
    const totalPublishedLessons = allPublishedLessons.length;

    const roster = batch.enrollments.map((enr: any) => {
      const completedCount = enr.lessonProgress.length;
      const progressPercent = totalPublishedLessons > 0
        ? Math.round((completedCount / totalPublishedLessons) * 100)
        : 0;

      return {
        enrollmentId: enr.id,
        studentProfileId: enr.student.id,
        studentId: enr.student.studentId,
        firstName: enr.student.user.firstName,
        lastName: enr.student.user.lastName,
        email: enr.student.user.email,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        completedLessons: completedCount,
        progressPercent,
      };
    });

    return {
      batch: {
        id: batch.id,
        code: batch.code,
        name: batch.name,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        deliveryMode: batch.deliveryMode,
        location: batch.location,
        maxCapacity: batch.maxCapacity,
        courseTitle: batch.course.title,
        courseSlug: batch.course.slug,
        courseModules: batch.course.modules.map((m: any) => ({
          id: m.id,
          title: m.title,
          lessons: m.lessons,
        })),
        trainers: batch.trainers.map((t: any) => ({
          id: t.trainer.id,
          name: `${t.trainer.user.firstName} ${t.trainer.user.lastName}`,
          email: t.trainer.user.email,
          isPrimary: t.isPrimary,
        })),
      },
      sessions: batch.classes.map((c: any) => ({
        id: c.id,
        title: c.title,
        scheduledAt: c.scheduledAt,
        durationMin: c.durationMin,
        mode: c.mode,
        location: c.location,
        status: c.status,
        statusReason: c.statusReason,
        topicCovered: c.topicCovered,
        coveredLessonTitle: c.coveredLesson?.title ?? null,
        agendaNotes: c.agendaNotes,
        hasAttendance: !!c.attendance,
        attendanceId: c.attendance?.id ?? null,
      })),
      roster,
    };
  }
}
