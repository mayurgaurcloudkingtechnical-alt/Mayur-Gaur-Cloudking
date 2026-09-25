import { POST as loginHandler } from "../src/app/api/v1/auth/login/route";
import { POST as refreshHandler } from "../src/app/api/v1/auth/refresh/route";
import { POST as logoutHandler } from "../src/app/api/v1/auth/logout/route";
import { GET as meHandler } from "../src/app/api/v1/auth/me/route";
import { db } from "../src/server/db/client";
import { UserRoleCode } from "@prisma/client";

async function main() {
  console.log("==================================================================");
  console.log("   STEP 2: HTTP ROUTE HANDLERS VERIFICATION SUITE (/api/v1/auth)  ");
  console.log("==================================================================");

  const student = await db.user.findFirst({
    where: { roleCode: UserRoleCode.STUDENT, status: "ACTIVE" },
  });

  if (!student) throw new Error("No active student user found in database");

  // 1. Invalid Login (401)
  const badReq = new Request("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: student.email,
      password: "WrongPassword999!",
    }),
  });
  const badRes = await loginHandler(badReq);
  const badJson = await badRes.json();
  console.log(`[HTTP TEST 1] Invalid login response status: ${badRes.status} (Expected: 401)`, badJson);
  if (badRes.status !== 401 || badJson.code !== "UNAUTHORIZED") {
    throw new Error("Invalid login did not return 401 UNAUTHORIZED");
  }

  // 2. Valid Login (200)
  const goodReq = new Request("http://localhost:3000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: student.email,
      password: "StudentSecure2026!",
      deviceId: "ios-test-uuid-99",
      deviceName: "iPhone 15 Pro",
      platform: "IOS",
    }),
  });
  const goodRes = await loginHandler(goodReq);
  const goodJson = await goodRes.json();
  console.log(`[HTTP TEST 2] Valid login response status: ${goodRes.status} (Expected: 200)`);
  if (goodRes.status !== 200 || !goodJson.accessToken || !goodJson.refreshToken) {
    throw new Error("Valid login did not return 200 with tokens");
  }

  // 3. /api/v1/auth/me with Bearer Token (200)
  const meReq = new Request("http://localhost:3000/api/v1/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${goodJson.accessToken}`,
    },
  });
  const meRes = await meHandler(meReq);
  const meJson = await meRes.json();
  console.log(`[HTTP TEST 3] /api/v1/auth/me status: ${meRes.status} (Expected: 200)`, meJson.user.email);
  if (meRes.status !== 200 || meJson.user.id !== student.id) {
    throw new Error("/api/v1/auth/me failed");
  }

  // 4. /api/v1/auth/refresh (200 & Rotation)
  const refReq = new Request("http://localhost:3000/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: goodJson.refreshToken,
    }),
  });
  const refRes = await refreshHandler(refReq);
  const refJson = await refRes.json();
  console.log(`[HTTP TEST 4] /api/v1/auth/refresh status: ${refRes.status} (Expected: 200)`);
  if (refRes.status !== 200 || refJson.refreshToken === goodJson.refreshToken) {
    throw new Error("Token refresh or rotation failed");
  }

  // 5. /api/v1/auth/logout (200)
  const logoutReq = new Request("http://localhost:3000/api/v1/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: refJson.refreshToken,
    }),
  });
  const logoutRes = await logoutHandler(logoutReq);
  const logoutJson = await logoutRes.json();
  console.log(`[HTTP TEST 5] /api/v1/auth/logout status: ${logoutRes.status} (Expected: 200)`, logoutJson);
  if (logoutRes.status !== 200 || !logoutJson.success) {
    throw new Error("Logout failed");
  }

  // 6. Refreshing a revoked token should fail (401)
  const reuseReq = new Request("http://localhost:3000/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      refreshToken: refJson.refreshToken,
    }),
  });
  const reuseRes = await refreshHandler(reuseReq);
  console.log(`[HTTP TEST 6] Revoked refresh attempt status: ${reuseRes.status} (Expected: 401)`);
  if (reuseRes.status !== 401) {
    throw new Error("Revoked refresh attempt did not return 401");
  }

  console.log("==================================================================");
  console.log("             ALL HTTP ROUTE HANDLER TESTS PASSED!                 ");
  console.log("==================================================================");
}

main()
  .catch((e) => {
    console.error("HTTP tests error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
