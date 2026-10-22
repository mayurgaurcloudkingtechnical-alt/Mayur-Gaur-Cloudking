import { router, publicProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const dbUser = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        roleCode: true,
        status: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            name: true,
            permissions: true,
            maxDiscountPercent: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            employeeId: true,
            department: true,
            designation: true,
            workLocation: true,
            profilePhoto: true,
            personalPhone: true,
            personalEmail: true,
            joiningDate: true,
            employmentType: true,
            employmentStatus: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            studentId: true,
            center: true,
            educationProvider: true,
            universityName: true,
            universityProgram: true,
            enrollments: {
              take: 1,
              orderBy: { enrolledAt: "desc" },
              select: {
                course: { select: { title: true } },
                batch: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return dbUser;
  }),

  /**
   * Updates only the profile photo (avatarUrl) of the currently authenticated user.
   * All other fields remain strictly read-only for security and record integrity.
   */
  updateProfilePhoto: protectedProcedure
    .input(z.object({ avatarUrl: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const updatedUser = await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { avatarUrl: input.avatarUrl.trim() },
        select: {
          id: true,
          avatarUrl: true,
          firstName: true,
          lastName: true,
          roleCode: true,
        },
      });

      // Also sync to staff profile if exists
      await ctx.db.staffProfile
        .updateMany({
          where: { userId: ctx.user.id },
          data: { profilePhoto: input.avatarUrl.trim() },
        })
        .catch(() => null);

      // Also sync to student profile if exists
      await ctx.db.studentProfile
        .updateMany({
          where: { userId: ctx.user.id },
          data: { photoUrl: input.avatarUrl.trim() },
        })
        .catch(() => null);

      return updatedUser;
    }),

  getPermissions: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user.permissions;
  }),

  hasPermission: protectedProcedure
    .input(z.object({ permission: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.roleCode === "SUPER_ADMIN") return true;
      return ctx.user.permissions.includes(input.permission);
    }),

  /**
   * Retrieves active device sessions for current authenticated user
   */
  getMySessions: protectedProcedure.query(async ({ ctx }) => {
    const sessions = await ctx.db.userDeviceSession.findMany({
      where: {
        userId: ctx.user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        platform: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    });

    return sessions.map((s) => ({
      ...s,
      isCurrentSession: Boolean(ctx.sessionId && s.id === ctx.sessionId),
    }));
  }),

  /**
   * Revokes a specific device session owned by current user
   */
  revokeSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.userDeviceSession.findUnique({
        where: { id: input.sessionId },
      });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Device session not found",
        });
      }

      if (session.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot revoke another user's session",
        });
      }

      await ctx.db.userDeviceSession.update({
        where: { id: input.sessionId },
        data: { revokedAt: new Date() },
      });

      return { success: true, revokedSessionId: input.sessionId };
    }),
});
