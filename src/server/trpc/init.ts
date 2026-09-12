import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
import { UserRoleCode } from "@prisma/client";
import { hasRole, hasPermission } from "@/server/auth/rbac";
import { AuditService } from "@/server/services/audit.service";
import { ZodError } from "zod";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure accessible by unauthenticated users.
 */
export const publicProcedure = t.procedure;

/**
 * Enforces valid user authentication.
 */
const enforceUserIsAuthed = middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.user || !ctx.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be signed in to perform this action.",
    });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Middleware creating a role-guarded procedure.
 */
export function requireRoleProcedure(allowedRoles: UserRoleCode[]) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (!hasRole(ctx.user.roleCode, allowedRoles)) {
      await AuditService.log({
        actorId: ctx.user.id,
        action: "AUTH_ROLE_UNAUTHORIZED_ACCESS",
        resourceType: "Procedure",
        resourceId: allowedRoles.join(","),
        newData: { userRole: ctx.user.roleCode },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Forbidden: requires one of roles [${allowedRoles.join(", ")}]. Current role: ${ctx.user.roleCode}`,
      });
    }
    return next({ ctx });
  });
}

/**
 * Middleware creating a permission-guarded procedure.
 */
export function requirePermissionProcedure(permission: string) {
  return protectedProcedure.use(async ({ ctx, next }) => {
    if (ctx.user.roleCode === UserRoleCode.SUPER_ADMIN) {
      return next({ ctx });
    }

    if (!hasPermission(ctx.user.permissions, permission)) {
      await AuditService.log({
        actorId: ctx.user.id,
        action: "AUTH_PERMISSION_UNAUTHORIZED_ACCESS",
        resourceType: "Permission",
        resourceId: permission,
        newData: { userRole: ctx.user.roleCode },
      });

      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Forbidden: missing required permission claim '${permission}'`,
      });
    }
    return next({ ctx });
  });
}
