import { router, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

export const adminRouter = router({
  getHealth: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ]).query(async ({ ctx }) => {
    const userCount = await ctx.db.user.count();
    const roleCount = await ctx.db.role.count();
    const courseCount = await ctx.db.course.count();

    return {
      status: "HEALTHY",
      service: "SOFTLAB GLOBAL Enterprise API",
      timestamp: new Date().toISOString(),
      database: "PostgreSQL connected",
      metrics: {
        users: userCount,
        roles: roleCount,
        courses: courseCount,
      },
    };
  }),

  getRecentAuditLogs: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
  ])
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          resourceType: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return AuditService.getRecentLogs(
        input?.limit ?? 20,
        input?.resourceType
      );
    }),
});
