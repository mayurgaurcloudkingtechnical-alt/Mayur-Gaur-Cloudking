import { UserRoleCode } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleCode: UserRoleCode;
      permissions: string[];
      firstName: string;
      lastName: string;
      phone?: string | null;
      callingNumber?: string | null;
      whatsappNumber?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    roleCode: UserRoleCode;
    permissions?: string[];
    firstName: string;
    lastName: string;
    phone?: string | null;
    callingNumber?: string | null;
    whatsappNumber?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleCode?: UserRoleCode;
    permissions?: string[];
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    callingNumber?: string | null;
    whatsappNumber?: string | null;
  }
}
