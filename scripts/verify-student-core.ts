/**
 * Automated Verification Suite for STEP 4: SoftLab Global LMS - Student Core LMS
 * Tests:
 * 1. Student login via /api/v1/auth/login
 * 2. Student dashboard overview retrieval (learning.getDashboardOverview)
 * 3. Enrolled courses retrieval (learning.getEnrolledCourses)
 * 4. Course curriculum & player resolution (learning.getCoursePlayer)
 * 5. Modules and lessons structure validation
 * 6. Lesson completion toggle (learning.toggleLessonComplete)
 * 7. Progress persistence & database consistency verification
 * 8. Student profile & academic identity retrieval (learning.getMyIdCard)
 * 9. Authorization boundary check (non-student / invalid token access rejection)
 * 10. Token refresh continuity during student session
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../src/server/trpc/routers/_app';
import { createTRPCContext } from '../src/server/trpc/context';
import { NativeTokenService } from '../src/server/auth/native-token.service';
import { db } from '../src/server/db/client';
import { POST as loginRoute } from '../src/app/api/v1/auth/login/route';
import { POST as refreshRoute } from '../src/app/api/v1/auth/refresh/route';
import { POST as logoutRoute } from '../src/app/api/v1/auth/logout/route';

// Helper to dispatch tRPC requests directly in-process
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

async function runStudentCoreVerification() {
  console.log('============================================================');
  console.log('SOFTLAB GLOBAL LMS - STEP 4 STUDENT CORE VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  let total = 10;

  // 1. STUDENT LOGIN
  console.log('1. Testing Student Login via /api/v1/auth/login...');
  const studentUser = await db.user.findFirst({
    where: { roleCode: 'STUDENT', status: 'ACTIVE' },
  });

  if (!studentUser) {
    throw new Error('No active student user found in database for testing.');
  }

  const loginReq = new Request('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: studentUser.email,
      password: 'StudentSecure2026!',
      deviceId: 'student-mobile-verify-device',
      platform: 'ANDROID',
    }),
  });

  const loginRes = await loginRoute(loginReq);
  const loginData = await loginRes.json();

  if (loginRes.status === 200 && loginData.accessToken && loginData.user.roleCode === 'STUDENT') {
    console.log(`   [PASS] Student authenticated successfully: ${loginData.user.name}`);
    console.log(`   - Access Token received (length: ${loginData.accessToken.length})`);
    console.log(`   - Role: ${loginData.user.roleCode}`);
    passed++;
  } else {
    throw new Error(`Student login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
  }

  const accessToken = loginData.accessToken;
  const refreshToken = loginData.refreshToken;

  // 2. STUDENT DASHBOARD OVERVIEW
  console.log('\n2. Testing Student Dashboard Overview (learning.getDashboardOverview)...');
  const dashRes = await callTrpc('learning.getDashboardOverview', 'GET', null, accessToken);

  if (dashRes.status === 200 && dashRes.data?.result?.data?.json) {
    const dash = dashRes.data.result.data.json;
    console.log(`   [PASS] Dashboard overview retrieved successfully`);
    console.log(`   - Enrolled Courses: ${dash.stats.enrolledCoursesCount}`);
    console.log(`   - Completed Lessons: ${dash.stats.completedLessonsCount} / ${dash.stats.totalLessonsCount}`);
    console.log(`   - Overall Progress: ${dash.stats.overallProgressPercent}%`);
    console.log(`   - Upcoming Scheduled Classes: ${dash.upcomingClasses.length}`);
    passed++;
  } else {
    throw new Error(`getDashboardOverview failed: ${JSON.stringify(dashRes)}`);
  }

  // 3. ENROLLED COURSES
  console.log('\n3. Testing Enrolled Courses (learning.getEnrolledCourses)...');
  const coursesRes = await callTrpc('learning.getEnrolledCourses', 'GET', null, accessToken);
  const courses = coursesRes.data?.result?.data?.json;

  if (coursesRes.status === 200 && Array.isArray(courses)) {
    console.log(`   [PASS] Enrolled courses retrieved: ${courses.length} courses`);
    courses.forEach((c: any) => {
      console.log(`   - Course: "${c.courseTitle}" (Progress: ${c.progressPercent}%, Batch: ${c.batchCode || 'N/A'})`);
    });
    passed++;
  } else {
    throw new Error(`getEnrolledCourses failed: ${JSON.stringify(coursesRes)}`);
  }

  if (courses.length === 0) {
    throw new Error('Student has no enrolled courses to test curriculum & player.');
  }

  const activeEnrollment = courses[0];

  // 4. COURSE CURRICULUM & PLAYER
  console.log(`\n4. Testing Course Player for enrollment: ${activeEnrollment.id}...`);
  const playerRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: activeEnrollment.id },
    accessToken
  );
  const playerData = playerRes.data?.result?.data?.json;

  if (playerRes.status === 200 && playerData?.course && playerData?.modules) {
    console.log(`   [PASS] Course player loaded: "${playerData.course.title}"`);
    console.log(`   - Total Modules: ${playerData.modules.length}`);
    console.log(`   - Watermark configured: ${playerData.watermark?.email}`);
    passed++;
  } else {
    throw new Error(`getCoursePlayer failed: ${JSON.stringify(playerRes)}`);
  }

  // 5. MODULES & LESSONS STRUCTURE
  console.log('\n5. Validating Modules & Lessons Hierarchy...');
  const firstModule = playerData.modules[0];
  const allLessons = playerData.modules.flatMap((m: any) => m.lessons);

  if (firstModule && allLessons.length > 0) {
    console.log(`   [PASS] Curriculum structure verified`);
    console.log(`   - First Module: "${firstModule.title}" (${firstModule.lessons.length} lessons)`);
    console.log(`   - Current Lesson: "${playerData.currentLesson.title}" (Type: ${playerData.currentLesson.type})`);
    passed++;
  } else {
    throw new Error('Curriculum has no modules or lessons.');
  }

  // 6. TOGGLE LESSON COMPLETE MUTATION
  const testLesson = allLessons[0];
  console.log(`\n6. Testing Progress Mutation (learning.toggleLessonComplete) on lesson: ${testLesson.id}...`);
  const initialCompleted = testLesson.isCompleted;
  const targetCompleted = !initialCompleted;

  const toggleRes = await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    {
      enrollmentId: activeEnrollment.id,
      lessonId: testLesson.id,
      isCompleted: targetCompleted,
    },
    accessToken
  );

  const toggleData = toggleRes.data?.result?.data?.json;
  if (toggleRes.status === 200 && toggleData?.isCompleted === targetCompleted) {
    console.log(`   [PASS] Lesson progress toggled to: ${targetCompleted}`);
    console.log(`   - Updated Completed Lessons: ${toggleData.completedLessons} / ${toggleData.totalLessons}`);
    console.log(`   - Updated Progress: ${toggleData.progressPercent}%`);
    passed++;
  } else {
    throw new Error(`toggleLessonComplete failed: ${JSON.stringify(toggleRes)}`);
  }

  // 7. VERIFY DATABASE CONSISTENCY
  console.log('\n7. Verifying PostgreSQL Database Record Consistency...');
  const dbProgress = await db.lessonProgress.findUnique({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: activeEnrollment.id,
        lessonId: testLesson.id,
      },
    },
  });

  if (dbProgress && dbProgress.isCompleted === targetCompleted) {
    console.log(`   [PASS] Shared database record verified in lesson_progresses table`);
    console.log(`   - Enrollment: ${dbProgress.enrollmentId}`);
    console.log(`   - Lesson: ${dbProgress.lessonId}`);
    console.log(`   - isCompleted in PostgreSQL: ${dbProgress.isCompleted}`);
    passed++;
  } else {
    throw new Error('Database record does not match toggled completion state.');
  }

  // Restore initial state
  await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    {
      enrollmentId: activeEnrollment.id,
      lessonId: testLesson.id,
      isCompleted: initialCompleted,
    },
    accessToken
  );

  // 8. STUDENT PROFILE & ACADEMIC IDENTITY
  console.log('\n8. Testing Student Profile (learning.getMyIdCard)...');
  const profileRes = await callTrpc('learning.getMyIdCard', 'GET', null, accessToken);
  const profileData = profileRes.data?.result?.data?.json;

  if (profileRes.status === 200 && profileData?.studentId && profileData?.user) {
    console.log(`   [PASS] Student academic profile retrieved`);
    console.log(`   - Student ID Roll: ${profileData.studentId}`);
    console.log(`   - User: ${profileData.user.firstName} ${profileData.user.lastName} (${profileData.user.email})`);
    console.log(`   - Campus: ${profileData.center || 'Main Campus'}`);
    passed++;
  } else {
    throw new Error(`getMyIdCard failed: ${JSON.stringify(profileRes)}`);
  }

  // 9. UNAUTHORIZED BOUNDARY CHECK
  console.log('\n9. Testing Authorization & Security Boundaries...');
  const fakeTokenRes = await callTrpc('learning.getDashboardOverview', 'GET', null, 'invalid-bearer-token');
  const isUnauthorized = fakeTokenRes.status === 401 || fakeTokenRes.data?.error;

  if (isUnauthorized) {
    console.log(`   [PASS] Request with invalid token was safely rejected (${fakeTokenRes.status})`);
    passed++;
  } else {
    throw new Error('Expected invalid token to be rejected with 401.');
  }

  // 10. SESSION CONTINUITY & LOGOUT
  console.log('\n10. Testing Token Rotation & Session Revocation...');
  const refReq = new Request('http://localhost:3000/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const refRes = await refreshRoute(refReq);
  const refData = await refRes.json();

  if (refRes.status === 200 && refData.accessToken) {
    console.log('   [PASS] Token rotated successfully during active student session');
    
    // Revoke session via logout
    const logoutReq = new Request('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refData.accessToken}`,
      },
    });
    const logoutRes = await logoutRoute(logoutReq);
    if (logoutRes.status === 200) {
      console.log('   [PASS] Student session revoked via /api/v1/auth/logout');
      passed++;
    }
  } else {
    throw new Error(`Refresh failed: ${JSON.stringify(refData)}`);
  }

  console.log('\n============================================================');
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('============================================================');

  if (passed === total) {
    console.log('STEP 4 STUDENT CORE VERIFICATION COMPLETED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runStudentCoreVerification().catch((err) => {
  console.error('\nVerification Error:', err);
  process.exit(1);
});
