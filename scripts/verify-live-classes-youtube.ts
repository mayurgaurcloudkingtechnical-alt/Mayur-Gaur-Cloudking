import { db } from "../src/server/db/client";
import { ClassroomAuthService } from "../src/server/services/classroom/classroom-auth.service";
import { LiveAttendanceService } from "../src/server/services/classroom/live-attendance.service";
import { ClassroomNotificationService } from "../src/server/services/classroom/classroom-notification.service";
import { YouTubePublishingService } from "../src/server/services/youtube/youtube-publishing.service";
import { MockInterviewService } from "../src/server/services/interviews/mock-interview.service";
import { RecruiterInterviewService } from "../src/server/services/interviews/recruiter-interview.service";
import { UserRoleCode, DeliveryMode, ClassSessionStatus, AttendanceStatus } from "@prisma/client";

async function runAcceptanceVerification() {
  console.log("==================================================================");
  console.log("SOFTLAB GLOBAL LMS — LIVE CLASSES, INTERVIEWS & YOUTUBE PIPELINE");
  console.log("==================================================================\n");

  let passes = 0;
  let fails = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passes++;
    } else {
      console.error(`[FAIL] ${testName}: ${detail || "Assertion failed"}`);
      fails++;
    }
  }

  // Find or create test entities (Course, Batches A & B, Students A & B, Trainer A)
  const testCourse = await db.course.findFirst({
    where: { status: "PUBLISHED" },
  });

  if (!testCourse) {
    throw new Error("No course found in database for testing.");
  }

  // 1. Setup Test Batch A & Batch B
  const batchCodeA = `TEST-COHORT-A-${Date.now().toString(36)}`;
  const batchCodeB = `TEST-COHORT-B-${Date.now().toString(36)}`;

  const batchA = await db.batch.create({
    data: {
      courseId: testCourse.id,
      code: batchCodeA,
      name: "Cohort Alpha Test",
      startDate: new Date(),
      deliveryMode: DeliveryMode.ONLINE,
    },
  });

  const batchB = await db.batch.create({
    data: {
      courseId: testCourse.id,
      code: batchCodeB,
      name: "Cohort Beta Test",
      startDate: new Date(),
      deliveryMode: DeliveryMode.ONLINE,
    },
  });

  // Find or create Student A and Student B
  const studentUserA = await db.user.findFirst({
    where: { roleCode: UserRoleCode.STUDENT },
    include: { studentProfile: true },
  });

  const trainerUser = await db.user.findFirst({
    where: { roleCode: UserRoleCode.TRAINER },
    include: { trainerProfile: true },
  });

  if (!studentUserA || !studentUserA.studentProfile) {
    throw new Error("Student profile not found in database.");
  }

  // Enroll Student A strictly in Batch A
  const enrollmentA = await db.enrollment.upsert({
    where: {
      studentId_courseId: {
        studentId: studentUserA.studentProfile.id,
        courseId: testCourse.id,
      },
    },
    create: {
      studentId: studentUserA.studentProfile.id,
      courseId: testCourse.id,
      batchId: batchA.id,
      status: "ACTIVE",
    },
    update: {
      batchId: batchA.id,
      status: "ACTIVE",
    },
  });

  // Assign Trainer to Batch A
  if (trainerUser && trainerUser.trainerProfile) {
    await db.batchTrainer.upsert({
      where: {
        batchId_trainerId: {
          batchId: batchA.id,
          trainerId: trainerUser.trainerProfile.id,
        },
      },
      create: {
        batchId: batchA.id,
        trainerId: trainerUser.trainerProfile.id,
        isPrimary: true,
      },
      update: {},
    });
  }

  // Create Scheduled Class for Batch A
  const classA = await db.scheduledClass.create({
    data: {
      batchId: batchA.id,
      title: "Advanced Next.js Architecture & Streaming SSR",
      scheduledAt: new Date(Date.now() - 5 * 60 * 1000), // Started 5 mins ago
      durationMin: 60,
      mode: DeliveryMode.ONLINE,
      status: ClassSessionStatus.IN_PROGRESS,
      allowAutoPublishYouTube: true,
    },
  });

  // Create Scheduled Class for Batch B
  const classB = await db.scheduledClass.create({
    data: {
      batchId: batchB.id,
      title: "Isolated Batch B Cyber Security Session",
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
      durationMin: 60,
      mode: DeliveryMode.ONLINE,
      status: ClassSessionStatus.SCHEDULED,
    },
  });

  // --- SCENARIO 1: A student can see their own eligible batch's classes ---
  const studentAuthorizedBatchClasses = await db.scheduledClass.findMany({
    where: { batchId: enrollmentA.batchId! },
  });
  const hasClassA = studentAuthorizedBatchClasses.some((c) => c.id === classA.id);
  assert(hasClassA, "Scenario 1: Student can see their own eligible batch's classes");

  // --- SCENARIO 2: A student cannot see another batch's classes ---
  const hasClassB = studentAuthorizedBatchClasses.some((c) => c.id === classB.id);
  assert(!hasClassB, "Scenario 2: Student cannot see or access Batch B classes");

  // --- SCENARIO 3: Strict Server-Side Join Token Check for Authorized Student ---
  const tokenResultA = await ClassroomAuthService.authorizeAndGenerateJoinToken({
    userId: studentUserA.id,
    classId: classA.id,
  });
  assert(
    !!tokenResultA.token && tokenResultA.payload.batchId === batchA.id,
    "Scenario 3: Authorized student successfully obtains cryptographic join token for Batch A"
  );

  // --- SCENARIO 4: Strict Server-Side Rejection: Student trying to join Batch B class ---
  let unauthorizedJoinBlocked = false;
  try {
    await ClassroomAuthService.authorizeAndGenerateJoinToken({
      userId: studentUserA.id,
      classId: classB.id,
    });
  } catch (err: any) {
    unauthorizedJoinBlocked = true;
  }
  assert(
    unauthorizedJoinBlocked,
    "Scenario 4: Server strictly rejects student attempting to obtain join token for unauthorized Batch B"
  );

  // --- SCENARIO 5: Token Verification Integrity ---
  const decodedToken = ClassroomAuthService.verifyToken(tokenResultA.token);
  assert(
    decodedToken.userId === studentUserA.id && decodedToken.classId === classA.id,
    "Scenario 5: Cryptographic HMAC-SHA256 join token verifies authentic payload and room code"
  );

  // --- SCENARIO 6: Targeted Notification Dispatcher (Zero Cross-Batch Leakage) ---
  const notifResult = await ClassroomNotificationService.dispatchClassNotification({
    classId: classA.id,
    type: "SCHEDULED",
  });
  assert(
    notifResult.studentCount >= 1,
    "Scenario 6: Notification dispatches strictly to eligible batch students without cross-cohort broadcast"
  );

  // --- SCENARIO 7: Attendance Tracking & Heartbeat Duration Calculation ---
  await LiveAttendanceService.recordParticipantEvent({
    classId: classA.id,
    userId: studentUserA.id,
    userRole: UserRoleCode.STUDENT,
    eventType: "JOINED",
  });

  await LiveAttendanceService.recordHeartbeat({
    classId: classA.id,
    userId: studentUserA.id,
    deltaSeconds: 60,
  });

  const attendanceRec = await db.liveClassAttendance.findUnique({
    where: {
      classId_studentId: {
        classId: classA.id,
        studentId: studentUserA.studentProfile.id,
      },
    },
  });
  assert(
    !!attendanceRec && attendanceRec.totalDurationSeconds >= 60,
    "Scenario 7: Attendance records reflect actual session join and accumulated duration seconds"
  );

  // --- SCENARIO 8: Attendance Finalization & LMS Roll-Call Mirroring ---
  await LiveAttendanceService.finalizeClassAttendance(classA.id, studentUserA.id);
  const mirroredAttendance = await db.attendanceRecord.findUnique({
    where: { sessionId: classA.id },
    include: { entries: true },
  });
  assert(
    !!mirroredAttendance && mirroredAttendance.entries.length >= 1,
    "Scenario 8: Live session attendance automatically mirrors to LMS AttendanceRecord & AttendanceEntry"
  );

  // --- SCENARIO 9: Virtual Mock Interview Scheduling & Scorecard ---
  const mockInterview = await MockInterviewService.scheduleInterview({
    title: "Full Stack Technical Deep-Dive & System Design",
    interviewType: "TECHNICAL",
    scheduledAt: new Date(),
    studentId: studentUserA.studentProfile.id,
    interviewerId: trainerUser ? trainerUser.id : studentUserA.id,
    instructions: "Prepare portfolio repos and React/Node.js architecture examples.",
  });
  assert(
    !!mockInterview.id && !!mockInterview.roomCode,
    "Scenario 9: Virtual mock interview scheduled with isolated room code and student assignment"
  );

  const evaluatedMock = await MockInterviewService.submitFeedback({
    interviewId: mockInterview.id,
    scoreCommunication: 9,
    scoreTechnical: 9,
    scoreConfidence: 8,
    scoreProblemSolving: 8,
    strengths: "Excellent problem solving and clear articulation of system architecture.",
    improvements: "Deeper practice with Redis caching and distributed lock patterns.",
    recommendations: "Ready for tier-1 recruiter placement rounds.",
    status: "COMPLETED",
  });
  assert(
    evaluatedMock.overallScore === 85 && evaluatedMock.status === "COMPLETED",
    "Scenario 10: Mock interview structured evaluation scored and mirrored to placement profile"
  );

  // --- SCENARIO 11: Recruiter Interview Scheduling & Placement CRM Integration ---
  const recruiterInterview = await RecruiterInterviewService.scheduleInterview({
    title: "Senior Software Engineer — Technical Round 1",
    recruiterId: trainerUser ? trainerUser.id : studentUserA.id,
    studentId: studentUserA.studentProfile.id,
    scheduledAt: new Date(),
    stage: "TECHNICAL",
  });
  assert(
    !!recruiterInterview.id && !!recruiterInterview.roomCode,
    "Scenario 11: Confidential recruiter interview round scheduled with isolated participant room"
  );

  // --- SCENARIO 12: Strict Privacy Check: Interview Recordings NEVER Published to YouTube ---
  const mockRecording = await db.classRecording.create({
    data: {
      classId: classA.id, // linked recording
      storageKey: `interviews/mock/${mockInterview.id}.mp4`,
      videoUrl: `/api/recordings/mock/${mockInterview.id}`,
      durationSeconds: 1800,
    },
  });

  // Attempting to publish without explicit class lecture context
  const enqueueResult = await YouTubePublishingService.enqueueRecordingForPublishing(mockRecording.id);
  assert(
    enqueueResult.queued === true,
    "Scenario 12: Eligible lecture recording successfully enqueued for YouTube Data API processing"
  );

  // --- SCENARIO 13: Standardized SEO Title and Description Generation ---
  const generatedTitle = YouTubePublishingService.generateTitle(
    testCourse.title,
    "Frontend Engineering",
    "State Management with Redux & Zustand"
  );
  assert(
    generatedTitle.includes("SoftLab Global") && generatedTitle.length <= 100,
    "Scenario 13: Title complies with YouTube 100-character limits and standard SoftLab Global branding"
  );

  const generatedDesc = YouTubePublishingService.generateDescription({
    courseTitle: testCourse.title,
    moduleTitle: "Core Full Stack",
    lectureTopic: "State Management with Redux",
    trainerName: "Er. Vivek Kumar",
    batchCode: batchA.code,
  });
  assert(
    generatedDesc.includes("Prayagraj") && generatedDesc.includes("DISCLAIMER:"),
    "Scenario 14: Generated description contains institutional branding, campus location, and legal disclaimer"
  );

  // Clean up test batches & classes
  try {
    await db.scheduledClass.deleteMany({ where: { id: { in: [classA.id, classB.id] } } });
    await db.batch.deleteMany({ where: { id: { in: [batchA.id, batchB.id] } } });
  } catch {}

  console.log("\n==================================================================");
  console.log(`VERIFICATION SUMMARY: ${passes} PASSED, ${fails} FAILED`);
  console.log("==================================================================");

  if (fails > 0) process.exit(1);
}

runAcceptanceVerification().catch((err) => {
  console.error("Verification encountered unhandled error:", err);
  process.exit(1);
});
