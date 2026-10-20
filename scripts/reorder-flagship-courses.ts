import { db } from "../src/server/db/client";

async function main() {
  console.log("==> Aligning SLG Flagship Courses...");

  // Set all SLG courses to base 20+ first
  await db.course.updateMany({
    where: { providerType: "SOFTLAB" },
    data: { sortOrder: 50 },
  });

  // Explicitly set the 6 premier flagship courses to 1, 2, 3, 4, 5, 6
  const flagship = [
    { slug: "certified-full-stack-web-development-mern-nextjs", order: 1 },
    { slug: "cloud-devops-masterclass", order: 2 },
    { slug: "cyber-security-complete-course-master-level", order: 3 },
    { slug: "data-science-complete-course-master-level", order: 4 },
    { slug: "python-programming-masterclass", order: 5 },
    { slug: "certificate-in-cloud-computing-and-cyber-security-with-ai", order: 6 },
    { slug: "java-full-stack-engineering", order: 7 },
    { slug: "certified-artificial-intelligence-generative-ai-specialist", order: 8 },
    { slug: "aws-certified-solutions-architect-cloud-administrator", order: 9 },
    { slug: "data-analytics-powerbi-sql", order: 10 },
  ];

  for (const item of flagship) {
    await db.course.updateMany({
      where: { slug: item.slug },
      data: { sortOrder: item.order },
    });
  }

  // Verify top 6
  const top6 = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      providerType: "SOFTLAB",
    },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: {
      id: true,
      title: true,
      slug: true,
      sortOrder: true,
      providerType: true,
    },
  });

  console.log("\n✓ Verified Top 6 Flagship SLG Courses for Main Homepage:");
  top6.forEach((c, idx) => {
    console.log(`  ${idx + 1}. [Order: ${c.sortOrder}] ${c.title} (${c.slug})`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
