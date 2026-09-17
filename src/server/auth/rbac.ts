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

const LEGACY_MAP: Record<string, string[]> = {
  "students.view": ["students:read", "leads:read_all", "admissions:read"],
  "students.create": ["students:create", "admissions:create"],
  "students.edit": ["students:update", "admissions:create"],
  "students.delete": ["students:delete"],
  "courses.view": ["courses:read"],
  "courses.create": ["courses:create"],
  "courses.edit": ["courses:update"],
  "courses.delete": ["courses:delete"],
  "courses.publish": ["courses:publish"],
  "batches.view": ["batches:read", "courses:read"],
  "batches.create": ["batches:create"],
  "batches.edit": ["batches:update"],
  "admissions.view": ["admissions:read", "leads:read_all", "leads:read_own"],
  "admissions.create": ["admissions:create", "leads:create"],
  "admissions.edit": ["admissions:update", "leads:update"],
  "admissions.approve": ["admissions:approve_discount", "admissions:create"],
  "fees.view": ["payments:view_ledger", "finance:read"],
  "fees.recordPayment": ["payments:record_offline", "finance:record"],
  "attendance.view": ["attendance:read", "attendance:mark"],
  "attendance.create": ["attendance:mark"],
  "lms.view": ["content:read", "courses:read"],
  "lms.create": ["content:manage"],
  "lms.edit": ["content:manage"],
  "staff.view": ["hr:employees:manage", "staff:read"],
  "staff.create": ["hr:employees:manage", "staff:create"],
  "settings.view": ["system:read"],
  "settings.edit": ["system:manage"],
};

/**
 * Checks whether a user's permissions array contains the requested permission.
 */
export function hasPermission(permissions: string[], permission: string): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  if (permissions.includes("*")) return true;
  if (permissions.includes(permission)) return true;

  // Domain wildcard support: e.g. "students.*" matches "students.create"
  for (const perm of permissions) {
    if (perm.endsWith(".*")) {
      const prefix = perm.slice(0, -2);
      if (permission.startsWith(prefix + ".")) {
        return true;
      }
    }
  }

  // Normalize legacy format: e.g. "STUDENT_CREATE" -> "students:create"
  const normalizedUserPerms = permissions.map((p) => p.toLowerCase().replace(/_/g, ":"));
  const normalizedTarget = permission.toLowerCase().replace(/_/g, ":");

  const legacyAliases = LEGACY_MAP[permission];
  if (
    legacyAliases &&
    legacyAliases.some(
      (alias) =>
        permissions.includes(alias) ||
        normalizedUserPerms.includes(alias) ||
        normalizedUserPerms.includes(alias.replace(":", "_"))
    )
  ) {
    return true;
  }

  // Reverse check: if permission checked is a legacy string and user has the modern one
  for (const [modern, aliases] of Object.entries(LEGACY_MAP)) {
    if (
      (aliases.includes(permission) || aliases.includes(normalizedTarget)) &&
      permissions.includes(modern)
    ) {
      return true;
    }
  }

  return false;
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
