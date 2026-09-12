import { db } from "../src/server/db/client";
import { ContentStatus, LessonType, UserRoleCode } from "@prisma/client";

async function verifyDay4() {
  console.log("==> Running Day 4 Course CMS & Curriculum Verification...");

  // 1. Verify Curriculum Hierarchy for Course
  const course = await db.course.findUnique({
    where: { slug: "full-stack-web-development" },
    include: {
      modules: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          lessons: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
            include: { contentDetails: true },
          },
        },
      },
      trainers: {
        include: {
          trainer: {
            include: { user: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new Error("FAIL: Course 'full-stack-web-development' not found!");
  }

  console.log(`\n1. Curriculum Structure Verification for: "${course.title}"`);
  console.log(`   Total Modules: ${course.modules.length}`);

  if (course.modules.length < 3) {
    throw new Error(`FAIL: Expected at least 3 modules, found ${course.modules.length}`);
  }

  let totalLessons = 0;
  let publishedCount = 0;
  let draftCount = 0;

  course.modules.forEach((mod, modIdx) => {
    console.log(`\n   [Module ${modIdx + 1} / Sort ${mod.sortOrder}] "${mod.title}" (Status: ${mod.status})`);
    if (mod.sortOrder !== modIdx) {
      throw new Error(`FAIL: Module ${mod.title} sortOrder (${mod.sortOrder}) does not match index ${modIdx}`);
    }

    mod.lessons.forEach((les, lesIdx) => {
      totalLessons++;
      if (les.status === ContentStatus.PUBLISHED) publishedCount++;
      if (les.status === ContentStatus.DRAFT) draftCount++;

      console.log(`     - [Lesson ${lesIdx + 1} / Sort ${les.sortOrder}] "${les.title}" | Type: ${les.type} | Duration: ${les.durationMin}m | Status: ${les.status} | FreePreview: ${les.isFreePreview}`);

      if (les.sortOrder !== lesIdx) {
        throw new Error(`FAIL: Lesson ${les.title} sortOrder (${les.sortOrder}) does not match index ${lesIdx}`);
      }

      if (!les.contentDetails) {
        throw new Error(`FAIL: Lesson ${les.title} missing contentDetails record!`);
      }
    });
  });

  console.log(`\n2. Lesson Metrics & Status Workflow:`);
  console.log(`   - Total Lessons: ${totalLessons}`);
  console.log(`   - Published Lessons: ${publishedCount}`);
  console.log(`   - Draft Lessons: ${draftCount}`);

  // 3. Verify Supported Content Types
  const typesFound = new Set<LessonType>();
  course.modules.forEach((m) => m.lessons.forEach((l) => typesFound.add(l.type)));

  console.log(`\n3. Supported Lesson Content Types Found:`);
  typesFound.forEach((t) => console.log(`   ✓ ${t}`));

  if (!typesFound.has(LessonType.RICH_TEXT) || !typesFound.has(LessonType.VIDEO) || !typesFound.has(LessonType.DOCUMENT)) {
    throw new Error("FAIL: Missing expected content types (RICH_TEXT, VIDEO, DOCUMENT)!");
  }

  // 4. Verify Trainer Scoping & RBAC
  console.log(`\n4. RBAC Trainer Assignment Verification:`);
  console.log(`   Assigned Faculty: ${course.trainers.length}`);
  for (const ct of course.trainers) {
    console.log(`   ✓ ${ct.trainer.user.firstName} ${ct.trainer.user.lastName} (${ct.trainer.user.email})`);
  }

  if (course.trainers.length === 0) {
    throw new Error("FAIL: Course has no assigned trainers for CMS scoping!");
  }

  // 5. Verify Content Security (Zero Secrets Stored)
  console.log(`\n5. Content Security Check (Zero Secrets Stored):`);
  const allContents = await db.lessonContent.findMany();
  for (const c of allContents) {
    // Check that no secret tokens or passwords exist in content fields
    const contentStr = JSON.stringify(c);
    if (contentStr.includes("secret") || contentStr.includes("password") || contentStr.includes("token")) {
      throw new Error("FAIL: Suspicious credential string detected in lessonContent!");
    }
  }
  console.log(`   ✓ Verified ${allContents.length} lesson content records: pure metadata and references, 0 credentials.`);

  console.log("\n==> DAY 4 CURRICULUM CMS VERIFICATION PASSED 100% WITH ZERO ERRORS.\n");
}

verifyDay4()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
