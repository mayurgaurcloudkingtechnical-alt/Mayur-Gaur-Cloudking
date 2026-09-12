import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { db } from "@/server/db/client";
import { AuditService } from "@/server/services/audit.service";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { UserRoleCode } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: 28800, // 8 hours as specified in docs/SECURITY.md
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();

        // Rate limiting check: 5 attempts per 15 mins per email
        const rateCheck = RateLimiter.check(`login:${normalizedEmail}`, 5, 15 * 60 * 1000);
        if (!rateCheck.allowed) {
          await AuditService.log({
            action: "AUTH_LOGIN_LOCKED_OUT",
            resourceType: "User",
            resourceId: normalizedEmail,
            newData: { reason: "Rate limit exceeded" },
          });
          throw new Error("Too many failed attempts. Please try again later.");
        }

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            role: {
              select: {
                permissions: true,
                maxDiscountPercent: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          await AuditService.log({
            action: "AUTH_LOGIN_FAILED",
            resourceType: "User",
            resourceId: normalizedEmail,
            newData: { reason: "User not found" },
          });
          return null;
        }

        if (user.status !== "ACTIVE") {
          await AuditService.log({
            actorId: user.id,
            action: "AUTH_LOGIN_INACTIVE",
            resourceType: "User",
            resourceId: user.id,
            newData: { status: user.status },
          });
          throw new Error("Your account is not active. Please contact administration.");
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          await AuditService.log({
            actorId: user.id,
            action: "AUTH_LOGIN_FAILED_CREDENTIALS",
            resourceType: "User",
            resourceId: user.id,
          });
          return null;
        }

        // Login successful: reset rate limiter and update lastLoginAt
        RateLimiter.reset(`login:${normalizedEmail}`);
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        await AuditService.log({
          actorId: user.id,
          action: "AUTH_LOGIN_SUCCESS",
          resourceType: "User",
          resourceId: user.id,
          newData: { roleCode: user.roleCode },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName,
          lastName: user.lastName,
          roleCode: user.roleCode,
          permissions: user.role.permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.roleCode = user.roleCode;
        token.permissions = user.permissions || [];
        token.firstName = user.firstName;
        token.lastName = user.lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.roleCode = token.roleCode as UserRoleCode;
        session.user.permissions = (token.permissions as string[]) || [];
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
      }
      return session;
    },
  },
};
