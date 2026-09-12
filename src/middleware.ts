import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isStudentRoute = pathname.startsWith("/student");
  const isTrainerRoute = pathname.startsWith("/trainer");
  const isCounselorRoute = pathname.startsWith("/counselor");
  const isAdminRoute = pathname.startsWith("/admin");

  const isProtectedRoute =
    isStudentRoute || isTrainerRoute || isCounselorRoute || isAdminRoute;

  // 1. If accessing login route while already authenticated, redirect to role home
  if (isAuthRoute && token) {
    const role = token.roleCode as string;
    if (role === "STUDENT") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
    if (role === "TRAINER") {
      return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
    }
    if (role === "COUNSELOR" || role === "TELECALLER") {
      return NextResponse.redirect(new URL("/counselor/dashboard", req.url));
    }
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  // 2. Unauthenticated access to protected portal routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role boundary enforcement
  if (token) {
    const role = token.roleCode as string;

    // Student boundary: only STUDENT or SUPER_ADMIN
    if (isStudentRoute && role !== "STUDENT" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
    }

    // Trainer boundary: only TRAINER or SUPER_ADMIN
    if (isTrainerRoute && role !== "TRAINER" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
    }

    // Counselor boundary: COUNSELOR, TELECALLER, MANAGER, or SUPER_ADMIN
    if (
      isCounselorRoute &&
      !["COUNSELOR", "TELECALLER", "MANAGER", "SUPER_ADMIN"].includes(role)
    ) {
      return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
    }

    // Admin boundary: SUPER_ADMIN, DIRECTOR, ADMIN, MANAGER, HR, ACCOUNTANT, PLACEMENT_OFFICER
    if (
      isAdminRoute &&
      ![
        "SUPER_ADMIN",
        "DIRECTOR",
        "ADMIN",
        "MANAGER",
        "HR",
        "ACCOUNTANT",
        "PLACEMENT_OFFICER",
      ].includes(role)
    ) {
      return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/student/:path*",
    "/trainer/:path*",
    "/counselor/:path*",
    "/admin/:path*",
  ],
};
