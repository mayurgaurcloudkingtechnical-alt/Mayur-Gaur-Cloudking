import { UserRoleCode } from "@prisma/client";
import { auth } from "./index";
import { TRPCError } from "@trpc/server";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getToken } from "next-auth/jwt";

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
  "staff.manage": ["hr:employees:manage", "staff:manage", "staff.edit"],
  "hrms.view": ["hrms:read", "attendance:read", "leaves:read", "payroll:read", "staff:read"],
  "hrms.manage": ["hrms:manage", "attendance:mark", "leaves:manage", "payroll:manage"],
  "placements.view": ["placements:read", "placement:read", "jobs:read", "drives:read"],
  "placements.manage": ["placements:manage", "placement:manage", "jobs:manage", "drives:manage"],
  "settings.view": ["system:read"],
  "settings.edit": ["system:manage"],
  "services.view": ["services:read", "services:view"],
  "services.manage": ["services:manage", "services:admin"],
  "services.enquiries": ["services:enquiries", "services:leads", "services:read"],
  "services.packages": ["services:packages", "services:read"],
  "services.pricing": ["services:pricing", "services:manage"],
  "institution.view": ["institution:read", "institution:view"],
  "institution.manage": ["institution:manage", "institution:admin"],
  "institution.students": ["institution:students", "institution:manage_students"],
  "institution.drives": ["institution:drives", "institution:drives:nominate"],
  "institution.jobfairs": ["institution:jobfairs", "institution:jobfairs:register"],
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
 * Falls back to direct JWT cookie decryption if session is missing.
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user as AuthenticatedUser;
  }

  // Fallback: decode session token directly from cookies
  try {
    const cookieStore = cookies();
    const reqHeaders = headers();
    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "change_me_to_a_cryptographically_secure_random_string_32_chars_min";

    const hasSecureCookie =
      cookieStore.has("__Secure-authjs.session-token") ||
      cookieStore.has("__Secure-next-auth.session-token");

    const rawCookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const reqMock = {
      headers: {
        get: (name: string) => {
          if (name.toLowerCase() === "cookie") return rawCookieHeader;
          return reqHeaders.get(name);
        },
      },
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
      },
    } as any;

    let token = await getToken({ req: reqMock, secret, secureCookie: true });
    if (!token) {
      token = await getToken({ req: reqMock, secret, secureCookie: false });
    }
    if (!token && hasSecureCookie) {
      token = await getToken({
        req: reqMock,
        secret,
        cookieName: "__Secure-next-auth.session-token",
        salt: "__Secure-next-auth.session-token",
      });
    }

    if (token && (token.id || token.sub)) {
      return {
        id: (token.id as string) || (token.sub as string),
        email: (token.email as string) || "",
        roleCode: token.roleCode as UserRoleCode,
        permissions: (token.permissions as string[]) || [],
        firstName: (token.firstName as string) || "",
        lastName: (token.lastName as string) || "",
      };
    }
  } catch (err) {
    console.error("Direct cookie token resolution error:", err);
  }

  redirect("/login");
}

/**
 * Server-side guard that validates role membership.
 * Redirects if the role is unauthorized.
 */
export async function requireRole(allowedRoles: UserRoleCode[]): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!hasRole(user.roleCode, allowedRoles)) {
    redirect("/login?error=Unauthorized");
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
