import { ContentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { LearningProgressService } from "./learning-progress.service";
import { S3StorageService } from "@/server/storage/s3-storage.service";

export class LearningService {
  /**
   * Returns dashboard overview metrics, enrollments, and upcoming cohort classes.
   */
  static async getDashboardOverview(ctx: any) {
    const { studentProfile, isSuperAdmin } = await LearningProgressService.getStudentProfile(ctx);
    if (!studentProfile && !isSuperAdmin) {
      return {
        enrollments: [],
        stats: { enrolledCoursesCount: 0, totalLessonsCount: 0, completedLessonsCount: 0, overallProgressPercent: 0 },
        upcomingClasses: [],
      };
    }

    const enrollments = await ctx.db.enrollment.findMany({
      where: studentProfile ? { studentId: studentProfile.id } : undefined,
      include: {
        course: {
          include: {
            modules: {
              where: { status: ContentStatus.PUBLISHED, deletedAt: null },
              include: {
                lessons: {
                  where: { status: ContentStatus.PUBLISHED, deletedAt: null },
                  select: { id: true, title: true, durationMin: true },
                },
              },
            },
          },
        },
        batch: true,
        lessonProgress: {
          where: { isCompleted: true },
          select: { lessonId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    let totalLessonsAll = 0;
    let completedLessonsAll = 0;

    const mappedEnrollments = enrollments.map((enr: any) => {
      const allLessons = enr.course.modules.flatMap((m: any) => m.lessons);
      const totalLessons = allLessons.length;
      const completedSet = new Set(enr.lessonProgress.map((p: any) => p.lessonId));
      const completedCount = allLessons.filter((l: any) => completedSet.has(l.id)).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      totalLessonsAll += totalLessons;
      completedLessonsAll += completedCount;

      let lastLessonTitle: string | null = null;
      if (enr.lastAccessedLessonId) {
        const found = allLessons.find((l: any) => l.id === enr.lastAccessedLessonId);
        if (found) lastLessonTitle = found.title;
      }
      if (!lastLessonTitle && allLessons.length > 0) {
        lastLessonTitle = allLessons[0].title;
      }

      return {
        id: enr.id,
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        courseSlug: enr.course.slug,
        courseThumbnail: enr.course.thumbnailUrl,
        durationWeeks: enr.course.durationWeeks,
        batchCode: enr.batch?.code ?? null,
        batchName: enr.batch?.name ?? null,
        status: enr.status,
        totalLessons,
        completedLessons: completedCount,
        progressPercent,
        lastAccessedLessonId: enr.lastAccessedLessonId ?? allLessons[0]?.id ?? null,
        lastAccessedLessonTitle: lastLessonTitle,
        lastAccessedAt: enr.lastAccessedAt,
      };
    });

    const overallProgressPercent =
      totalLessonsAll > 0 ? Math.round((completedLessonsAll / totalLessonsAll) * 100) : 0;

    const batchIds = enrollments.map((e: any) => e.batchId).filter(Boolean);
    const upcomingClasses = batchIds.length > 0
      ? await ctx.db.scheduledClass.findMany({
          where: {
            batchId: { in: batchIds },
            scheduledAt: { gte: new Date() },
          },
          include: {
            batch: { select: { code: true, name: true } },
            trainer: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        })
      : [];

    return {
      enrollments: mappedEnrollments,
      stats: {
        enrolledCoursesCount: mappedEnrollments.length,
        totalLessonsCount: totalLessonsAll,
        completedLessonsCount: completedLessonsAll,
        overallProgressPercent,
      },
      upcomingClasses: upcomingClasses.map((cls: any) => ({
        id: cls.id,
        title: cls.title,
        batchCode: cls.batch.code,
        batchName: cls.batch.name,
        scheduledAt: cls.scheduledAt,
        durationMin: cls.durationMin,
        mode: cls.mode,
        location: cls.location,
        trainerName: cls.trainer ? `${cls.trainer.user.firstName} ${cls.trainer.user.lastName}` : "Faculty Instructor",
      })),
    };
  }

  /**
   * Returns enrolled courses with progress for courses list view.
   */
  static async getEnrolledCourses(ctx: any) {
    const { studentProfile, isSuperAdmin } = await LearningProgressService.getStudentProfile(ctx);
    if (!studentProfile && !isSuperAdmin) return [];

    const enrollments = await ctx.db.enrollment.findMany({
      where: studentProfile ? { studentId: studentProfile.id } : undefined,
      include: {
        course: {
          include: {
            modules: {
              where: { status: ContentStatus.PUBLISHED, deletedAt: null },
              include: {
                lessons: {
                  where: { status: ContentStatus.PUBLISHED, deletedAt: null },
                  select: { id: true, title: true, durationMin: true },
                },
              },
            },
          },
        },
        batch: true,
        lessonProgress: {
          where: { isCompleted: true },
          select: { lessonId: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    return enrollments.map((enr: any) => {
      const allLessons = enr.course.modules.flatMap((m: any) => m.lessons);
      const totalLessons = allLessons.length;
      const completedSet = new Set(enr.lessonProgress.map((p: any) => p.lessonId));
      const completedCount = allLessons.filter((l: any) => completedSet.has(l.id)).length;
      const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

      return {
        id: enr.id,
        courseId: enr.courseId,
        courseTitle: enr.course.title,
        courseSlug: enr.course.slug,
        courseSummary: enr.course.summary,
        thumbnailUrl: enr.course.thumbnailUrl,
        durationWeeks: enr.course.durationWeeks,
        batchCode: enr.batch?.code ?? null,
        batchName: enr.batch?.name ?? null,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        totalLessons,
        completedLessons: completedCount,
        progressPercent,
        lastAccessedLessonId: enr.lastAccessedLessonId ?? allLessons[0]?.id ?? null,
      };
    });
  }

  /**
   * Resolves curriculum and active lesson data for the learning player.
   */
  static async getCoursePlayer(ctx: any, enrollmentId: string, lessonId?: string) {
    const { enrollment } = await LearningProgressService.verifyEnrollmentOwnership(ctx, enrollmentId);

    const course = await ctx.db.course.findUnique({
      where: { id: enrollment.courseId },
      include: {
        modules: {
          where: { status: ContentStatus.PUBLISHED, deletedAt: null },
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: {
              where: { status: ContentStatus.PUBLISHED, deletedAt: null },
              orderBy: { sortOrder: "asc" },
              include: { contentDetails: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course curriculum not found." });
    }

    const progressRecords = await ctx.db.lessonProgress.findMany({
      where: { enrollmentId },
    });
    const completedLessonIds = new Set(
      progressRecords.filter((p: any) => p.isCompleted).map((p: any) => p.lessonId)
    );

    const flatLessons: any[] = [];
    const modules = course.modules.map((mod: any) => {
      const lessons = mod.lessons.map((les: any) => {
        const item = {
          id: les.id,
          moduleId: mod.id,
          moduleTitle: mod.title,
          title: les.title,
          slug: les.slug,
          type: les.type,
          durationMin: les.durationMin,
          isFreePreview: les.isFreePreview,
          isCompleted: completedLessonIds.has(les.id),
        };
        flatLessons.push({ ...les, moduleTitle: mod.title });
        return item;
      });
      return { id: mod.id, title: mod.title, description: mod.description, lessons };
    });

    if (flatLessons.length === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Curriculum content for this course is being prepared by faculty instructors.",
      });
    }

    let activeIndex = -1;
    if (lessonId) {
      activeIndex = flatLessons.findIndex((l) => l.id === lessonId);
    }
    if (activeIndex === -1 && enrollment.lastAccessedLessonId) {
      activeIndex = flatLessons.findIndex((l) => l.id === enrollment.lastAccessedLessonId);
    }
    if (activeIndex === -1) {
      activeIndex = 0;
    }

    const currentLesson = flatLessons[activeIndex];
    const prevLesson = activeIndex > 0 ? flatLessons[activeIndex - 1] : null;
    const nextLesson = activeIndex < flatLessons.length - 1 ? flatLessons[activeIndex + 1] : null;

    await ctx.db.enrollment.update({
      where: { id: enrollmentId },
      data: { lastAccessedLessonId: currentLesson.id, lastAccessedAt: new Date() },
    });

    await ctx.db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId: currentLesson.id } },
      create: { enrollmentId, lessonId: currentLesson.id, lastAccessedAt: new Date() },
      update: { lastAccessedAt: new Date() },
    });

    const totalLessons = flatLessons.length;
    const completedLessons = flatLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      const activeModule = course.modules.find((m: any) => m.id === currentLesson.moduleId);
      const extractedTopics: string[] = [];
      if (activeModule?.description) {
        const lines = activeModule.description.split("\n");
        for (const line of lines) {
          if (line.trim().startsWith("•")) {
            const t = line.replace(/^[•\s*-]+/, "").trim();
            if (t && t.length > 1 && !t.includes("") && !t.includes("\uF0B7")) {
              extractedTopics.push(t);
            }
          }
        }
      }

      return {
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          batchCode: enrollment.batch?.code ?? null,
          batchName: enrollment.batch?.name ?? null,
        },
        course: { id: course.id, title: course.title, slug: course.slug },
        modules,
        currentLesson: {
          id: currentLesson.id,
          moduleId: currentLesson.moduleId,
          moduleTitle: currentLesson.moduleTitle,
          title: currentLesson.title,
          type: currentLesson.type,
          durationMin: currentLesson.durationMin,
          summary: currentLesson.summary,
          topics: extractedTopics,
          isCompleted: completedLessonIds.has(currentLesson.id),
        contentDetails: currentLesson.contentDetails
          ? {
              id: currentLesson.contentDetails.id,
              fileName: currentLesson.contentDetails.fileName ?? null,
              fileSizeBytes: currentLesson.contentDetails.fileSizeBytes ?? null,
              mimeType: currentLesson.contentDetails.mimeType ?? null,
              hasResource: Boolean(
                currentLesson.contentDetails.storageFileKey || currentLesson.contentDetails.documentUrl
              ),
              bodyHtml: currentLesson.contentDetails.bodyHtml ?? null,
              bodyText: currentLesson.contentDetails.bodyText ?? null,
              bunnyVideoId: currentLesson.contentDetails.bunnyVideoId ?? null,
              videoUrl: currentLesson.contentDetails.videoUrl ?? null,
              externalUrl: S3StorageService.isSafeUrl(currentLesson.contentDetails.externalUrl)
                ? currentLesson.contentDetails.externalUrl
                : null,
            }
          : null,
      },
      prevLesson: prevLesson ? { id: prevLesson.id, title: prevLesson.title } : null,
      nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
      stats: { totalLessons, completedLessons, progressPercent },
      watermark: {
        email: ctx.session.user.email,
        timestamp: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      },
    };
  }
}
