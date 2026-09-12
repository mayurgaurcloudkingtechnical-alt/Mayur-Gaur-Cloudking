import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { LearningService } from "@/server/services/learning.service";
import { LearningProgressService } from "@/server/services/learning-progress.service";

export const learningRouter = router({
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

