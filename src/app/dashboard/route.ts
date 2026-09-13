import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.roleCode;

  if (role === "STUDENT") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }
  if (role === "TRAINER") {
    return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
  }
  if (role === "COUNSELOR" || role === "TELECALLER") {
    return NextResponse.redirect(new URL("/counselor/dashboard", req.url));
  }
  if (role === "ACCOUNTANT") {
    return NextResponse.redirect(new URL("/admin/finance", req.url));
  }
  if (role === "HR") {
    return NextResponse.redirect(new URL("/admin/staff", req.url));
  }
  return NextResponse.redirect(new URL("/admin/dashboard", req.url));
}
