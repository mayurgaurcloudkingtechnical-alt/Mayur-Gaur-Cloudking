import { PrismaClient, ContentStatus, DeliveryMode, BatchStatus, LessonType } from "@prisma/client";
import coursesData from "./curriculum-21-courses.json";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING AUTHORITATIVE 21 SOFTLAB GLOBAL COURSES WITH COMPLETE CURRICULUM ===");

  const trainer = await prisma.trainerProfile.findFirst({
    include: { user: true },
  });

  const valid21Slugs: string[] = [];

  for (let cIdx = 0; cIdx < coursesData.length; cIdx++) {
    const c = coursesData[cIdx] as any;
    valid21Slugs.push(c.slug);

    console.log(`[${cIdx + 1}/21] Upserting Course: ${c.title} (${c.durationWeeks} weeks, Rs.${c.baseFee / 100})`);

    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        durationWeeks: c.durationWeeks,
        baseFee: c.baseFee,
        level: c.level,
        summary: c.overview?.slice(0, 300) || `${c.title} comprehensive curriculum.`,
        description: `${c.overview}\n\nObjectives:\n${c.objectives.map((o: string) => `• ${o}`).join("\n")}\n\nDesigned by SOFTLAB GLOBAL industry faculty at the Prayagraj Center of Excellence. Features hands-on labs, enterprise projects, weekly code reviews, and structured placement preparation with corporate partners.`,
        thumbnailUrl: c.flyer,
        status: ContentStatus.PUBLISHED,
        providerType: "SOFTLAB",
        providerName: "SoftLab Global",
        sortOrder: cIdx + 1,
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
        summary: c.overview?.slice(0, 300) || `${c.title} comprehensive curriculum.`,
        description: `${c.overview}\n\nObjectives:\n${c.objectives.map((o: string) => `• ${o}`).join("\n")}\n\nDesigned by SOFTLAB GLOBAL industry faculty at the Prayagraj Center of Excellence. Features hands-on labs, enterprise projects, weekly code reviews, and structured placement preparation with corporate partners.`,
        thumbnailUrl: c.flyer,
        status: ContentStatus.PUBLISHED,
        providerType: "SOFTLAB",
        providerName: "SoftLab Global",
        sortOrder: cIdx + 1,
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

    // Ongoing batch
    const batchCode = `${c.slug.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4)}-2026-B1`;
    await prisma.batch.upsert({
      where: { code: batchCode },
      update: { status: BatchStatus.ONGOING },
      create: {
        code: batchCode,
        name: `${c.title} - Cohort 2026`,
        courseId: course.id,
        startDate: new Date("2026-09-01"),
        endDate: new Date(Date.now() + c.durationWeeks * 7 * 24 * 60 * 60 * 1000),
        status: BatchStatus.ONGOING,
        deliveryMode: DeliveryMode.HYBRID,
        location: "Lab 1, Tashkent Marg Campus, Prayagraj",
      },
    });

    // Modules & Lessons
    const modulesList = c.modules && c.modules.length > 0 ? c.modules : [
      { title: "Module 1: Foundations & Architecture", topics: ["Core Concepts", "Architecture", "Environment Setup"], labs: ["Setup Lab"] },
      { title: "Module 2: Core Engineering & Implementation", topics: ["Implementation", "Data Structures", "APIs"], labs: ["Code Exercises"] },
      { title: "Module 3: Advanced Concepts & Optimization", topics: ["Optimization", "Security", "Best Practices"], labs: ["Performance Tuning"] },
      { title: "Module 4: Industry Capstone Project & Viva", topics: ["System Design", "Enterprise Integration", "Interview Prep"], labs: ["Full Project Deployment"] },
    ];

    for (let mIdx = 0; mIdx < modulesList.length; mIdx++) {
      const m = modulesList[mIdx];
      const modTitle = m.title;

      let moduleRecord = await prisma.module.findFirst({
        where: { courseId: course.id, title: modTitle },
      });

      if (!moduleRecord) {
        moduleRecord = await prisma.module.create({
          data: {
            courseId: course.id,
            title: modTitle,
            description: `Curriculum covering ${modTitle} for ${c.title}. Topics include:\n${(m.topics || []).map((t: string) => `• ${t}`).join("\n")}`,
            sortOrder: mIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      } else {
        await prisma.module.update({
          where: { id: moduleRecord.id },
          data: {
            sortOrder: mIdx + 1,
            status: ContentStatus.PUBLISHED,
            description: `Curriculum covering ${modTitle} for ${c.title}. Topics include:\n${(m.topics || []).map((t: string) => `• ${t}`).join("\n")}`,
          },
        });
      }

      // Check lessons count
      const lessonCount = await prisma.lesson.count({ where: { moduleId: moduleRecord.id } });
      if (lessonCount === 0) {
        // Lesson 1: Theory, Architecture & Concepts
        const l1 = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: `${modTitle}: Concept & Architectural Lecture`,
            slug: `${c.slug}-m${mIdx + 1}-l1`,
            summary: `In-depth lecture and architectural breakdown covering ${(m.topics || []).slice(0, 3).join(", ")}.`,
            type: LessonType.RICH_TEXT,
            durationMin: 45,
            sortOrder: 1,
            status: ContentStatus.PUBLISHED,
          },
        });

        await prisma.lessonContent.create({
          data: {
            lessonId: l1.id,
            bodyHtml: `
              <div class="space-y-6 text-slate-800">
                <div class="border-l-4 border-emerald-600 pl-4 py-1">
                  <h2 class="text-xl font-extrabold text-slate-900">${modTitle}: Theoretical Foundation</h2>
                  <p class="text-sm text-slate-600 mt-1">Official SOFTLAB GLOBAL Engineering Courseware</p>
                </div>

                <div class="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
                  <h3 class="text-sm font-bold text-emerald-950 uppercase tracking-wider mb-2">Learning Objectives</h3>
                  <ul class="list-disc list-inside space-y-1 text-sm text-emerald-900">
                    <li>Master the underlying architectural mechanisms and principles of this module.</li>
                    <li>Analyze real-world industrial use cases and performance implications.</li>
                    <li>Avoid common antipatterns and adhere to standard corporate engineering practices.</li>
                  </ul>
                </div>

                <div class="space-y-3">
                  <h3 class="text-lg font-bold text-slate-900">Key Curriculum Topics</h3>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${(m.topics || []).map((t: string) => `
                      <div class="p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-700 flex items-center gap-2">
                        <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                        <span>${t}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>

                <div class="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-3 font-mono text-xs">
                  <div class="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span>ARCHITECTURE & SYSTEM FLOW</span>
                    <span class="text-emerald-400">SOFTLAB-SPEC-V2</span>
                  </div>
                  <pre class="overflow-x-auto py-2">
CLIENT LAYER  ───►  API GATEWAY / LOGIC LAYER  ───►  STORAGE / ENGINE
     │                        │                               │
     ▼                        ▼                               ▼
Authentication        Business Rules Validation           Persistence & Audit
                  </pre>
                </div>

                <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-1">
                  <strong class="font-bold">Important Best Practices:</strong>
                  <p>Always maintain clean separation of concerns, write idempotent code, and commit your working code to the designated Git branch before proceeding to the practical lab.</p>
                </div>
              </div>
            `,
            bodyText: `Curriculum lecture for ${modTitle} covering ${(m.topics || []).join(", ")}.`,
          },
        });

        // Lesson 2: Practical Lab & Hands-on Coding
        const l2 = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: `${modTitle}: Hands-on Practical Lab`,
            slug: `${c.slug}-m${mIdx + 1}-l2`,
            summary: `Hands-on laboratory execution, commands, coding exercises, and validation.`,
            type: LessonType.RICH_TEXT,
            durationMin: 60,
            sortOrder: 2,
            status: ContentStatus.PUBLISHED,
          },
        });

        await prisma.lessonContent.create({
          data: {
            lessonId: l2.id,
            bodyHtml: `
              <div class="space-y-6 text-slate-800">
                <div class="border-l-4 border-sky-600 pl-4 py-1">
                  <h2 class="text-xl font-extrabold text-slate-900">${modTitle}: Guided Lab Session</h2>
                  <p class="text-sm text-slate-600 mt-1">Classroom & Hybrid Hands-on Practice</p>
                </div>

                <div class="space-y-3">
                  <h3 class="text-lg font-bold text-slate-900">Lab Objectives & Tasks</h3>
                  <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                    <p class="font-semibold text-slate-800">Required Practical Demonstrations:</p>
                    <ul class="list-disc list-inside space-y-1 text-slate-600">
                      ${(m.labs && m.labs.length > 0 ? m.labs : ["Environment Verification", "Core Implementation", "Edge Case Testing"]).map((lab: string) => `<li>${lab}</li>`).join("")}
                    </ul>
                  </div>
                </div>

                <div class="bg-slate-950 text-emerald-400 p-5 rounded-2xl font-mono text-xs space-y-2">
                  <div class="text-slate-400 text-[11px] pb-1 border-b border-slate-800">TERMINAL & CODE EXECUTION WORKFLOW</div>
                  <p># Step 1: Clone workspace repository & initialize branch</p>
                  <p class="text-slate-300">git checkout -b lab-module-${mIdx + 1}</p>
                  <p># Step 2: Run test suite & verify environment</p>
                  <p class="text-slate-300">npm test || make test</p>
                  <p># Step 3: Implement required solution logic</p>
                  <p class="text-slate-300"># Verify with mentor before committing</p>
                </div>

                <div class="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900">
                  <span class="font-bold">Mentor Checkpoint:</span> Present your terminal/console output or running application to your batch mentor for verification.
                </div>
              </div>
            `,
            bodyText: `Hands-on practical lab for ${modTitle}.`,
          },
        });

        // Lesson 3: Assignment & Capstone Rubric
        const l3 = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: `${modTitle}: Project Assignment & Evaluation`,
            slug: `${c.slug}-m${mIdx + 1}-l3`,
            summary: `Evaluated assignment challenge, rubric specifications, and submission guidelines.`,
            type: LessonType.ASSIGNMENT,
            durationMin: 45,
            sortOrder: 3,
            status: ContentStatus.PUBLISHED,
          },
        });

        await prisma.lessonContent.create({
          data: {
            lessonId: l3.id,
            bodyHtml: `
              <div class="space-y-6 text-slate-800">
                <div class="border-l-4 border-indigo-600 pl-4 py-1">
                  <h2 class="text-xl font-extrabold text-slate-900">${modTitle}: Assignment & Mini-Project</h2>
                  <p class="text-sm text-slate-600 mt-1">Evaluated Deliverable for Course Completion</p>
                </div>

                <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Submission Deliverables</h3>
                  <ol class="list-decimal list-inside space-y-2 text-xs text-slate-700">
                    <li>Push complete working source code to your assigned GitHub/GitLab repository.</li>
                    <li>Include a clear README.md documenting architecture, dependencies, setup instructions, and sample inputs/outputs.</li>
                    <li>Prepare for a 5-minute technical viva explaining your code decisions and algorithmic choices.</li>
                  </ol>
                </div>

                <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-xs text-emerald-950 space-y-1">
                  <span class="font-bold">Grading Rubric (Total 100%):</span>
                  <ul class="list-disc list-inside mt-1 space-y-0.5 text-emerald-900">
                    <li>Functionality & Problem Solving: 40%</li>
                    <li>Code Quality, Formatting & Modularity: 30%</li>
                    <li>Test Coverage & Error Handling: 15%</li>
                    <li>Viva Defense & Technical Explanation: 15%</li>
                  </ul>
                </div>
              </div>
            `,
            bodyText: `Assignment deliverable for ${modTitle}.`,
          },
        });
      }
    }
  }

  // Deactivate any other SOFTLAB courses that are NOT part of the 21 courses!
  // CRITICAL: DO NOT touch UNIVERSITY courses!
  const archivedResult = await prisma.course.updateMany({
    where: {
      providerType: "SOFTLAB",
      slug: { notIn: valid21Slugs },
    },
    data: { status: ContentStatus.ARCHIVED },
  });
  console.log(`Archived ${archivedResult.count} obsolete Softlab courses.`);

  // Verify counts
  const publishedSoftlab = await prisma.course.findMany({
    where: { providerType: "SOFTLAB", status: ContentStatus.PUBLISHED, deletedAt: null },
    select: { title: true, slug: true, durationWeeks: true, baseFee: true },
    orderBy: { sortOrder: "asc" },
  });

  const publishedUniversity = await prisma.course.findMany({
    where: { providerType: "UNIVERSITY", status: ContentStatus.PUBLISHED, deletedAt: null },
    select: { title: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log(`\n========================================`);
  console.log(`✅ PUBLISHED SOFTLAB COURSES: ${publishedSoftlab.length} (Target: 21)`);
  console.log(`✅ PUBLISHED DPGU UNIVERSITY COURSES: ${publishedUniversity.length} (Target: 25)`);
  console.log(`✅ TOTAL ACTIVE CATALOG COURSES: ${publishedSoftlab.length + publishedUniversity.length} (Target: 46)`);
  console.log(`========================================\n`);

  publishedSoftlab.forEach((c, i) => {
    console.log(`${i + 1}. [${c.slug}] ${c.title} — ${c.durationWeeks} Weeks — Rs. ${c.baseFee / 100}`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
