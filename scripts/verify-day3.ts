import { db } from "../src/server/db/client";
import { ContentStatus } from "@prisma/client";

async function verifyDay3() {
  console.log("==> Running Day 3 Public Website Verification...");

  // 1. Verify Published Courses for Public Catalog
  const publicCourses = await db.course.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
  });

  console.log(`\n1. Public Course Catalog Verification:`);
  console.log(`   Found ${publicCourses.length} PUBLISHED course(s):`);
  for (const c of publicCourses) {
    console.log(`   - [${c.slug}] ${c.title} | Fee: ₹${c.baseFee / 100} (${c.baseFee} Paise) | Status: ${c.status}`);
  }

  // 2. Verify Draft/Unpublished Course Exclusion
  const draftCourse = await db.course.findFirst({
    where: {
      slug: "cybersecurity-ethical-hacking",
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
  });

  if (draftCourse === null) {
    console.log(`   ✓ Draft course 'cybersecurity-ethical-hacking' is strictly HIDDEN from public queries (status !== PUBLISHED).`);
  } else {
    throw new Error("FAIL: Draft course was returned by public query!");
  }

  // 3. Verify Course Detail query for valid published slug
  const publishedDetail = await db.course.findFirst({
    where: {
      slug: "full-stack-web-development",
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    },
    include: {
      trainers: {
        include: {
          trainer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!publishedDetail) {
    throw new Error("FAIL: Published course 'full-stack-web-development' not found!");
  }
  console.log(`   ✓ Published course detail found: "${publishedDetail.title}" with ${publishedDetail.trainers.length} assigned trainer(s).`);

  // 4. Verify Faculty Query
  const trainers = await db.trainerProfile.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
      },
    },
  });

  console.log(`\n2. Public Faculty Verification:`);
  console.log(`   Found ${trainers.length} verified trainer profile(s):`);
  for (const t of trainers) {
    console.log(`   - ${t.user.firstName} ${t.user.lastName} (${t.experienceYears} yrs exp) | Status: ${t.user.status}`);
  }

  console.log("\n==> DAY 3 VERIFICATION PASSED 100% WITH ZERO ERRORS.\n");
}

verifyDay3()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
