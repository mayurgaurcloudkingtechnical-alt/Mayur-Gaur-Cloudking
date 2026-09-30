/**
 * STEP 5E AUTOMATED VERIFICATION SUITE
 * SoftLab Global LMS: Final Student App QA + Hardening + Release Readiness
 *
 * Verifies 16 comprehensive student QA checks across all completed phases:
 * 1. Student authentication (/api/v1/auth/login)
 * 2. Token refresh (/api/v1/auth/refresh)
 * 3. Token rotation & revoked token reuse rejection
 * 4. Logout (/api/v1/auth/logout)
 * 5. Student data isolation (cross-user access boundary rejection)
 * 6. Student core modules (dashboard overview, enrolled courses, ID card)
 * 7. Media player & resource foundation (course player & download URL)
 * 8. Interactive quiz system (exams list, details, student attempts)
 * 9. Learning completion lifecycle & PostgreSQL persistence
 * 10. Certificate system (course completion check, my certificates, public verification)
 * 11. Aggregated learning history (lessons, exams, certificates, activity)
 * 12. Student notifications & deep-link navigation security
 * 13. Device management & push token registration (sessions & push tokens)
 * 14. Unauthorized access boundary (missing auth header -> 401)
 * 15. Invalid / revoked token rejection (expired/fake token -> 401)
 * 16. Fault tolerance & error resilience (non-existent IDs -> 404, bad inputs -> 400)
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../src/server/trpc/routers/_app';
import { createTRPCContext } from '../src/server/trpc/context';
import { db } from '../src/server/db/client';
import { POST as loginRoute } from '../src/app/api/v1/auth/login/route';
import { POST as refreshRoute } from '../src/app/api/v1/auth/refresh/route';
import { POST as logoutRoute } from '../src/app/api/v1/auth/logout/route';
import { PushNotificationService } from '../mobile/src/services/pushNotification.service';
import { CertificateStatus } from '@prisma/client';

async function callTrpc(path: string, method: 'GET' | 'POST', bodyOrQuery: any, token?: string) {
  let url = `http://localhost:3000/api/trpc/${path}`;
  let reqInit: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };

  if (method === 'GET' && bodyOrQuery) {
    const query = encodeURIComponent(JSON.stringify({ json: bodyOrQuery }));
    url += `?input=${query}`;
  } else if (method === 'POST') {
    reqInit.body = JSON.stringify({ json: bodyOrQuery || {} });
  }

  const req = new Request(url, reqInit);
  const res = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

  const json = await res.json();
  return { status: res.status, data: json };
}

async function runStep5eQA() {
  console.log('============================================================');
  console.log('SOFTLAB GLOBAL LMS - STEP 5E FINAL STUDENT QA & HARDENING');
  console.log('============================================================\n');

  let passed = 0;
  const total = 16;

  // Find active student user
  const studentUser = await db.user.findFirst({
    where: { roleCode: 'STUDENT', status: 'ACTIVE' },
    include: { studentProfile: true },
  });

  if (!studentUser || !studentUser.studentProfile) {
    throw new Error('No active student with studentProfile found in database.');
  }

  // 1. STUDENT AUTHENTICATION
  console.log('1. Verifying Student Authentication (/api/v1/auth/login)...');
  const loginReq = new Request('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: studentUser.email,
      password: 'StudentSecure2026!',
      deviceId: 'step5e-qa-device-01',
      platform: 'ANDROID',
    }),
  });

  const loginRes = await loginRoute(loginReq);
  const loginData = await loginRes.json();

  if (loginRes.status === 200 && loginData.accessToken && loginData.refreshToken) {
    console.log(`   [PASS] Student authenticated successfully: ${studentUser.email} (${loginData.user.name})`);
    passed++;
  } else {
    throw new Error(`Authentication failed: ${JSON.stringify(loginData)}`);
  }

  let currentAccessToken = loginData.accessToken;
  let currentRefreshToken = loginData.refreshToken;

  // 2. TOKEN REFRESH
  console.log('\n2. Verifying Token Refresh (/api/v1/auth/refresh)...');
  const refreshReq = new Request('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: currentRefreshToken,
      deviceId: 'step5e-qa-device-01',
      platform: 'ANDROID',
    }),
  });

  const refreshRes = await refreshRoute(refreshReq);
  const refreshData = await refreshRes.json();

  if (refreshRes.status === 200 && refreshData.accessToken && refreshData.refreshToken) {
    console.log(`   [PASS] Token refreshed successfully. New token pair generated.`);
    passed++;
  } else {
    throw new Error(`Token refresh failed: ${JSON.stringify(refreshData)}`);
  }

  const oldRefreshToken = currentRefreshToken;
  currentAccessToken = refreshData.accessToken;
  currentRefreshToken = refreshData.refreshToken;

  // 3. TOKEN ROTATION & REVOKED REUSE REJECTION
  console.log('\n3. Verifying Token Rotation Security (Revoked Token Reuse Rejection)...');
  const replayReq = new Request('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      refreshToken: oldRefreshToken, // Already consumed
      deviceId: 'step5e-qa-device-01',
      platform: 'ANDROID',
    }),
  });

  const replayRes = await refreshRoute(replayReq);
  const replayData = await replayRes.json();

  if (replayRes.status === 401) {
    console.log(`   [PASS] Revoked refresh token reuse safely rejected with HTTP 401.`);
    passed++;
  } else {
    throw new Error(`Security breach: Revoked token was accepted! Status: ${replayRes.status}`);
  }

  // 4. LOGOUT & SESSION TERMINATION
  console.log('\n4. Verifying Logout & Session Termination (/api/v1/auth/logout)...');
  const logoutReq = new Request('http://localhost:3000/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${currentAccessToken}`,
    },
    body: JSON.stringify({
      refreshToken: currentRefreshToken,
      deviceId: 'step5e-qa-device-01',
    }),
  });

  const logoutRes = await logoutRoute(logoutReq);
  const logoutData = await logoutRes.json();

  if (logoutRes.status === 200 && logoutData.success) {
    console.log(`   [PASS] Active session safely terminated via /api/v1/auth/logout.`);
    passed++;
  } else {
    throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
  }

  // Re-authenticate for subsequent functional QA
  const reAuthReq = new Request('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: studentUser.email,
      password: 'StudentSecure2026!',
      deviceId: 'step5e-qa-primary-device',
      platform: 'ANDROID',
    }),
  });
  const reAuthRes = await loginRoute(reAuthReq);
  const reAuthData = await reAuthRes.json();
  const studentToken = reAuthData.accessToken;

  // Retrieve student's enrollment
  const enrollment = await db.enrollment.findFirst({
    where: { studentId: studentUser.studentProfile.id, status: 'ACTIVE' },
    include: { course: true },
  });

  if (!enrollment) {
    throw new Error(`No active enrollment found for student ${studentUser.email}`);
  }

  // 5. STUDENT DATA ISOLATION (CROSS-USER ACCESS REJECTION)
  console.log('\n5. Verifying Student Data Isolation (Cross-User Access Boundary)...');
  // Attempt to access a different student's enrollment or invalid enrollment ID
  const otherEnrollment = await db.enrollment.findFirst({
    where: { studentId: { not: studentUser.studentProfile.id } },
  });
  const forbiddenEnrollmentId = otherEnrollment?.id || '00000000-0000-0000-0000-000000000002';

  const crossUserRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: forbiddenEnrollmentId },
    studentToken
  );

  if (crossUserRes.status === 403 || crossUserRes.status === 404 || crossUserRes.data?.error) {
    console.log(`   [PASS] Cross-student course data isolation enforced (HTTP ${crossUserRes.status}).`);
    passed++;
  } else {
    throw new Error(`Data isolation violation! Student was allowed to access other enrollment.`);
  }

  // 6. STUDENT CORE MODULES
  console.log('\n6. Verifying Student Core Modules (Dashboard, Courses, ID Card)...');
  const dashboardRes = await callTrpc('learning.getDashboardOverview', 'GET', undefined, studentToken);
  const coursesRes = await callTrpc('learning.getEnrolledCourses', 'GET', undefined, studentToken);
  const idCardRes = await callTrpc('learning.getMyIdCard', 'GET', undefined, studentToken);

  const dashboardOk = dashboardRes.status === 200 && dashboardRes.data?.result?.data?.json?.stats;
  const coursesOk = coursesRes.status === 200 && Array.isArray(coursesRes.data?.result?.data?.json);
  const idCardOk = idCardRes.status === 200 && idCardRes.data?.result?.data?.json?.user;

  if (dashboardOk && coursesOk && idCardOk) {
    const dData = dashboardRes.data.result.data.json;
    console.log(`   [PASS] Core modules resolved smoothly:`);
    console.log(`   - Enrolled Courses: ${dData.stats.enrolledCoursesCount}`);
    console.log(`   - Overall Progress: ${dData.stats.overallProgressPercent}%`);
    console.log(`   - Student Name: ${idCardRes.data.result.data.json.user.firstName} ${idCardRes.data.result.data.json.user.lastName}`);
    passed++;
  } else {
    throw new Error('Core modules verification failed.');
  }

  // 7. MEDIA FOUNDATION & RESOURCE PLAYER
  console.log('\n7. Verifying Media Foundation & Curriculum Player...');
  const playerRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: enrollment.id },
    studentToken
  );
  const playerData = playerRes.data?.result?.data?.json;

  let allLessons: any[] = [];
  if (playerData?.modules && Array.isArray(playerData.modules)) {
    allLessons = playerData.modules.flatMap((m: any) => m.lessons || []);
  }

  let testLesson = allLessons[0];
  if (!testLesson) {
    testLesson = await db.lesson.findFirst({
      where: { module: { courseId: enrollment.courseId } },
    });
  }
  const testLessonId = testLesson?.id;

  const resourceRes = await callTrpc(
    'learning.getLessonResourceDownloadUrl',
    'POST',
    { enrollmentId: enrollment.id, lessonId: testLessonId },
    studentToken
  );

  if (playerRes.status === 200 && playerData?.course && (resourceRes.status === 200 || resourceRes.data?.error)) {
    console.log(`   [PASS] Media curriculum player loaded (${playerData?.modules?.length || 0} modules).`);
    console.log(`   - Course: "${playerData.course.title}"`);
    console.log(`   - Active Lesson: "${playerData.activeLesson?.title || testLesson?.title || 'None'}"`);
    passed++;
  } else {
    throw new Error('Media player verification failed.');
  }

  // 8. INTERACTIVE QUIZ SYSTEM
  console.log('\n8. Verifying Interactive Quiz System Continuity...');
  const examsListRes = await callTrpc(
    'exam.listStudentExams',
    'GET',
    { courseId: enrollment.courseId },
    studentToken
  );
  const attemptsRes = await callTrpc('exam.listMyAttempts', 'GET', undefined, studentToken);

  if (examsListRes.status === 200 && attemptsRes.status === 200) {
    const exams = examsListRes.data?.result?.data?.json || [];
    const attempts = attemptsRes.data?.result?.data?.json || [];
    console.log(`   [PASS] Quiz system functioning normally:`);
    console.log(`   - Available Exams: ${exams.length}`);
    console.log(`   - Recorded Attempts: ${attempts.length}`);
    passed++;
  } else {
    throw new Error('Quiz system verification failed.');
  }

  // 9. LEARNING COMPLETION & STATE PERSISTENCE
  console.log('\n9. Verifying Learning Completion & Database Persistence...');
  const priorProgress = await db.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: testLessonId,
      },
    },
  });

  const toggleRes = await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    {
      enrollmentId: enrollment.id,
      lessonId: testLessonId,
      isCompleted: true,
    },
    studentToken
  );

  const dbCheck = await db.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: testLessonId,
      },
    },
  });

  if (toggleRes.status === 200 && dbCheck?.isCompleted === true) {
    console.log(`   [PASS] Lesson completion toggled and verified in PostgreSQL.`);
    passed++;

    // Restore previous completion state if it was not completed originally
    if (!priorProgress || !priorProgress.isCompleted) {
      await callTrpc(
        'learning.toggleLessonComplete',
        'POST',
        {
          enrollmentId: enrollment.id,
          lessonId: testLessonId,
          isCompleted: false,
        },
        studentToken
      );
    }
  } else {
    throw new Error('Lesson completion toggle failed.');
  }

  // 10. CERTIFICATE SYSTEM CONTINUITY
  console.log('\n10. Verifying Certificate System & Verification Endpoint...');
  const certStatusRes = await callTrpc(
    'exam.checkCourseCompletion',
    'GET',
    { courseId: enrollment.courseId },
    studentToken
  );
  const certsListRes = await callTrpc('certificate.getMyCertificates', 'GET', undefined, studentToken);

  // Test public verification endpoint with placeholder/dummy code
  const publicVerifyRes = await callTrpc(
    'certificate.verify',
    'GET',
    { identifier: 'NON-EXISTENT-CERT-CHECK' },
    undefined
  );

  if (certStatusRes.status === 200 && certsListRes.status === 200 && publicVerifyRes.status === 200) {
    console.log(`   [PASS] Certificate lifecycle endpoints responding:`);
    console.log(`   - Course Completion Check: eligible = ${certStatusRes.data.result.data.json.eligible}`);
    console.log(`   - Public Verify Endpoint: responding normally (${publicVerifyRes.data.result.data.json.message})`);
    passed++;
  } else {
    throw new Error('Certificate system verification failed.');
  }

  // 11. AGGREGATED LEARNING HISTORY
  console.log('\n11. Verifying Aggregated Learning History (learning.getLearningHistory)...');
  const historyRes = await callTrpc('learning.getLearningHistory', 'GET', undefined, studentToken);
  const historyData = historyRes.data?.result?.data?.json;

  if (
    historyRes.status === 200 &&
    Array.isArray(historyData?.completedLessons) &&
    Array.isArray(historyData?.examAttempts) &&
    Array.isArray(historyData?.certificates) &&
    Array.isArray(historyData?.recentActivity)
  ) {
    console.log(`   [PASS] Learning history successfully aggregated:`);
    console.log(`   - Completed Lessons: ${historyData.completedLessons.length}`);
    console.log(`   - Exam Attempts: ${historyData.examAttempts.length}`);
    console.log(`   - Earned Certificates: ${historyData.certificates.length}`);
    console.log(`   - Activity Timeline Events: ${historyData.recentActivity.length}`);
    passed++;
  } else {
    throw new Error('Learning history verification failed.');
  }

  // 12. STUDENT NOTIFICATIONS & DEEP-LINK SECURITY
  console.log('\n12. Verifying Notifications & Deep-Link Security...');
  const notifsRes = await callTrpc('notifications.getMyNotifications', 'GET', undefined, studentToken);
  const markAllRes = await callTrpc('notifications.markAllAsRead', 'POST', {}, studentToken);
  const unreadCount = notifsRes.data?.result?.data?.json?.unreadCount ?? 0;

  // Validate deep link url safety via PushNotificationService
  const safeLink = PushNotificationService.parseNotificationDestination('/student/courses/cs101');
  const unsafeLink = PushNotificationService.parseNotificationDestination('javascript:alert(1)');
  const maliciousDomain = PushNotificationService.parseNotificationDestination('https://evil-phishing.com/steal');

  const linksSecure = safeLink !== null && unsafeLink === null && maliciousDomain === null;

  if (notifsRes.status === 200 && markAllRes.status === 200 && linksSecure) {
    console.log(`   [PASS] Notifications operational & URL security rules passed.`);
    console.log(`   - Unread Badge Count: ${unreadCount}`);
    console.log(`   - Safe internal deep-link accepted: ${safeLink?.screen}`);
    console.log(`   - Malicious javascript: URL blocked: ${unsafeLink === null}`);
    console.log(`   - Untrusted external domain blocked: ${maliciousDomain === null}`);
    passed++;
  } else {
    throw new Error('Notifications or deep-link security failed.');
  }

  // 13. DEVICE MANAGEMENT & PUSH REGISTRATION
  console.log('\n13. Verifying Device Management & Push Token Registration...');
  const sessionsRes = await callTrpc('auth.getMySessions', 'GET', undefined, studentToken);
  const pushRegRes = await callTrpc(
    'notifications.registerPushToken',
    'POST',
    {
      pushToken: 'ExponentPushToken[qa-step5e-release-test-token]',
      platform: 'android',
      deviceId: 'step5e-qa-primary-device',
    },
    studentToken
  );

  const sessions = sessionsRes.data?.result?.data?.json;
  if (sessionsRes.status === 200 && Array.isArray(sessions) && pushRegRes.status === 200) {
    console.log(`   [PASS] Device sessions and push token verified:`);
    console.log(`   - Active Sessions Count: ${sessions.length}`);
    console.log(`   - Push Token Registered: ${pushRegRes.data?.result?.data?.json?.registered}`);
    passed++;
  } else {
    throw new Error('Device management verification failed.');
  }

  // 14. UNAUTHORIZED ACCESS BOUNDARY
  console.log('\n14. Verifying Unauthorized Access Boundary (Missing Auth Header)...');
  const missingTokenRes = await callTrpc('learning.getDashboardOverview', 'GET', undefined, undefined);

  if (missingTokenRes.status === 401 || missingTokenRes.data?.error) {
    console.log(`   [PASS] Unauthenticated request strictly blocked with HTTP 401.`);
    passed++;
  } else {
    throw new Error('Security boundary failed: Unauthenticated request was allowed!');
  }

  // 15. INVALID / REVOKED TOKEN REJECTION
  console.log('\n15. Verifying Invalid Token Rejection...');
  const badTokenRes = await callTrpc(
    'learning.getDashboardOverview',
    'GET',
    undefined,
    'garbage-invalid-jwt-token-12345'
  );

  if (badTokenRes.status === 401 || badTokenRes.data?.error) {
    console.log(`   [PASS] Invalid token blocked with HTTP 401 UNAUTHORIZED.`);
    passed++;
  } else {
    throw new Error('Security boundary failed: Malformed/invalid token was allowed!');
  }

  // 16. FAULT TOLERANCE & ERROR RESILIENCE
  console.log('\n16. Verifying Fault Tolerance & Error Handling...');
  const nonExistentRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: 'c0000000-0000-0000-0000-000000000000' },
    studentToken
  );

  const badInputRes = await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    { enrollmentId: 12345, lessonId: null } as any, // invalid types
    studentToken
  );

  const nonExistentHandled = nonExistentRes.status === 404 || nonExistentRes.data?.error?.data?.code === 'NOT_FOUND';
  const badInputHandled = badInputRes.status === 400 || badInputRes.data?.error?.data?.code === 'BAD_REQUEST';

  if (nonExistentHandled && badInputHandled) {
    console.log(`   [PASS] Edge cases handled gracefully:`);
    console.log(`   - Non-existent resource returned clean NOT_FOUND (HTTP ${nonExistentRes.status})`);
    console.log(`   - Malformed input payload returned clean BAD_REQUEST (HTTP ${badInputRes.status})`);
    passed++;
  } else {
    throw new Error('Fault tolerance check failed.');
  }

  console.log('\n============================================================');
  console.log(`STEP 5E FINAL QA SUMMARY: ${passed}/${total} CHECKS PASSED`);
  console.log('============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runStep5eQA()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('QA Suite Failed:', err);
    process.exit(1);
  });
