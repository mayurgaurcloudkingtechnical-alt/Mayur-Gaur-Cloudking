import { db } from "../src/server/db/client";
import { verifyUserCredentials } from "../src/server/auth/verify-credentials";
import { NativeTokenService, hashToken } from "../src/server/auth/native-token.service";
import { createTRPCContext } from "../src/server/trpc/context";
import { appRouter } from "../src/server/trpc/routers/_app";
import { UserRoleCode } from "@prisma/client";
import { SignJWT } from "jose";

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
  console.log("   STEP 2: NATIVE AUTHENTICATION FOUNDATION VERIFICATION SUITE   ");
  console.log("==================================================================");

  // 1. Locate test user
  const studentUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.STUDENT, status: "ACTIVE" },
    include: {
      role: true,
      studentProfile: true,
    },
  });

  const adminUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.SUPER_ADMIN, status: "ACTIVE" },
    include: { role: true },
  });

  if (!studentUser) {
    throw new Error("No active student user found in database to execute tests against.");
  }
  console.log(`Found Test Student: ${studentUser.email} (ID: ${studentUser.id})`);

  // TEST 1: Existing Web LMS authentication still works
  try {
    const webAuthResult = await verifyUserCredentials({
      identifier: studentUser.email,
      password: "StudentSecure2026!",
    });
    assert(
      webAuthResult !== null && webAuthResult.id === studentUser.id && webAuthResult.roleCode === UserRoleCode.STUDENT,
      "TEST 1",
      "Existing Web LMS credential verification logic works with standard credentials"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 1", "Existing Web LMS credential verification logic works", msg);
  }

  // TEST 2: Valid native credentials return access + refresh tokens
  let sessionBundle: any = null;
  try {
    sessionBundle = await NativeTokenService.createSession({
      userId: studentUser.id,
      deviceId: "test-device-uuid-001",
      deviceName: "Pixel 8 Pro Android 15",
      platform: "ANDROID",
    });

    const hasTokens =
      typeof sessionBundle?.accessToken === "string" &&
      typeof sessionBundle?.refreshToken === "string" &&
      sessionBundle.expiresIn > 0 &&
      sessionBundle.user?.id === studentUser.id;

    assert(hasTokens, "TEST 2", "Valid native session creates access and refresh tokens with correct payload");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 2", "Valid native session creates access and refresh tokens", msg);
  }

  // TEST 3: Invalid native credentials return null/error
  try {
    const invalidResult = await verifyUserCredentials({
      identifier: studentUser.email,
      password: "CompletelyWrongPassword123!",
    });
    assert(invalidResult === null, "TEST 3", "Invalid credentials return null / fail authentication");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 3", "Invalid credentials return null / fail authentication", msg);
  }

  // TEST 4: Valid Bearer access token can authenticate against a protected tRPC procedure
  try {
    const mockHeaders = new Headers({
      authorization: `Bearer ${sessionBundle.accessToken}`,
    });

    const ctx = await createTRPCContext({
      req: { headers: mockHeaders } as any,
    } as any);

    assert(
      ctx.user !== null && ctx.user.id === studentUser.id && ctx.user.roleCode === UserRoleCode.STUDENT,
      "TEST 4A",
      "createTRPCContext successfully authenticates Bearer access token and resolves ContextUser"
    );

    // Call a protected tRPC procedure: dashboard.getSummary
    const caller = appRouter.createCaller(ctx);
    const dashboardData = await caller.dashboard.getSummary();
    assert(
      dashboardData !== undefined && dashboardData !== null,
      "TEST 4B",
      "Protected tRPC procedure 'dashboard.getSummary' executes successfully with Bearer token authentication"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 4", "Bearer token authenticates against protected tRPC procedure", msg);
  }

  // TEST 5: Missing Bearer token behaves correctly (falls back to null or cookie)
  try {
    const emptyHeaders = new Headers();
    const unauthedCtx = await createTRPCContext({
      req: { headers: emptyHeaders } as any,
    } as any);

    let threwUnauthorized = false;
    try {
      const caller = appRouter.createCaller(unauthedCtx);
      await caller.dashboard.getSummary();
    } catch (trpcErr: any) {
      if (trpcErr.code === "UNAUTHORIZED") {
        threwUnauthorized = true;
      }
    }

    assert(
      unauthedCtx.user === null && threwUnauthorized,
      "TEST 5",
      "Missing Bearer token gracefully denies unauthenticated access to protected procedure with UNAUTHORIZED code"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 5", "Missing Bearer token denies unauthenticated access", msg);
  }

  // TEST 6: Expired access token is rejected
  try {
    const secret =
      process.env.NATIVE_AUTH_JWT_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      "softlab_native_jwt_dev_secret_key_32_characters_minimum_required!";
    const secretKey = new TextEncoder().encode(secret);

    // Create an already-expired token (-60 seconds)
    const expiredToken = await new SignJWT({
      sub: studentUser.id,
      sid: "session-expired-test",
      role: studentUser.roleCode,
      email: studentUser.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setIssuer("softlab-global-native")
      .setAudience("softlab-global-apps")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secretKey);

    const expiredResult = await NativeTokenService.verifyAccessToken(expiredToken);
    assert(expiredResult === null, "TEST 6", "Expired access token is strictly rejected by verifyAccessToken");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 6", "Expired access token rejection check", msg);
  }

  // TEST 7: Valid refresh token creates a new access token (rotation)
  let rotatedBundle: any = null;
  try {
    rotatedBundle = await NativeTokenService.refreshSession({
      refreshToken: sessionBundle.refreshToken,
      ipAddress: "127.0.0.1",
      userAgent: "TestRunner/1.0",
    });

    const isRotated =
      typeof rotatedBundle?.accessToken === "string" &&
      typeof rotatedBundle?.refreshToken === "string" &&
      rotatedBundle.refreshToken !== sessionBundle.refreshToken &&
      rotatedBundle.user?.id === studentUser.id;

    assert(isRotated, "TEST 7", "Valid refresh token rotates session and issues new access token + new refresh token");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 7", "Session refresh and rotation", msg);
  }

  // TEST 8: Expired refresh token is rejected
  try {
    const expiredHash = hashToken("test-expired-raw-token-999");
    const expiredSession = await db.userDeviceSession.create({
      data: {
        userId: studentUser.id,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 3600 * 1000), // Expired 1 hour ago
      },
    });

    let rejected = false;
    try {
      await NativeTokenService.refreshSession({
        refreshToken: "test-expired-raw-token-999",
      });
    } catch {
      rejected = true;
    }

    assert(rejected, "TEST 8", "Expired refresh token is rejected during refresh attempt");

    // Clean up test expired session
    await db.userDeviceSession.delete({ where: { id: expiredSession.id } }).catch(() => {});
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 8", "Expired refresh token rejection", msg);
  }

  // TEST 9: Revoked refresh token is rejected (including the previously rotated token)
  try {
    let reuseRejected = false;
    try {
      // sessionBundle.refreshToken was already revoked by rotation in TEST 7
      await NativeTokenService.refreshSession({
        refreshToken: sessionBundle.refreshToken,
      });
    } catch {
      reuseRejected = true;
    }

    assert(reuseRejected, "TEST 9", "Previously rotated/revoked refresh token is rejected upon attempted reuse");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 9", "Revoked refresh token rejection", msg);
  }

  // TEST 10: Native logout / revocation works
  try {
    const logoutSuccess = await NativeTokenService.revokeSession({
      refreshToken: rotatedBundle.refreshToken,
    });

    let postLogoutRejected = false;
    try {
      await NativeTokenService.refreshSession({
        refreshToken: rotatedBundle.refreshToken,
      });
    } catch {
      postLogoutRejected = true;
    }

    assert(
      logoutSuccess && postLogoutRejected,
      "TEST 10",
      "Native logout revokes device session and prevents subsequent token refresh"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 10", "Native logout revocation", msg);
  }

  // TEST 11: Refresh token is securely stored as SHA-256 hash in DB, never plaintext
  try {
    const newSession = await NativeTokenService.createSession({
      userId: studentUser.id,
      platform: "WINDOWS",
      deviceName: "Windows 11 Laptop",
    });

    const dbRecord = await db.userDeviceSession.findFirst({
      where: { userId: studentUser.id, platform: "WINDOWS" },
      orderBy: { createdAt: "desc" },
    });

    const isHashed =
      dbRecord !== null &&
      dbRecord.tokenHash !== newSession.refreshToken &&
      dbRecord.tokenHash === hashToken(newSession.refreshToken);

    assert(
      isHashed,
      "TEST 11",
      "Refresh token is securely stored in database as a SHA-256 hash, raw token never stored"
    );

    // Clean up
    if (dbRecord) {
      await db.userDeviceSession.delete({ where: { id: dbRecord.id } }).catch(() => {});
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 11", "Hashed refresh token storage check", msg);
  }

  // TEST 12: Existing roles and permissions remain enforced (Student cannot access admin procedures)
  try {
    const mockStudentHeaders = new Headers({
      authorization: `Bearer ${sessionBundle.accessToken}`,
    });

    const studentCtx = await createTRPCContext({
      req: { headers: mockStudentHeaders } as any,
    } as any);

    let forbiddenDetected = false;
    try {
      const studentCaller = appRouter.createCaller(studentCtx);
      // Try accessing an admin-only procedure
      await studentCaller.admin.getHealth();
    } catch (trpcErr: any) {
      if (trpcErr.code === "FORBIDDEN") {
        forbiddenDetected = true;
      }
    }

    assert(
      forbiddenDetected,
      "TEST 12",
      "Role-Based Access Control (RBAC) strictly blocks Student Bearer token from accessing Admin procedures (FORBIDDEN)"
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    assert(false, "TEST 12", "RBAC procedure enforcement check", msg);
  }

  console.log("==================================================================");
  console.log("                      TEST SUMMARY REPORT                         ");
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
    console.error("Test suite fatal error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
