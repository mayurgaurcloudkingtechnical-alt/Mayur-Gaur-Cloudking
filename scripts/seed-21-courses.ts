import { PrismaClient, ContentStatus, DeliveryMode, BatchStatus, LessonType } from "@prisma/client";
import coursesData from "./courses-list.json";

const prisma = new PrismaClient();

async function main() {
  console.log("--- Seeding All 21 Authoritative SOFTLAB GLOBAL Courses ---");
  const trainer = await prisma.trainerProfile.findFirst({ include: { user: true } });

  for (let i = 0; i < coursesData.length; i++) {
    const c = coursesData[i];
    console.log(`[${i + 1}/21] Upserting: ${c.title} (${c.durationWeeks}w, Rs.${c.baseFee / 100})`);

    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        durationWeeks: c.durationWeeks,
        baseFee: c.baseFee,
        level: c.level,
        summary: c.summary,
        description: `${c.summary}\n\nDesigned by SOFTLAB GLOBAL industry faculty at the Prayagraj Center for Excellence. Features hands-on labs, enterprise diagrams, weekly code reviews, and structured placement preparation with corporate partners.`,
        status: ContentStatus.PUBLISHED,
        sortOrder: i + 1,
        language: "English / Hindi",
        eligibility: "Graduates, Diploma holders, or students seeking job-ready tech skills.",
        deletedAt: null,
      },
      create: {
        title: c.title,
        slug: c.slug,
        durationWeeks: c.durationWeeks,
        baseFee: c.baseFee,
        level: c.level,
        summary: c.summary,
        description: `${c.summary}\n\nDesigned by SOFTLAB GLOBAL industry faculty at the Prayagraj Center for Excellence. Features hands-on labs, enterprise diagrams, weekly code reviews, and structured placement preparation with corporate partners.`,
        status: ContentStatus.PUBLISHED,
        sortOrder: i + 1,
        language: "English / Hindi",
        eligibility: "Graduates, Diploma holders, or students seeking job-ready tech skills.",
      },
    });

    if (trainer) {
      await prisma.courseTrainer.upsert({
        where: { courseId_trainerId: { courseId: course.id, trainerId: trainer.id } },
        update: {},
        create: { courseId: course.id, trainerId: trainer.id },
      });
    }

    const batchCode = `${c.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)}-2026-B1`;
    await prisma.batch.upsert({
      where: { code: batchCode },
      update: { status: BatchStatus.ONGOING },
      create: {
        code: batchCode,
        name: `${c.title} - Cohort 1`,
        courseId: course.id,
        startDate: new Date("2026-09-01"),
        endDate: new Date(Date.now() + c.durationWeeks * 7 * 24 * 60 * 60 * 1000),
        status: BatchStatus.ONGOING,
        deliveryMode: DeliveryMode.HYBRID,
        location: "Lab 1, Tashkent Marg Campus, Prayagraj",
      },
    });

    const moduleTitles = [
      "Module 1: Foundations & Architecture",
      "Module 2: Core Engineering & Implementation",
      "Module 3: Advanced Concepts & Optimization",
      "Module 4: Industry Capstone Project & Viva",
    ];

    for (let mIdx = 0; mIdx < moduleTitles.length; mIdx++) {
      const modTitle = moduleTitles[mIdx];
      let moduleRecord = await prisma.module.findFirst({
        where: { courseId: course.id, title: modTitle },
      });

      if (!moduleRecord) {
        moduleRecord = await prisma.module.create({
          data: {
            courseId: course.id,
            title: modTitle,
            description: `Structured curriculum covering ${modTitle.toLowerCase()} for ${c.title}. Includes diagrams, code examples, hands-on labs, and real workplace troubleshooting.`,
            sortOrder: mIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      }

      const lessonCount = await prisma.lesson.count({ where: { moduleId: moduleRecord.id } });
      if (lessonCount === 0) {
        const l1 = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: `${modTitle}: Key Concepts & Architecture`,
            slug: `${c.slug}-m${mIdx + 1}-l1`,
            summary: `In-depth conceptual study, diagrams, and technical explanation for ${modTitle}.`,
            type: LessonType.RICH_TEXT,
            durationMin: 45,
            sortOrder: 1,
            status: ContentStatus.PUBLISHED,
          },
        });

        await prisma.lessonContent.create({
          data: {
            lessonId: l1.id,
            bodyHtml: `<h3>Learning Objectives</h3><p>Understand the foundational principles, industry best practices, and architecture of ${c.title}.</p><h4>Step-by-Step Concepts</h4><ul><li>Prerequisites & Environment Setup</li><li>Real-world Enterprise Workflow</li><li>Common Troubleshooting Steps</li></ul>`,
            bodyText: `Core curriculum notes for ${c.title} - ${modTitle}.`,
          },
        });

        const l2 = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: `${modTitle}: Hands-on Practical Lab & Assignment`,
            slug: `${c.slug}-m${mIdx + 1}-l2`,
            summary: `Guided laboratory assignment, commands, code execution, and rubric evaluation.`,
            type: LessonType.ASSIGNMENT,
            durationMin: 60,
            sortOrder: 2,
            status: ContentStatus.PUBLISHED,
          },
        });

        await prisma.lessonContent.create({
          data: {
            lessonId: l2.id,
            bodyHtml: `<h3>Practical Lab Exercise</h3><p>Execute the following step-by-step laboratory commands and submit your work for trainer evaluation.</p><h4>Submission Checklist</h4><ul><li>Git Repository or PDF Report</li><li>Execution Screenshots</li><li>Viva Questions Prepared</li></ul>`,
            bodyText: `Lab assignment for ${c.title} - ${modTitle}.`,
          },
        });
      }
    }
  }

  // Deactivate any old non-authoritative courses that are not in the 21 list
  const validSlugs = coursesData.map((x) => x.slug);
  await prisma.course.updateMany({
    where: { slug: { notIn: validSlugs } },
    data: { status: ContentStatus.ARCHIVED },
  });

  const finalPublished = await prisma.course.findMany({
    where: { status: ContentStatus.PUBLISHED },
    select: { title: true, slug: true, durationWeeks: true, baseFee: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\n=== PUBLISHED COURSES COUNT: ${finalPublished.length} ===`);
  finalPublished.forEach((c, idx) => {
    console.log(`${idx + 1}. ${c.title} | ${c.durationWeeks} Weeks | Rs. ${c.baseFee / 100}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
