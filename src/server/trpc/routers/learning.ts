import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { LearningService } from "@/server/services/learning.service";
import { LearningProgressService } from "@/server/services/learning-progress.service";

import { TRPCError } from "@trpc/server";

export const learningRouter = router({
  /**
   * Returns student's official ID card details and current enrollment.
   */
  getMyIdCard: protectedProcedure.query(async ({ ctx }) => {
    const student = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        enrollments: {
          include: {
            course: { select: { title: true } },
            batch: { select: { name: true, code: true, startDate: true, endDate: true } },
          },
          orderBy: { enrolledAt: "desc" },
          take: 1,
        },
        idCard: true,
      },
    });

    if (!student) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found for active user" });
    }

    return student;
  }),

  /**
   * Returns whether the active student is enrolled in a DPGU / University course.
   */
  isUniversityEnrolled: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.roleCode !== "STUDENT") return false;
    const student = await ctx.db.studentProfile.findUnique({
      where: { userId: ctx.user.id },
      select: {
        educationProvider: true,
        universityName: true,
        enrollments: {
          select: {
            course: {
              select: {
                providerType: true,
                universityName: true,
              },
            },
          },
        },
      },
    });
    if (!student) return false;
    const isUnivProfile =
      student.educationProvider === "Dr. Preeti Global University" ||
      Boolean(student.universityName && student.universityName.trim().length > 0);
    const hasUnivCourse = student.enrollments.some(
      (e) =>
        e.course.providerType === "UNIVERSITY" ||
        Boolean(e.course.universityName && e.course.universityName.trim().length > 0)
    );
    return isUnivProfile || hasUnivCourse;
  }),
  /**
   * Returns overview statistics, enrolled courses with progress, and upcoming classes.
   */
  getDashboardOverview: protectedProcedure.query(async ({ ctx }) => {
    return LearningService.getDashboardOverview(ctx);
  }),

  /**
   * Returns all courses enrolled by the active student with detailed progress.
   */
  getEnrolledCourses: protectedProcedure.query(async ({ ctx }) => {
    return LearningService.getEnrolledCourses(ctx);
  }),

  /**
   * Retrieves full course player state: curriculum outline, current lesson with content, and navigation.
   */
  getCoursePlayer: protectedProcedure
    .input(z.object({ enrollmentId: z.string(), lessonId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return LearningService.getCoursePlayer(ctx, input.enrollmentId, input.lessonId);
    }),

  /**
   * Explicitly toggles completion state of a lesson for this enrollment.
   */
  toggleLessonComplete: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        lessonId: z.string(),
        isCompleted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return LearningProgressService.toggleLessonComplete(
        ctx,
        input.enrollmentId,
        input.lessonId,
        input.isCompleted
      );
    }),

  /**
   * Requests a short-lived (5-minute) authorized download URL for a private lesson resource.
   */
  getLessonResourceDownloadUrl: protectedProcedure
    .input(
      z.object({
        enrollmentId: z.string(),
        lessonId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return LearningProgressService.getLessonResourceDownloadUrl(
        ctx,
        input.enrollmentId,
        input.lessonId
      );
    }),
});

