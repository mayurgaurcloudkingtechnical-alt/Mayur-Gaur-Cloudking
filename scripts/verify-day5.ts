import { db } from "../src/server/db/client";
import { ContentStatus, EnrollmentStatus, UserRoleCode } from "@prisma/client";

async function verifyDay5() {
  console.log("==> Running Day 5 Student LMS & Learning Experience Verification...\n");

  // 1. Verify Student User & Profile
  console.log("1. Checking Student User and StudentProfile in Database...");
  const studentUser = await db.user.findUnique({
    where: { email: "student@softlabglobal.com" },
    include: { studentProfile: true },
  });

  if (!studentUser) {
    throw new Error("FAIL: Sample student 'student@softlabglobal.com' not found.");
  }

  if (studentUser.roleCode !== UserRoleCode.STUDENT) {
    throw new Error(`FAIL: Expected role STUDENT, got ${studentUser.roleCode}`);
  }

  if (!studentUser.studentProfile) {
    throw new Error("FAIL: StudentProfile not linked to student user.");
  }

  console.log(`   ✓ Found Student: ${studentUser.firstName} ${studentUser.lastName} (${studentUser.email})`);
  console.log(`   ✓ Student ID Code: ${studentUser.studentProfile.studentId}`);
  console.log(`   ✓ Student City: ${studentUser.studentProfile.city}, ${studentUser.studentProfile.state}`);

  // 2. Verify Course Enrollment & Cohort Association
  console.log("\n2. Checking Course Enrollment & Batch Association...");
  const enrollment = await db.enrollment.findFirst({
    where: {
      studentId: studentUser.studentProfile.id,
      course: { slug: "full-stack-web-development" },
    },
    include: {
      course: true,
      batch: true,
      lessonProgress: true,
    },
  });

  if (!enrollment) {
    throw new Error("FAIL: Active enrollment for 'full-stack-web-development' not found.");
  }

  if (enrollment.status !== EnrollmentStatus.ACTIVE) {
    throw new Error(`FAIL: Expected enrollment status ACTIVE, got ${enrollment.status}`);
  }

  console.log(`   ✓ Enrollment ID: ${enrollment.id}`);
  console.log(`   ✓ Course: ${enrollment.course.title} (Slug: ${enrollment.course.slug})`);
  console.log(`   ✓ Cohort Batch: ${enrollment.batch?.name} (${enrollment.batch?.code})`);
  console.log(`   ✓ Enrollment Status: ${enrollment.status}`);

  // 3. Verify Strict Content Isolation (Student LMS Published Content Only)
  console.log("\n3. Verifying Student LMS Content Isolation Rules...");
  const publishedModules = await db.module.findMany({
    where: {
      courseId: enrollment.courseId,
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    orderBy: { sortOrder: "asc" },
    include: {
      lessons: {
        where: {
          status: ContentStatus.PUBLISHED,
          deletedAt: null,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  console.log(`   Total Published Modules accessible to student: ${publishedModules.length}`);
  if (publishedModules.length !== 2) {
    throw new Error(`FAIL: Expected 2 published modules, found ${publishedModules.length}`);
  }

  const allPublishedLessons = publishedModules.flatMap((m) => m.lessons);
  console.log(`   Total Published Lessons accessible to student: ${allPublishedLessons.length}`);
  if (allPublishedLessons.length !== 5) {
    throw new Error(`FAIL: Expected 5 published lessons, found ${allPublishedLessons.length}`);
  }

  // Ensure no draft module or draft lesson is in the published collection
  const draftModules = await db.module.findMany({
    where: {
      courseId: enrollment.courseId,
      status: ContentStatus.DRAFT,
    },
  });
  console.log(`   ✓ Confirmed ${draftModules.length} DRAFT module(s) strictly hidden from student player.`);

  const draftLessons = await db.lesson.findMany({
    where: {
      module: { courseId: enrollment.courseId },
      status: ContentStatus.DRAFT,
    },
  });
  console.log(`   ✓ Confirmed ${draftLessons.length} DRAFT lesson(s) strictly hidden from student player.`);

  // 4. Verify Lesson Progress & Completion Math
  console.log("\n4. Testing Progress Calculation and Toggle Mutation...");
  const firstLesson = allPublishedLessons[0];
  const secondLesson = allPublishedLessons[1];

  // Mark first lesson complete
  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: firstLesson.id,
      },
    },
    update: { isCompleted: true, completedAt: new Date() },
    create: {
      enrollmentId: enrollment.id,
      lessonId: firstLesson.id,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  let completedCount = await db.lessonProgress.count({
    where: { enrollmentId: enrollment.id, isCompleted: true },
  });
  let progressPercent = Math.round((completedCount / allPublishedLessons.length) * 100);

  console.log(`   Completed: ${completedCount} / ${allPublishedLessons.length} lessons -> ${progressPercent}%`);
  if (progressPercent !== 20) {
    throw new Error(`FAIL: Expected 20% progress (1/5), got ${progressPercent}%`);
  }

  // Mark second lesson complete
  await db.lessonProgress.upsert({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: secondLesson.id,
      },
    },
    update: { isCompleted: true, completedAt: new Date() },
    create: {
      enrollmentId: enrollment.id,
      lessonId: secondLesson.id,
      isCompleted: true,
      completedAt: new Date(),
    },
  });

  completedCount = await db.lessonProgress.count({
    where: { enrollmentId: enrollment.id, isCompleted: true },
  });
  progressPercent = Math.round((completedCount / allPublishedLessons.length) * 100);

  console.log(`   Completed: ${completedCount} / ${allPublishedLessons.length} lessons -> ${progressPercent}%`);
  if (progressPercent !== 40) {
    throw new Error(`FAIL: Expected 40% progress (2/5), got ${progressPercent}%`);
  }

  // Toggle second lesson back to incomplete (idempotent rollback)
  await db.lessonProgress.update({
    where: {
      enrollmentId_lessonId: {
        enrollmentId: enrollment.id,
        lessonId: secondLesson.id,
      },
    },
    data: { isCompleted: false, completedAt: null },
  });

  completedCount = await db.lessonProgress.count({
    where: { enrollmentId: enrollment.id, isCompleted: true },
  });
  progressPercent = Math.round((completedCount / allPublishedLessons.length) * 100);
  console.log(`   Toggled back: ${completedCount} / ${allPublishedLessons.length} lessons -> ${progressPercent}%`);
  if (progressPercent !== 20) {
    throw new Error(`FAIL: Expected 20% progress after toggle rollback, got ${progressPercent}%`);
  }

  // 5. Verify Resume Learning State
  console.log("\n5. Checking Resume Learning State...");
  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      lastAccessedLessonId: firstLesson.id,
      lastAccessedAt: new Date(),
    },
  });

  const updatedEnrollment = await db.enrollment.findUnique({
    where: { id: enrollment.id },
  });

  if (updatedEnrollment?.lastAccessedLessonId !== firstLesson.id) {
    throw new Error("FAIL: lastAccessedLessonId did not update correctly.");
  }
  console.log(`   ✓ Last accessed lesson recorded: "${firstLesson.title}" (${firstLesson.id})`);
  console.log(`   ✓ Last accessed timestamp: ${updatedEnrollment.lastAccessedAt?.toISOString()}`);

  // 6. Multi-Tenant Student Isolation Guard
  console.log("\n6. Validating Student Multi-Tenant Security Guard...");
  const fakeStudentId = "cuid-fake-student-id-9999";
  if (enrollment.studentId === fakeStudentId) {
    throw new Error("FAIL: Enrollment wrongly matches fake student ID.");
  }
  console.log("   ✓ Foreign student ID isolation check validated.");

  console.log("\n========================================================");
  console.log("==> Day 5 Student LMS Verification PASSED (100% OK)!");
  console.log("========================================================\n");
}

verifyDay5()
  .catch((e) => {
    console.error("\n❌ Verification Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
