import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase() || "";
  const { pathname } = req.nextUrl;
  const isLmsSubdomain = host.startsWith("lms.") || req.nextUrl.searchParams.get("portal") === "lms";
  const isApiSubdomain = host.startsWith("api.");

  // Handle API Subdomain CORS
  if (isApiSubdomain) {
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-trpc-source",
          "Access-Control-Max-Age": "86400",
        },
      });
    }
  }

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "change_me_to_a_cryptographically_secure_random_string_32_chars_min",
  });

  const isAuthRoute = pathname.startsWith("/login");
  const isStudentRoute = pathname.startsWith("/student");
  const isTrainerRoute = pathname.startsWith("/trainer");
  const isCounselorRoute = pathname.startsWith("/counselor");
  const isAdminRoute = pathname.startsWith("/admin");

  // Handle LMS Subdomain Landing Routing
  if (isLmsSubdomain && pathname === "/") {
    if (token) {
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
    // If not logged in on lms.*, redirect to /login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Direct root portal redirects
  if (pathname === "/student") {
    return NextResponse.redirect(new URL("/student/dashboard", req.url));
  }
  if (pathname === "/trainer") {
    return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
  }
  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }
  if (pathname === "/counselor") {
    return NextResponse.redirect(new URL("/counselor/dashboard", req.url));
  }

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

  const res = NextResponse.next();
  if (isApiSubdomain) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
  }
  return res;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/student/:path*",
    "/trainer/:path*",
    "/counselor/:path*",
    "/admin/:path*",
    "/api/:path*",
    "/trpc/:path*",
  ],
};
