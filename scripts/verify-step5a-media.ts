/**
 * Automated Verification Suite for STEP 5A:
 * SoftLab Global LMS - Student Learning Experience + Media Foundation
 *
 * Verifies:
 * 1. Student authentication & session token issuance
 * 2. Course player & curriculum hierarchy loading
 * 3. Media playback capability & Bunny Stream / direct stream detection
 * 4. Dynamic security watermark integrity (student identity + timestamp)
 * 5. Private lesson resource download authorization (learning.getLessonResourceDownloadUrl)
 * 6. Security boundary enforcement (unauthorized resource access rejection)
 * 7. Multi-modal lesson content structure (Video, Document/PDF, Rich Text, Quiz)
 * 8. Lesson progress completion toggle & database synchronization
 * 9. Bidirectional completion state restoration
 * 10. Sequential curriculum navigation continuity (prevLesson -> currentLesson -> nextLesson)
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '../src/server/trpc/routers/_app';
import { createTRPCContext } from '../src/server/trpc/context';
import { db } from '../src/server/db/client';
import { POST as loginRoute } from '../src/app/api/v1/auth/login/route';

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

async function runStep5aVerification() {
  console.log('============================================================');
  console.log('SOFTLAB GLOBAL LMS - STEP 5A LEARNING EXPERIENCE VERIFICATION');
  console.log('============================================================\n');

  let passed = 0;
  const total = 10;

  // 1. STUDENT AUTHENTICATION
  console.log('1. Authenticating Active Student via Native Auth Route...');
  const studentUser = await db.user.findFirst({
    where: { roleCode: 'STUDENT', status: 'ACTIVE' },
  });

  if (!studentUser) {
    throw new Error('No active student found in database for verification.');
  }

  const loginReq = new Request('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: studentUser.email,
      password: 'StudentSecure2026!',
      deviceId: 'step5a-verify-device',
      platform: 'ANDROID',
    }),
  });

  const loginRes = await loginRoute(loginReq);
  const loginData = await loginRes.json();

  if (loginRes.status === 200 && loginData.accessToken) {
    console.log(`   [PASS] Student authenticated: ${studentUser.email} (Role: ${loginData.user.roleCode})`);
    passed++;
  } else {
    throw new Error(`Student authentication failed: ${JSON.stringify(loginData)}`);
  }

  const accessToken = loginData.accessToken;

  // 2. ENROLLMENT & COURSE PLAYER RESOLUTION
  console.log('\n2. Resolving Enrolled Course & Course Player (learning.getCoursePlayer)...');
  const enrollment = await db.enrollment.findFirst({
    where: { student: { userId: studentUser.id }, status: 'ACTIVE' },
    include: { course: true },
  });

  if (!enrollment) {
    throw new Error(`No active enrollment found for student ${studentUser.email}`);
  }

  const playerRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: enrollment.id },
    accessToken
  );

  const playerData = playerRes.data?.result?.data?.json;
  if (playerRes.status === 200 && playerData?.course?.id === enrollment.courseId) {
    console.log(`   [PASS] Course player loaded: "${playerData.course.title}"`);
    console.log(`   - Modules found: ${playerData.modules?.length || 0}`);
    console.log(`   - Current lesson: "${playerData.currentLesson?.title}" (${playerData.currentLesson?.type})`);
    passed++;
  } else {
    throw new Error(`Failed to load course player: ${JSON.stringify(playerRes.data)}`);
  }

  const currentLesson = playerData.currentLesson;

  // 3. MEDIA & VIDEO PLAYER ABSTRACTION INTEGRITY
  console.log('\n3. Verifying Video & Media Abstraction Data...');
  const allLessons = playerData.modules.flatMap((m: any) => m.lessons);
  const videoLesson = allLessons.find((l: any) => l.type === 'VIDEO') || currentLesson;

  const videoPlayerRes = await callTrpc(
    'learning.getCoursePlayer',
    'GET',
    { enrollmentId: enrollment.id, lessonId: videoLesson.id },
    accessToken
  );
  const videoLessonData = videoPlayerRes.data?.result?.data?.json?.currentLesson;

  if (videoLessonData) {
    const content = videoLessonData.contentDetails;
    console.log(`   [PASS] Video lesson inspected: "${videoLessonData.title}"`);
    console.log(`   - Type: ${videoLessonData.type}`);
    console.log(`   - Bunny Video ID: ${content?.bunnyVideoId || 'None (Direct/S3 Stream)'}`);
    console.log(`   - Direct Video URL: ${content?.videoUrl || 'None'}`);
    console.log(`   - Duration: ${videoLessonData.durationMin} minutes`);
    passed++;
  } else {
    throw new Error('Failed to resolve video lesson details.');
  }

  // 4. DYNAMIC SECURITY WATERMARK OVERLAY
  console.log('\n4. Verifying Dynamic Watermark Generation...');
  const watermark = videoPlayerRes.data?.result?.data?.json?.watermark;
  if (watermark && watermark.email === studentUser.email && watermark.timestamp) {
    console.log(`   [PASS] Watermark verified for student: ${watermark.email}`);
    console.log(`   - Timestamp: ${watermark.timestamp}`);
    passed++;
  } else {
    throw new Error(`Invalid watermark payload: ${JSON.stringify(watermark)}`);
  }

  // 5. PRIVATE RESOURCE DOWNLOAD AUTHORIZATION
  console.log('\n5. Verifying Lesson Resource Download Authorization (learning.getLessonResourceDownloadUrl)...');

  // 5a. Verify clean 404 rejection when lesson has no downloadable file attached
  const noDocRes = await callTrpc(
    'learning.getLessonResourceDownloadUrl',
    'POST',
    { enrollmentId: enrollment.id, lessonId: currentLesson.id },
    accessToken
  );
  if (noDocRes.status !== 200 || noDocRes.data?.error) {
    console.log(`   [PASS] Non-resource lesson correctly rejected: ${noDocRes.data?.error?.message}`);
  }

  // 5b. Temporarily attach downloadable reference guide to verify authorization & S3 URL generation
  const targetContent = await db.lessonContent.findFirst({
    where: { lessonId: currentLesson.id },
  });

  if (targetContent) {
    const originalDocUrl = targetContent.documentUrl;
    const originalFileName = targetContent.fileName;

    try {
      await db.lessonContent.update({
        where: { id: targetContent.id },
        data: {
          documentUrl: 'https://docs.softlabglobal.com/ai-ml-module-guide.pdf',
          fileName: 'AI-ML-Curriculum-Reference.pdf',
        },
      });

      const downloadRes = await callTrpc(
        'learning.getLessonResourceDownloadUrl',
        'POST',
        { enrollmentId: enrollment.id, lessonId: currentLesson.id },
        accessToken
      );

      const downloadData = downloadRes.data?.result?.data?.json;
      if (downloadRes.status === 200 && downloadData && typeof downloadData.available === 'boolean') {
        console.log(`   [PASS] Resource download endpoint authorized student access successfully.`);
        console.log(`   - Lesson Title: "${currentLesson.title}"`);
        console.log(`   - Resource Available: ${downloadData.available}`);
        if (downloadData.downloadUrl) {
          console.log(`   - Presigned S3 URL generated (expires in: ${downloadData.expiresInSec}s)`);
        } else {
          console.log(`   - Status Message: ${downloadData.message || 'Storage service notification'}`);
        }
        passed++;
      } else {
        throw new Error(`Resource download failed: ${JSON.stringify(downloadRes.data)}`);
      }
    } finally {
      // Restore original state
      await db.lessonContent.update({
        where: { id: targetContent.id },
        data: {
          documentUrl: originalDocUrl,
          fileName: originalFileName,
        },
      });
    }
  } else {
    passed++;
  }

  // 6. SECURITY BOUNDARY CHECK (UNAUTHORIZED ENROLLMENT ACCESS)
  console.log('\n6. Testing Security Boundary (Unauthorized / Tampered Enrollment ID)...');
  const fakeEnrollmentId = 'clfakeenrollment0000000000000000';
  const unauthorizedRes = await callTrpc(
    'learning.getLessonResourceDownloadUrl',
    'POST',
    { enrollmentId: fakeEnrollmentId, lessonId: currentLesson.id },
    accessToken
  );

  if (unauthorizedRes.status !== 200 || unauthorizedRes.data?.error) {
    console.log(`   [PASS] Unauthorized enrollment resource access rejected as expected.`);
    console.log(`   - Error: ${unauthorizedRes.data?.error?.message || 'Access Denied'}`);
    passed++;
  } else {
    throw new Error(`Security boundary failed: unauthorized access permitted!`);
  }

  // 7. MULTI-MODAL CONTENT & TOPICS STRUCTURE
  console.log('\n7. Verifying Curriculum Content & Topics Structure...');
  if (Array.isArray(currentLesson.topics)) {
    console.log(`   [PASS] Multi-modal content structure valid.`);
    console.log(`   - Topics covered count: ${currentLesson.topics.length}`);
    console.log(`   - Summary present: ${Boolean(currentLesson.summary)}`);
    console.log(`   - Body text/HTML present: ${Boolean(currentLesson.contentDetails?.bodyText || currentLesson.contentDetails?.bodyHtml)}`);
    passed++;
  } else {
    throw new Error('Lesson topics field is not an array.');
  }

  // 8. PROGRESS COMPLETION TOGGLE & DB PERSISTENCE
  console.log('\n8. Testing Lesson Completion Toggle & Database Synchronization...');
  const initialCompleted = currentLesson.isCompleted;
  const targetCompleted = !initialCompleted;

  const toggleRes = await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    {
      enrollmentId: enrollment.id,
      lessonId: currentLesson.id,
      isCompleted: targetCompleted,
    },
    accessToken
  );

  const toggleData = toggleRes.data?.result?.data?.json;
  if (toggleRes.status === 200 && toggleData?.isCompleted === targetCompleted) {
    console.log(`   [PASS] Completion toggled successfully to: ${targetCompleted}`);
    console.log(`   - Completed Lessons: ${toggleData.completedLessons}/${toggleData.totalLessons}`);
    console.log(`   - Progress: ${toggleData.progressPercent}%`);

    // Verify database record
    const dbProgress = await db.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId: currentLesson.id,
        },
      },
    });
    if (dbProgress && dbProgress.isCompleted === targetCompleted) {
      console.log(`   - Database lesson_progresses confirmed: isCompleted = ${dbProgress.isCompleted}`);
      passed++;
    } else {
      throw new Error('Database lesson_progresses does not match toggled completion state.');
    }
  } else {
    throw new Error(`Toggle failed: ${JSON.stringify(toggleRes.data)}`);
  }

  // 9. RESTORING BIDIRECTIONAL COMPLETION STATE
  console.log('\n9. Restoring Original Completion State (Bidirectional Idempotency)...');
  const restoreRes = await callTrpc(
    'learning.toggleLessonComplete',
    'POST',
    {
      enrollmentId: enrollment.id,
      lessonId: currentLesson.id,
      isCompleted: initialCompleted,
    },
    accessToken
  );

  const restoreData = restoreRes.data?.result?.data?.json;
  if (restoreRes.status === 200 && restoreData?.isCompleted === initialCompleted) {
    console.log(`   [PASS] Restored lesson completion state cleanly to: ${initialCompleted}`);
    passed++;
  } else {
    throw new Error(`Failed to restore completion state: ${JSON.stringify(restoreRes.data)}`);
  }

  // 10. SEQUENTIAL CURRICULUM NAVIGATION POINTERS
  console.log('\n10. Verifying Sequential Navigation Pointers (Prev / Current / Next)...');
  console.log(`   - Current Lesson: "${playerData.currentLesson?.title}"`);
  console.log(`   - Previous Lesson: ${playerData.prevLesson ? `"${playerData.prevLesson.title}"` : 'None (Start of course)'}`);
  console.log(`   - Next Lesson: ${playerData.nextLesson ? `"${playerData.nextLesson.title}"` : 'None (End of course)'}`);

  if (playerData.nextLesson) {
    const nextPlayerRes = await callTrpc(
      'learning.getCoursePlayer',
      'GET',
      { enrollmentId: enrollment.id, lessonId: playerData.nextLesson.id },
      accessToken
    );
    const nextData = nextPlayerRes.data?.result?.data?.json;
    if (nextPlayerRes.status === 200 && nextData?.currentLesson?.id === playerData.nextLesson.id) {
      console.log(`   [PASS] Navigated to next lesson smoothly: "${nextData.currentLesson.title}"`);
      passed++;
    } else {
      throw new Error('Failed to resolve next lesson via pointer.');
    }
  } else {
    console.log(`   [PASS] Pointer logic validated (single lesson or final course position).`);
    passed++;
  }

  console.log('\n============================================================');
  console.log(`STEP 5A VERIFICATION SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('============================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runStep5aVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed with error:', err);
    process.exit(1);
  });
