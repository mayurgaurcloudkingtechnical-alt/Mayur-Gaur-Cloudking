import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSafeRedirectUrl } from "@/lib/safe-url";

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host")?.toLowerCase() || "";
  const { pathname } = req.nextUrl;
  const isLmsSubdomain = host.startsWith("lms.") || req.nextUrl.searchParams.get("portal") === "lms";
  const isSkillverseSubdomain =
    host.startsWith("skillverse.") || req.nextUrl.searchParams.get("portal") === "skillverse";
  const isApiSubdomain = host.startsWith("api.");

  // Handle SLG SKILLVERSE Subdomain (skillverse.softlabglobal.com) Routing Isolation
  if (isSkillverseSubdomain) {
    // Pass API, TRPC, Next internal assets and media straight through
    if (
      pathname.startsWith("/api/") ||
      pathname.startsWith("/trpc/") ||
      pathname.startsWith("/_next/") ||
      pathname.startsWith("/images/") ||
      /\.(jpg|jpeg|png|gif|ico|svg|css|js|woff|woff2|ttf|csv)$/i.test(pathname)
    ) {
      return NextResponse.next();
    }

    const rewriteUrl = req.nextUrl.clone();

    // Direct Portal Aliases for Skillverse Subdomain
    if (pathname === "/login" || pathname === "/signin") {
      rewriteUrl.pathname = "/skillverse/login";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (pathname === "/crm") {
      rewriteUrl.pathname = "/skillverse/crm";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (pathname === "/lms" || pathname === "/classroom") {
      rewriteUrl.pathname = "/skillverse/lms";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (
      pathname === "/staff" ||
      pathname === "/staff-login" ||
      pathname === "/admin" ||
      pathname === "/dashboard"
    ) {
      rewriteUrl.pathname = "/skillverse/staff-login";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (pathname === "/student" || pathname === "/student-login") {
      rewriteUrl.pathname = "/skillverse/student-login";
      return NextResponse.rewrite(rewriteUrl);
    }
    if (pathname === "/parent" || pathname === "/parent-login") {
      rewriteUrl.pathname = "/skillverse/parent-login";
      return NextResponse.rewrite(rewriteUrl);
    }

    // Default rewrite: prefix all other paths with /skillverse
    if (!pathname.startsWith("/skillverse")) {
      rewriteUrl.pathname = `/skillverse${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(rewriteUrl);
    }

    return NextResponse.next();
  }

  // Handle API Subdomain & Native API v1 CORS
  if (isApiSubdomain || pathname.startsWith("/api/v1/")) {
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

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "change_me_to_a_cryptographically_secure_random_string_32_chars_min";
  const hasSecureCookie = req.cookies.has("__Secure-authjs.session-token") || req.cookies.has("__Secure-next-auth.session-token");
  const isHttps = req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https" || process.env.NODE_ENV === "production";

  let token = null;
  if (hasSecureCookie || isHttps) {
    token = await getToken({
      req,
      secret,
      secureCookie: true,
    });
  }

  if (!token) {
    token = await getToken({
      req,
      secret,
      secureCookie: false,
    });
  }

  if (!token && (req.cookies.has("__Secure-next-auth.session-token") || req.cookies.has("next-auth.session-token"))) {
    token = await getToken({
      req,
      secret,
      cookieName: hasSecureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      salt: hasSecureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
    });
  }

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/student-login");
  const isStudentRoute = pathname.startsWith("/student") && !pathname.startsWith("/student-login");
  const isTrainerRoute = pathname.startsWith("/trainer");
  const isCounselorRoute = pathname.startsWith("/counselor");
  const isTelecallerRoute = pathname.startsWith("/telecaller");
  const isAdminRoute = pathname.startsWith("/admin");

  // Handle LMS Subdomain Landing Routing
  if (isLmsSubdomain && pathname === "/") {
    if (token) {
      const role = token.roleCode as string;
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
      return NextResponse.redirect(getSafeRedirectUrl("/admin/dashboard", req));
    }
    // If not logged in on lms.*, redirect to /login
    return NextResponse.redirect(getSafeRedirectUrl("/login", req));
  }

  // Direct root portal redirects
  if (pathname === "/student") {
    return NextResponse.redirect(getSafeRedirectUrl("/student/dashboard", req));
  }
  if (pathname === "/trainer") {
    return NextResponse.redirect(getSafeRedirectUrl("/trainer/dashboard", req));
  }
  if (pathname === "/admin") {
    return NextResponse.redirect(getSafeRedirectUrl("/admin/dashboard", req));
  }
  if (pathname === "/counselor") {
    return NextResponse.redirect(getSafeRedirectUrl("/counselor/dashboard", req));
  }
  if (pathname === "/telecaller") {
    return NextResponse.redirect(getSafeRedirectUrl("/telecaller/dashboard", req));
  }

  const isProtectedRoute =
    isStudentRoute || isTrainerRoute || isCounselorRoute || isTelecallerRoute || isAdminRoute;

  // 1. If accessing login route while already authenticated, redirect to role home
  if (
    isAuthRoute &&
    token &&
    !req.nextUrl.searchParams.has("error") &&
    !req.nextUrl.searchParams.has("logout") &&
    !req.nextUrl.searchParams.has("clear")
  ) {
    const role = token.roleCode as string;
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
    return NextResponse.redirect(getSafeRedirectUrl("/admin/dashboard", req));
  }

  // 2. Unauthenticated access to protected portal routes
  if (isProtectedRoute && !token) {
    const loginUrl = getSafeRedirectUrl("/login", req);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Helper to resolve an authenticated user's home dashboard
  const getRoleDashboard = (r: string): string => {
    switch (r) {
      case "STUDENT":
        return "/student/dashboard";
      case "TRAINER":
        return "/trainer/dashboard";
      case "COUNSELOR":
        return "/counselor/dashboard";
      case "TELECALLER":
        return "/telecaller/dashboard";
      case "INSTITUTION_ADMIN":
      case "INSTITUTION_OFFICER":
        return "/institution/dashboard";
      case "RECRUITER":
        return "/admin/recruiters";
      default:
        return "/admin/dashboard";
    }
  };

  // 3. Role boundary enforcement
  if (token) {
    const role = token.roleCode as string;

    // Student boundary: only STUDENT or SUPER_ADMIN
    if (isStudentRoute && role !== "STUDENT" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
    }

    // Trainer boundary: only TRAINER or SUPER_ADMIN
    if (isTrainerRoute && role !== "TRAINER" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
    }

    // Counselor boundary: COUNSELOR, TELECALLER, MANAGER, or SUPER_ADMIN
    if (
      isCounselorRoute &&
      !["COUNSELOR", "TELECALLER", "MANAGER", "SUPER_ADMIN"].includes(role)
    ) {
      return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
    }

    // Telecallers are strictly limited to lead qualification: block access to formal admissions desk
    if (role === "TELECALLER" && pathname.startsWith("/counselor/admissions")) {
      return NextResponse.redirect(getSafeRedirectUrl("/telecaller/dashboard", req));
    }

    // Telecaller route boundary
    if (
      isTelecallerRoute &&
      !["TELECALLER", "COUNSELOR", "MANAGER", "ADMIN", "DIRECTOR", "SUPER_ADMIN"].includes(role)
    ) {
      return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
    }

    // Special Shared Admin Routes Accessible to Operational Staff
    if (pathname.startsWith("/admin/callyzer")) {
      const allowedCallyzerRoles = [
        "SUPER_ADMIN",
        "DIRECTOR",
        "ADMIN",
        "MANAGER",
        "HR",
        "COUNSELOR",
        "TELECALLER",
      ];
      if (!allowedCallyzerRoles.includes(role)) {
        return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
      }
    } else if (pathname.startsWith("/admin/daily-reports")) {
      const allowedDailyReportRoles = [
        "SUPER_ADMIN",
        "DIRECTOR",
        "ADMIN",
        "MANAGER",
        "HR",
        "COUNSELOR",
        "TELECALLER",
        "TRAINER",
        "PLACEMENT_OFFICER",
        "ACCOUNTANT",
      ];
      if (!allowedDailyReportRoles.includes(role)) {
        return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
      }
    } else if (isAdminRoute) {
      // General Admin boundary
      const generalAdminRoles = [
        "SUPER_ADMIN",
        "DIRECTOR",
        "ADMIN",
        "MANAGER",
        "HR",
        "ACCOUNTANT",
        "PLACEMENT_OFFICER",
      ];
      if (!generalAdminRoles.includes(role)) {
        return NextResponse.redirect(getSafeRedirectUrl(getRoleDashboard(role), req));
      }
    }
  }

  const res = NextResponse.next();
  if (isApiSubdomain || pathname.startsWith("/api/v1/")) {
    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-trpc-source");
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
