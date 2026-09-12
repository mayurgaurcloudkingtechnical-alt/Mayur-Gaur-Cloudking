import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { BatchStatus, UserRoleCode } from "@prisma/client";
import { TrainerService } from "@/server/services/trainer.service";
import { AttendanceService } from "@/server/services/attendance.service";

export const trainerRouter = router({
  /**
   * Retrieves live metrics, today's classes, and batch overview for the faculty dashboard.
   */
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    return TrainerService.getDashboardOverview(ctx);
  }),

  /**
   * Lists batches assigned to the authenticated faculty trainer.
   */
  listBatches: protectedProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(BatchStatus).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return TrainerService.getAssignedBatches(ctx, input?.status);
    }),

  /**
   * Returns complete batch workspace: course curriculum, scheduled sessions, and student roster.
   */
  getBatchWorkspace: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return TrainerService.getBatchWorkspace(ctx, input.batchId);
    }),

  /**
   * Returns batch-level attendance metrics and history.
   */
  getBatchAttendanceStats: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ ctx, input }) => {
      return AttendanceService.getBatchAttendanceStats(ctx, input.batchId);
    }),
});
