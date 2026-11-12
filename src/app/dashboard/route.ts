import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { getToken } from "next-auth/jwt";
import { getSafeRedirectUrl } from "@/lib/safe-url";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  let role = session?.user?.roleCode as string | undefined;

  if (!role) {
    const secret =
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "change_me_to_a_cryptographically_secure_random_string_32_chars_min";
    const token =
      (await getToken({ req, secret, secureCookie: true })) ||
      (await getToken({ req, secret, secureCookie: false }));
    if (token) {
      role = token.roleCode as string;
    }
  }

  if (!role) {
    return NextResponse.redirect(getSafeRedirectUrl("/login", req));
  }

  if (role === "STUDENT") {
    return NextResponse.redirect(getSafeRedirectUrl("/student/dashboard", req));
  }
  if (role === "TRAINER") {
    return NextResponse.redirect(getSafeRedirectUrl("/trainer/dashboard", req));
  }
  if (role === "TELECALLER") {
    return NextResponse.redirect(getSafeRedirectUrl("/telecaller/dashboard", req));
  }
  if (role === "COUNSELOR") {
    return NextResponse.redirect(getSafeRedirectUrl("/counselor/dashboard", req));
  }
  if (role === "ACCOUNTANT") {
    return NextResponse.redirect(getSafeRedirectUrl("/admin/finance", req));
  }
  if (role === "HR") {
    return NextResponse.redirect(getSafeRedirectUrl("/admin/staff", req));
  }
  return NextResponse.redirect(getSafeRedirectUrl("/admin/dashboard", req));
}
