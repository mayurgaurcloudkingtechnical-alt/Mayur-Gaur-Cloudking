import { AuthApi } from "../mobile/src/api/auth";
import { registerAuthFailureHandler, setCustomFetch } from "../mobile/src/api/client";
import { TokenStorage } from "../mobile/src/storage/secureStore";
import { db } from "../src/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { POST as refreshHandler } from "../src/app/api/v1/auth/refresh/route";
import { POST as logoutHandler } from "../src/app/api/v1/auth/logout/route";
import { GET as meHandler } from "../src/app/api/v1/auth/me/route";

interface TestReportItem {
  id: string;
  name: string;
  passed: boolean;
  details?: string;
}

const report: TestReportItem[] = [];

function assert(condition: boolean, id: string, name: string, details?: string) {
  if (condition) {
    report.push({ id, name, passed: true, details });
    console.log(`[PASS] ${id}: ${name}`);
  } else {
    report.push({ id, name, passed: false, details });
    console.error(`[FAIL] ${id}: ${name} - Details: ${details || "Assertion failed"}`);
  }
}

async function main() {
  console.log("==================================================================");
  console.log("    STEP 3: MOBILE APP FOUNDATION VERIFICATION SUITE              ");
  console.log("==================================================================");

  // Wire up mobile client to route handlers
  setCustomFetch(async (input: RequestInfo | URL, init?: RequestInit) => {
    const urlStr =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const url = new URL(urlStr, "http://localhost:3000");
    const req = new Request(url.toString(), init);

    if (url.pathname === "/api/v1/auth/login") {
      return await loginHandler(req);
    }
    if (url.pathname === "/api/v1/auth/refresh") {
      return await refreshHandler(req);
    }
    if (url.pathname === "/api/v1/auth/logout") {
      return await logoutHandler(req);
    }
    if (url.pathname === "/api/v1/auth/me") {
      return await meHandler(req);
    }
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
  });

  // 1. Locate test student
  const student = await db.user.findFirst({
    where: { roleCode: UserRoleCode.STUDENT, status: "ACTIVE" },
  });

  if (!student) {
    throw new Error("No active student user found in database");
  }
  console.log(`Test Student: ${student.email} (${student.id})`);

  // Ensure clean initial state
  await TokenStorage.clearSession();

  // TEST 1: Unauthenticated state: initial tokens are empty
  const initialAccessToken = await TokenStorage.getAccessToken();
  const initialRefreshToken = await TokenStorage.getRefreshToken();
  assert(
    initialAccessToken === null && initialRefreshToken === null,
    "TEST 1",
    "Unauthenticated user starts with empty secure token storage"
  );

  // TEST 2: Invalid credentials handling (401 handled by mobile AuthApi)
  let invalidHandled = false;
  try {
    await AuthApi.login({
      identifier: student.email,
      password: "WrongPassword123!",
    });
  } catch (err: any) {
    if (err.status === 401 || err.code === "UNAUTHORIZED" || err.message.includes("Invalid")) {
      invalidHandled = true;
    }
  }
  assert(
    invalidHandled,
    "TEST 2",
    "Invalid credentials properly throw ApiError with 401 UNAUTHORIZED"
  );

  // TEST 3: Login API integration with valid credentials
  let sessionBundle: any = null;
  try {
    sessionBundle = await AuthApi.login({
      identifier: student.email,
      password: "StudentSecure2026!",
    });

    const success =
      sessionBundle !== null &&
      typeof sessionBundle.accessToken === "string" &&
      typeof sessionBundle.refreshToken === "string" &&
      sessionBundle.user?.id === student.id &&
      sessionBundle.user?.roleCode === UserRoleCode.STUDENT;

    assert(
      success,
      "TEST 3",
      "Login API integration successfully authenticates and returns session bundle"
    );
  } catch (err: any) {
    assert(false, "TEST 3", "Login API integration", err.message);
  }

  // TEST 4: Secure token storage verification
  const storedAccessToken = await TokenStorage.getAccessToken();
  const storedRefreshToken = await TokenStorage.getRefreshToken();
  const storedUser = await TokenStorage.getUser();
  assert(
    storedAccessToken === sessionBundle?.accessToken &&
      storedRefreshToken === sessionBundle?.refreshToken &&
      storedUser?.id === student.id,
    "TEST 4",
    "Tokens and user profile are securely stored in TokenStorage"
  );

  // TEST 5: Bearer token is automatically attached to authenticated requests
  try {
    const meRes = await AuthApi.getMe();
    assert(
      meRes.user.id === student.id && meRes.user.email === student.email,
      "TEST 5",
      "apiClient automatically attaches Bearer token to /api/v1/auth/me request"
    );
  } catch (err: any) {
    assert(false, "TEST 5", "Bearer token attachment check", err.message);
  }

  // TEST 6: Refresh token rotation with STEP 2 backend
  let refreshedBundle: any = null;
  try {
    const oldRefreshToken = storedRefreshToken;
    refreshedBundle = await AuthApi.refresh();

    const isRotated =
      refreshedBundle !== null &&
      typeof refreshedBundle.accessToken === "string" &&
      typeof refreshedBundle.refreshToken === "string" &&
      refreshedBundle.refreshToken !== oldRefreshToken;

    assert(
      isRotated,
      "TEST 6",
      "AuthApi.refresh rotates refresh token and updates secure token storage"
    );
  } catch (err: any) {
    assert(false, "TEST 6", "Refresh token rotation check", err.message);
  }

  // TEST 7: Expired access token triggers automatic single-flight refresh in apiClient
  try {
    // Intentionally corrupt access token to simulate expiration
    await TokenStorage.saveTokens("expired.corrupted.token", refreshedBundle.refreshToken);

    // Call /api/v1/auth/me — apiClient should catch 401, refresh with refreshToken, save new tokens, and return 200
    const meAfterRefresh = await AuthApi.getMe();

    const newAccessToken = await TokenStorage.getAccessToken();
    const isAutoRefreshed =
      meAfterRefresh.user.id === student.id &&
      newAccessToken !== "expired.corrupted.token" &&
      newAccessToken !== null;

    assert(
      isAutoRefreshed,
      "TEST 7",
      "apiClient transparently catches 401, refreshes tokens via single-flight mechanism, and retries request"
    );
  } catch (err: any) {
    assert(false, "TEST 7", "Automatic 401 refresh interception", err.message);
  }

  // TEST 8: Failed refresh clears authentication state & invokes auth failure handler
  let failureCallbackInvoked = false;
  registerAuthFailureHandler(() => {
    failureCallbackInvoked = true;
  });

  try {
    // Put an invalid access token and an invalid refresh token
    await TokenStorage.saveTokens("expired.corrupted.token", "invalid_revoked_refresh_token_xyz");

    let threw = false;
    try {
      await AuthApi.getMe();
    } catch {
      threw = true;
    }

    const tokensAfterFailure = await TokenStorage.getAccessToken();
    assert(
      threw && tokensAfterFailure === null && failureCallbackInvoked,
      "TEST 8",
      "Failed refresh clears secure session storage and invokes onAuthFailureCallback"
    );
  } catch (err: any) {
    assert(false, "TEST 8", "Failed refresh cleanup check", err.message);
  }

  // TEST 9: Native logout revokes session and clears local tokens
  try {
    // Log back in
    const freshSession = await AuthApi.login({
      identifier: student.email,
      password: "StudentSecure2026!",
    });

    await AuthApi.logout();

    const tokenAfterLogout = await TokenStorage.getAccessToken();
    const userAfterLogout = await TokenStorage.getUser();

    // Verify token is revoked on backend
    let refreshAfterLogoutFailed = false;
    try {
      await AuthApi.refresh();
    } catch {
      refreshAfterLogoutFailed = true;
    }

    assert(
      tokenAfterLogout === null && userAfterLogout === null && refreshAfterLogoutFailed,
      "TEST 9",
      "AuthApi.logout revokes session on backend and completely purges local secure storage"
    );
  } catch (err: any) {
    assert(false, "TEST 9", "Logout revocation check", err.message);
  }

  // TEST 10: Role and permission preservation on mobile client
  try {
    const admin = await db.user.findFirst({
      where: { roleCode: UserRoleCode.SUPER_ADMIN, status: "ACTIVE" },
    });

    if (admin) {
      const adminSession = await AuthApi.login({
        identifier: admin.email,
        password: "SuperAdminSecure2026!",
      });

      assert(
        adminSession.user.roleCode === UserRoleCode.SUPER_ADMIN &&
          adminSession.user.permissions.length > 5,
        "TEST 10",
        "Mobile client receives and preserves full server-side roles and granular permissions"
      );

      // Clean up
      await AuthApi.logout();
    }
  } catch (err: any) {
    assert(false, "TEST 10", "Admin role preservation check", err.message);
  }

  console.log("==================================================================");
  console.log("                     MOBILE TEST SUMMARY REPORT                   ");
  console.log("==================================================================");
  const total = report.length;
  const passed = report.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL: ${total} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error("Fatal test error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
