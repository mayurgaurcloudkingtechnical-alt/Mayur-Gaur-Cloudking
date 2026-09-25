import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import * as bcrypt from "bcryptjs";
import { db } from "@/server/db/client";
import { AuditService } from "@/server/services/audit.service";
import { RateLimiter } from "@/server/lib/rate-limiter";
import { UserRoleCode } from "@prisma/client";
import { verifyUserCredentials } from "./verify-credentials";

const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "change_me_to_a_cryptographically_secure_random_string_32_chars_min",
  trustHost: true,
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
        identifier: { label: "Enrollment Number or Email", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const rawIdentifier = (parsed.data.identifier || parsed.data.email || "").trim();
        const { password } = parsed.data;

        if (!rawIdentifier) {
          return null;
        }

        const clientIp = req?.headers?.get?.("x-forwarded-for") || undefined;
        const userAgent = req?.headers?.get?.("user-agent") || undefined;

        return await verifyUserCredentials({
          identifier: rawIdentifier,
          password,
          clientIp,
          userAgent,
        });
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
