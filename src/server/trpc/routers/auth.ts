import { router, publicProcedure, protectedProcedure } from "../init";
import { z } from "zod";

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
      },
    });

    return dbUser;
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
});
