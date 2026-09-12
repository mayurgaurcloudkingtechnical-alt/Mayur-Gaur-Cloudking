import { UserRoleCode, ContentStatus, EnrollmentStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "./audit.service";
import { S3StorageService } from "@/server/storage/s3-storage.service";

export class LearningProgressService {
  /**
   * Validates student identity and returns studentProfile.
   */
  static async getStudentProfile(ctx: any) {
    const role = ctx.session.user.roleCode as UserRoleCode;
    const isSuperAdmin = role === UserRoleCode.SUPER_ADMIN;

    let studentProfile = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.session.user.id },
    });

    if (!studentProfile && isSuperAdmin) {
      studentProfile = await ctx.db.studentProfile.findFirst();
    }

    if (!studentProfile && role === UserRoleCode.STUDENT) {
      const code = `SLG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      studentProfile = await ctx.db.studentProfile.create({
        data: {
          userId: ctx.session.user.id,
          studentId: code,
        },
      });
    }

    if (!studentProfile && !isSuperAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Active student profile record not found. Please contact administration.",
      });
    }

    return { studentProfile, isSuperAdmin };
  }

  /**
   * Validates that the active session owns the target enrollment.
   */
  static async verifyEnrollmentOwnership(ctx: any, enrollmentId: string) {
    const { studentProfile, isSuperAdmin } = await this.getStudentProfile(ctx);

    const enrollment = await ctx.db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: true,
        batch: true,
      },
    });

    if (!enrollment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Course enrollment not found." });
    }

    if (!isSuperAdmin && enrollment.studentId !== studentProfile?.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not authorized to access this course enrollment.",
      });
    }

    if (enrollment.status === EnrollmentStatus.CANCELLED || enrollment.status === EnrollmentStatus.SUSPENDED) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Your enrollment is currently ${enrollment.status.toLowerCase()}. Please contact academic support.`,
      });
    }

    return { enrollment, studentProfile, isSuperAdmin };
  }

  /**
   * Toggles completion status of a lesson.
   */
  static async toggleLessonComplete(ctx: any, enrollmentId: string, lessonId: string, isCompleted: boolean) {
    const { enrollment } = await this.verifyEnrollmentOwnership(ctx, enrollmentId);

    const lesson = await ctx.db.lesson.findFirst({
      where: {
        id: lessonId,
        module: { courseId: enrollment.courseId, status: ContentStatus.PUBLISHED },
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    });

    if (!lesson) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Published lesson not found in enrolled course." });
    }

    await ctx.db.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      create: {
        enrollmentId,
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      },
    });

    const allLessonsCount = await ctx.db.lesson.count({
      where: {
        module: { courseId: enrollment.courseId, status: ContentStatus.PUBLISHED, deletedAt: null },
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
    });

    const completedCount = await ctx.db.lessonProgress.count({
      where: {
        enrollmentId,
        isCompleted: true,
        lesson: {
          module: { courseId: enrollment.courseId, status: ContentStatus.PUBLISHED, deletedAt: null },
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
      },
    });

    const isAllFinished = allLessonsCount > 0 && completedCount === allLessonsCount;

    if (isAllFinished && enrollment.status !== EnrollmentStatus.COMPLETED) {
      await ctx.db.enrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.COMPLETED, completedAt: new Date() },
      });
    } else if (!isAllFinished && enrollment.status === EnrollmentStatus.COMPLETED) {
      await ctx.db.enrollment.update({
        where: { id: enrollmentId },
        data: { status: EnrollmentStatus.ACTIVE, completedAt: null },
      });
    }

    await AuditService.log({
      actorId: ctx.session.user.id,
      action: isCompleted ? "LESSON_COMPLETED" : "LESSON_UNCOMPLETED",
      resourceType: "LessonProgress",
      resourceId: lessonId,
      newData: { enrollmentId, isCompleted },
    });

    const progressPercent = allLessonsCount > 0 ? Math.round((completedCount / allLessonsCount) * 100) : 0;

    return {
      isCompleted,
      totalLessons: allLessonsCount,
      completedLessons: completedCount,
      progressPercent,
      courseCompleted: isAllFinished,
    };
  }

  /**
   * Generates a short-lived (5-minute) authorized download URL for private lesson documents.
   * Enforces that student has an ACTIVE enrollment, and module/lesson are PUBLISHED.
   * If storage is unconfigured locally, returns a clear secure unavailable result without fake URLs.
   */
  static async getLessonResourceDownloadUrl(ctx: any, enrollmentId: string, lessonId: string) {
    const { enrollment } = await this.verifyEnrollmentOwnership(ctx, enrollmentId);

    const lesson = await ctx.db.lesson.findFirst({
      where: {
        id: lessonId,
        module: {
          courseId: enrollment.courseId,
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        status: ContentStatus.PUBLISHED,
        deletedAt: null,
      },
      include: {
        contentDetails: true,
      },
    });

    if (!lesson) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Published lesson not found in your enrolled course.",
      });
    }

    const content = lesson.contentDetails;
    if (!content || (!content.storageFileKey && !content.documentUrl)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No private downloadable resource attached to this lesson.",
      });
    }

    const targetKey = content.storageFileKey || content.documentUrl;
    const fileName = content.fileName || `${lesson.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`;

    const presigned = S3StorageService.generatePresignedDownloadUrl(targetKey!, fileName, 300);

    await AuditService.log({
      actorId: ctx.session.user.id,
      action: "LESSON_RESOURCE_ACCESSED",
      resourceType: "LessonContent",
      resourceId: lesson.id,
      newData: { enrollmentId, lessonId, fileName, available: presigned.available },
    });

    if (!presigned.available) {
      return {
        available: false,
        message: presigned.message || "Document storage service is not configured in this environment.",
      };
    }

    return {
      available: true,
      downloadUrl: presigned.downloadUrl,
      fileName,
      expiresInSec: 300,
    };
  }
}

