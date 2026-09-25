import { auth } from "@/server/auth";
import { db } from "@/server/db/client";
import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { NativeTokenService } from "@/server/auth/native-token.service";
import { UserRoleCode } from "@prisma/client";

export interface ContextUser {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  roleCode: UserRoleCode;
  permissions: string[];
}

export async function createTRPCContext(opts?: FetchCreateContextFnOptions) {
  const reqHeaders = opts?.req?.headers;
  const authHeader = reqHeaders?.get?.("authorization");

  // 1. NATIVE CLIENT AUTHENTICATION (Bearer Token)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const tokenPayload = await NativeTokenService.verifyAccessToken(token);

    if (tokenPayload) {
      const dbUser = await db.user.findUnique({
        where: { id: tokenPayload.userId },
        include: {
          role: {
            select: {
              permissions: true,
            },
          },
        },
      });

      if (dbUser && dbUser.status === "ACTIVE") {
        const user: ContextUser = {
          id: dbUser.id,
          email: dbUser.email,
          name: `${dbUser.firstName} ${dbUser.lastName}`,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          roleCode: dbUser.roleCode,
          permissions: dbUser.role.permissions,
        };

        return {
          db,
          session: {
            user,
            expires: new Date(Date.now() + 3600 * 1000).toISOString(),
          },
          user,
          headers: reqHeaders,
        };
      }
    }

    // Invalid or expired Bearer token provided
    return {
      db,
      session: null,
      user: null,
      headers: reqHeaders,
    };
  }

  // 2. WEB LMS CLIENT AUTHENTICATION (Existing Auth.js Cookie Session Fallback)
  let session = null;
  try {
    session = await auth();
  } catch {
    session = null;
  }

  return {
    db,
    session,
    user: (session?.user as ContextUser) ?? null,
    headers: reqHeaders,
  };
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;
