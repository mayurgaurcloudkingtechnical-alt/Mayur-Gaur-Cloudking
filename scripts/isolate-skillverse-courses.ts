import { db } from "../src/server/db/client";

async function main() {
  console.log("=== ISOLATING SKILLVERSE COURSES FROM SOFTLAB GLOBAL ===");

  const skillverseSlugs = [
    "sap-s4hana-finance-controlling-fico",
    "45-day-board-exam-commerce",
    "45-day-board-exam-science",
  ];

  for (const slug of skillverseSlugs) {
    const updated = await db.course.updateMany({
      where: { slug },
      data: {
        providerType: "SKILLVERSE",
        providerName: "SKILLVERSE — Powered by SoftLab Global",
      },
    });
    console.log(`Updated course [${slug}]: ${updated.count} row(s) set to providerType: 'SKILLVERSE'`);
  }

  // Verification 1: SoftLab Global courses (providerType: 'SOFTLAB')
  const softlabCourses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      providerType: "SOFTLAB",
    },
    select: { id: true, title: true, slug: true, providerType: true },
  });
  console.log(`\nVerified SoftLab Global published courses count: ${softlabCourses.length}`);
  const containsSkillverse = softlabCourses.some((c) =>
    skillverseSlugs.includes(c.slug) || c.title.toLowerCase().includes("sap") || c.title.toLowerCase().includes("45-day")
  );
  if (containsSkillverse) {
    console.error("ERROR: SoftLab Global list still contains Skillverse courses!");
    process.exit(1);
  } else {
    console.log("SUCCESS: Zero Skillverse courses in SoftLab Global catalog.");
  }

  // Verification 2: Skillverse courses (providerType: 'SKILLVERSE')
  const skillverseCourses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      providerType: "SKILLVERSE",
    },
    select: { id: true, title: true, slug: true, providerType: true, providerName: true },
  });
  console.log(`\nVerified Skillverse courses count: ${skillverseCourses.length}`);
  for (const c of skillverseCourses) {
    console.log(` - ${c.title} (${c.slug}) -> ${c.providerType} [${c.providerName}]`);
  }

  console.log("\n=== ISOLATION COMPLETE & VERIFIED ===");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
