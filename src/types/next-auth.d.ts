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
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    roleCode: UserRoleCode;
    permissions?: string[];
    firstName: string;
    lastName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roleCode?: UserRoleCode;
    permissions?: string[];
    firstName?: string;
    lastName?: string;
  }
}
