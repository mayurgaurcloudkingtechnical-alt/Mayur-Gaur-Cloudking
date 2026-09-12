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
});
