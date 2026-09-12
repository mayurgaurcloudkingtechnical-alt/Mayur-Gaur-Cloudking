import { UserRoleCode } from "@prisma/client";
import { auth } from "./index";
import { TRPCError } from "@trpc/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  roleCode: UserRoleCode;
  permissions: string[];
  firstName: string;
  lastName: string;
}

/**
 * Checks whether a given role is within an allowed set of roles.
 */
export function hasRole(role: UserRoleCode, allowedRoles: UserRoleCode[]): boolean {
  if (role === UserRoleCode.SUPER_ADMIN) {
    return true; // Super admin has root access
  }
  return allowedRoles.includes(role);
}

/**
 * Checks whether a user's permissions array contains the requested permission.
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission) || permissions.includes("*");
}

/**
 * Server-side guard that validates authentication.
 * Throws TRPCError UNAUTHORIZED if not authenticated.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required to access this resource.",
    });
  }
  return session.user as AuthenticatedUser;
}

/**
 * Server-side guard that validates role membership.
 * Throws TRPCError FORBIDDEN if the role is unauthorized.
 */
export async function requireRole(allowedRoles: UserRoleCode[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!hasRole(user.roleCode, allowedRoles)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${user.roleCode}`,
    });
  }
  return user;
}

/**
 * Server-side guard that validates a granular permission claim.
 * Throws TRPCError FORBIDDEN if the user lacks the permission.
 */
export async function requirePermission(permission: string): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (user.roleCode === UserRoleCode.SUPER_ADMIN) {
    return user; // Super admin bypass
  }
  if (!hasPermission(user.permissions, permission)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied. Missing required permission: '${permission}'`,
    });
  }
  return user;
}
