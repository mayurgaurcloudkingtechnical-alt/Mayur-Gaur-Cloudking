import * as fs from "fs";
import * as path from "path";
import {
  PrismaClient,
  ContentStatus,
  LessonType,
} from "@prisma/client";

const prisma = new PrismaClient();

interface Page {
  page: number;
  text: string;
}

const pages: Page[] = JSON.parse(
  fs.readFileSync("scratch/curriculum-pages.json", "utf8")
);

const COURSE_DEFINITIONS = [
  {
    slug: "cpp-programming-complete-course",
    title: "C++ Programming Complete Course (Basic To Advanced)",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Advanced",
    start: 1,
    end: 11,
    flyer: "/courses/cpp-programming-brochure.jpg",
    category: "Programming & Software Development",
  },
  {
    slug: "certificate-in-advance-networking",
    title: "Certificate in Advanced Networking Program (Master Level)",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Master Level",
    start: 12,
    end: 23,
    flyer: "/courses/networking-brochure.jpg",
    category: "Computer Networking & Infrastructure",
  },
  {
    slug: "certificate-in-cloud-computing-and-cyber-security-with-ai",
    title: "Certificate in Cloud Computing & Cyber Security with AI (Expert Master Level)",
    durationWeeks: 48,
    baseFee: 8500000,
    level: "Beginner to Expert Master Level",
    start: 24,
    end: 38,
    flyer: "/courses/cloud-cyber-ai-brochure.jpg",
    category: "Cloud, Cyber Security & AI",
  },
  {
    slug: "certificate-in-office-365-admin",
    title: "Certificate in Microsoft Office 365 Administration Program (Master Level)",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Master Level",
    start: 39,
    end: 51,
    flyer: "/courses/office-365-brochure.jpg",
    category: "Cloud Administration & Enterprise Systems",
  },
  {
    slug: "cyber-security-complete-course",
    title: "Cyber Security Complete Course (Master Level)",
    durationWeeks: 24,
    baseFee: 5500000,
    level: "Beginner to Master Level",
    start: 52,
    end: 63,
    flyer: "/courses/cyber-security-brochure.jpg",
    category: "Cyber Security & Ethical Hacking",
  },
  {
    slug: "data-science-master-level",
    title: "Data Science (Master Level) Complete Course",
    durationWeeks: 24,
    baseFee: 5500000,
    level: "Beginner to Master Level",
    start: 64,
    end: 77,
    flyer: "/courses/data-science-brochure.jpg",
    category: "Data Science & Artificial Intelligence",
  },
  {
    slug: "digital-marketing-master-class",
    title: "Digital Marketing (Master Level) Complete Course",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Master Level",
    start: 78,
    end: 88,
    flyer: "/courses/digital-marketing-brochure.jpg",
    category: "Digital Marketing & Growth",
  },
  {
    slug: "full-web-development",
    title: "Master Full Web Development Program (Beginner to Advanced Level)",
    durationWeeks: 16,
    baseFee: 4500000,
    level: "Beginner to Advanced",
    start: 89,
    end: 96,
    flyer: "/courses/web-development-brochure.jpg",
    category: "Full Stack Web Development",
  },
  {
    slug: "graphics-designing-master-level",
    title: "Graphics Designing (Master Level) Complete Course",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Master Level",
    start: 97,
    end: 104,
    flyer: "/courses/graphics-designing-brochure.jpg",
    category: "Design & Creative Media",
  },
  {
    slug: "java-full-stack-developer",
    title: "Master Java Full Stack Developer Program (Beginner to Advanced Expert Level)",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Expert Level",
    start: 105,
    end: 118,
    flyer: "/courses/java-full-stack-brochure.jpg",
    category: "Enterprise Software Engineering",
  },
  {
    slug: "master-in-cloud-administration",
    title: "Master Cloud Administration Program (Expert Master Level)",
    durationWeeks: 24,
    baseFee: 5500000,
    level: "Beginner to Master Level",
    start: 119,
    end: 132,
    flyer: "/courses/cloud-admin-brochure.jpg",
    category: "Cloud Architecture & DevOps",
  },
  {
    slug: "master-in-artificial-intelligence-and-machine-learning",
    title: "Master Artificial Intelligence & Machine Learning Program (Master Level)",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Master Level",
    start: 133,
    end: 146,
    flyer: "/courses/ai-ml-brochure.jpg",
    category: "Artificial Intelligence & Deep Learning",
  },
  {
    slug: "master-in-linux-administration",
    title: "Master Linux Administration Program (Expert Master Level)",
    durationWeeks: 16,
    baseFee: 4500000,
    level: "Beginner to Master Level",
    start: 147,
    end: 162,
    flyer: "/courses/linux-admin-brochure.jpg",
    category: "Linux & System Engineering",
  },
  {
    slug: "master-in-server-administration",
    title: "Master Server Administration Program (Expert Master Level)",
    durationWeeks: 16,
    baseFee: 4500000,
    level: "Beginner to Master Level",
    start: 163,
    end: 176,
    flyer: "/courses/server-admin-brochure.jpg",
    category: "Server Infrastructure & Active Directory",
  },
  {
    slug: "certificate-in-c-language",
    title: "Master-Level Certificate in C Language",
    durationWeeks: 8,
    baseFee: 2500000,
    level: "Beginner to Advanced",
    start: 177,
    end: 180,
    flyer: "/courses/c-programming-brochure.jpg",
    category: "Foundational Programming",
  },
  {
    slug: "mern-full-stack-developer",
    title: "Master MERN Full Stack Developer Program (Beginner to Advanced Expert Level)",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Expert Level",
    start: 181,
    end: 195,
    flyer: "/courses/mern-full-stack-brochure.jpg",
    category: "Full Stack Web Development",
  },
  {
    slug: "mysql-advanced-course",
    title: "MySQL Advanced Course (Beginner To Expert)",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Expert",
    start: 196,
    end: 206,
    flyer: "/courses/mysql-brochure.jpg",
    category: "Database Engineering & SQL",
  },
  {
    slug: "oracle-database-administration-dba",
    title: "Oracle Database Administration (DBA) with Oracle Cloud Integration",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Expert DBA",
    start: 207,
    end: 219,
    flyer: "/courses/oracle-dba-brochure.jpg",
    category: "Enterprise Database Administration",
  },
  {
    slug: "python-full-stack-developer",
    title: "Master Python Full Stack Developer Program (Beginner to Advanced Expert Level)",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Expert Level",
    start: 220,
    end: 234,
    flyer: "/courses/python-full-stack-brochure.jpg",
    category: "Full Stack Software Development",
  },
  {
    slug: "certificate-in-cloud-computing-with-devops",
    title: "Master DevOps Engineer (Master Level)",
    durationWeeks: 24,
    baseFee: 6500000,
    level: "Beginner to Master Level",
    start: 235,
    end: 243,
    flyer: "/courses/devops-brochure.jpg",
    category: "Cloud Architecture & DevOps",
  },
  {
    slug: "technical-support-engineer",
    title: "Technical Support Engineer (Master Level)",
    durationWeeks: 12,
    baseFee: 3500000,
    level: "Beginner to Master Level",
    start: 244,
    end: 253,
    flyer: "/courses/technical-support-brochure.jpg",
    category: "IT Support & Infrastructure Operations",
  },
];

function cleanLine(l: string): string {
  return l
    .replace(/[\uF0B7\u2022\u25CF\uFEFF]/g, "")
    .replace(/^[-–—o•*]\s*/, "")
    .trim();
}

function normalizeTitle(rawTitle: string): string {
  let title = rawTitle
    .replace(/^(?:Module|Phase|MONTH|Month)\s+\d+[:\s–—-]*/i, "")
    .replace(/\s*\(Week\s*\d+.*?\)/gi, "")
    .replace(/\s*\(Month\s*\d+.*?\)/gi, "")
    .trim();

  // Specific fix-ups for truncated titles
  if (/^computer hardware/i.test(title)) title = "Computer Hardware & Architecture";
  else if (/^operating system/i.test(title)) title = "Operating System Administration (Windows)";
  else if (/^networking/i.test(title) && title.length < 15) title = "Networking & Network Infrastructure";
  else if (/^microsoft office 365/i.test(title)) title = "Microsoft Office 365 Administration";
  else if (/^technical support engineer/i.test(title)) title = "Technical Support Engineer Core Skills";
  else if (/^real$/i.test(title) || /real-?time/i.test(title)) title = "Real-Time Industry Projects";
  else if (/^interview preparation/i.test(title)) title = "Technical Interview Preparation & Scenarios";
  else if (/^professional development/i.test(title)) title = "Professional Development & Career Launch";

  return title;
}

function parseCourseCurriculum(def: typeof COURSE_DEFINITIONS[0]) {
  const coursePages = pages.filter((p) => p.page >= def.start && p.page <= def.end);
  const rawText = coursePages.map((p) => p.text).join("\n");
  const rawLines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  const modules: { title: string; topics: string[]; labs: string[] }[] = [];
  let currentMod: { title: string; topics: string[]; labs: string[] } | null = null;
  let inLab = false;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];
    const cleaned = cleanLine(line);

    if (!cleaned || cleaned.length < 2) continue;
    if (
      cleaned.startsWith("Page ") ||
      cleaned.startsWith("Softlab Global") ||
      cleaned.startsWith("Duration:") ||
      cleaned.startsWith("Course Fee:")
    ) {
      continue;
    }

    // Check for Module / Phase header
    const modMatch = line.match(/^(?:Module|Phase|MONTH|Month)\s+(\d+)[:\s–—-]+(.*)/i);
    if (modMatch) {
      inLab = false;
      let titlePart = (modMatch[2] || "").trim();
      let nextIdx = i + 1;
      while (nextIdx < rawLines.length) {
        const nextClean = cleanLine(rawLines[nextIdx]);
        if (
          nextClean.startsWith("Level)") ||
          nextClean.startsWith("Program") ||
          nextClean.startsWith("Engineering") ||
          nextClean.startsWith("Administration") ||
          nextClean.startsWith("Developer") ||
          nextClean.startsWith("Architecture") ||
          (nextClean.startsWith("Fundamentals") && !nextClean.includes(":"))
        ) {
          titlePart += " " + nextClean;
          i = nextIdx;
          nextIdx++;
        } else {
          break;
        }
      }

      const cleanTitle = normalizeTitle(titlePart);

      currentMod = {
        title: cleanTitle,
        topics: [],
        labs: [],
      };
      modules.push(currentMod);
      continue;
    }

    if (!currentMod) continue;

    // Filter noise lines
    if (/^(practical|labs?|hands-on|projects?)\b/i.test(cleaned)) {
      inLab = true;
      continue;
    }
    if (
      cleaned === "Fundamentals" ||
      cleaned === "Level)" ||
      cleaned === "Tools Used" ||
      cleaned === "Assignments" ||
      cleaned === "Course Outcome" ||
      cleaned === "Certification" ||
      cleaned.startsWith("✅") ||
      cleaned.startsWith("After completing")
    ) {
      continue;
    }

    if (inLab) {
      if (!currentMod.labs.includes(cleaned)) {
        currentMod.labs.push(cleaned);
      }
    } else {
      if (!currentMod.topics.includes(cleaned)) {
        currentMod.topics.push(cleaned);
      }
    }
  }

  return modules;
}

async function main() {
  console.log("=== CLEANING & RESEEDING AUTHORITATIVE 21 SOFTLAB COURSES ===");

  const trainer = await prisma.trainerProfile.findFirst({
    include: { user: true },
  });

  const cleanedCourseDataList = [];

  for (let cIdx = 0; cIdx < COURSE_DEFINITIONS.length; cIdx++) {
    const def = COURSE_DEFINITIONS[cIdx];
    console.log(`\n[${cIdx + 1}/21] Processing Course: "${def.title}" (${def.slug})`);

    const modules = parseCourseCurriculum(def);
    console.log(`  Parsed ${modules.length} clean modules from curriculum.`);

    // 1. Upsert course record
    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      update: {
        title: def.title,
        durationWeeks: def.durationWeeks,
        baseFee: def.baseFee,
        level: def.level,
        summary: `${def.title} comprehensive curriculum by SOFTLAB GLOBAL.`,
        description: `${def.title} comprehensive master-level engineering program designed by SOFTLAB GLOBAL industry faculty at the Prayagraj Center of Excellence. Features hands-on labs, enterprise projects, weekly code reviews, and structured placement preparation with corporate partners.`,
        thumbnailUrl: def.flyer,
        status: ContentStatus.PUBLISHED,
        providerType: "SOFTLAB",
        providerName: "SoftLab Global",
        sortOrder: cIdx + 1,
        language: "English / Hindi",
        eligibility: "Graduates, Diploma holders, or students seeking job-ready tech skills.",
        deletedAt: null,
      },
      create: {
        title: def.title,
        slug: def.slug,
        durationWeeks: def.durationWeeks,
        baseFee: def.baseFee,
        level: def.level,
        summary: `${def.title} comprehensive curriculum by SOFTLAB GLOBAL.`,
        description: `${def.title} comprehensive master-level engineering program designed by SOFTLAB GLOBAL industry faculty at the Prayagraj Center of Excellence. Features hands-on labs, enterprise projects, weekly code reviews, and structured placement preparation with corporate partners.`,
        thumbnailUrl: def.flyer,
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

    // 2. Remove all existing modules and lessons for this course to eliminate duplicates/legacy artifacts
    const existingModules = await prisma.module.findMany({
      where: { courseId: course.id },
      select: {
        id: true,
        lessons: { select: { id: true } },
      },
    });

    if (existingModules.length > 0) {
      const existingModIds = existingModules.map((m) => m.id);
      const existingLessonIds = existingModules.flatMap((m) => m.lessons.map((l) => l.id));

      // Reset lastAccessedLessonId on enrollments
      await prisma.enrollment.updateMany({
        where: { courseId: course.id },
        data: { lastAccessedLessonId: null },
      });

      if (existingLessonIds.length > 0) {
        // Delete lesson contents
        await prisma.lessonContent.deleteMany({
          where: { lessonId: { in: existingLessonIds } },
        });

        // Delete lesson progresses
        await prisma.lessonProgress.deleteMany({
          where: { lessonId: { in: existingLessonIds } },
        });

        // Delete child lessons
        await prisma.lesson.deleteMany({
          where: { id: { in: existingLessonIds } },
        });
      }

      // Delete existing modules
      await prisma.module.deleteMany({
        where: { id: { in: existingModIds } },
      });
      console.log(`  Purged ${existingModules.length} old modules & ${existingLessonIds.length} child lessons.`);
    }

    // 3. Insert fresh clean modules and lessons
    for (let mIdx = 0; mIdx < modules.length; mIdx++) {
      const m = modules[mIdx];
      const modTitle = m.title;

      const moduleRecord = await prisma.module.create({
        data: {
          courseId: course.id,
          title: modTitle,
          description: `Curriculum covering ${modTitle} for ${def.title}.\nTopics include:\n${m.topics.map((t) => `• ${t}`).join("\n")}`,
          sortOrder: mIdx + 1,
          status: ContentStatus.PUBLISHED,
        },
      });

      // Lesson 1: Theory, Architecture & Key Concepts
      const l1 = await prisma.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          title: `${modTitle}: Concept & Architectural Lecture`,
          slug: `${def.slug}-m${mIdx + 1}-l1`,
          summary: `In-depth theoretical foundation and architectural lecture covering ${m.topics.slice(0, 3).join(", ")}.`,
          type: LessonType.RICH_TEXT,
          durationMin: 45,
          sortOrder: 1,
          status: ContentStatus.PUBLISHED,
        },
      });

      const bodyHtmlLesson1 = `
        <div class="space-y-6 text-slate-800">
          <div class="border-l-4 border-emerald-600 pl-4 py-1">
            <h2 class="text-xl font-extrabold text-slate-900">${modTitle}: Theoretical Foundation</h2>
            <p class="text-sm text-slate-600 mt-1">Official SOFTLAB GLOBAL Engineering Courseware</p>
          </div>

          <div class="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
            <h3 class="text-base font-bold text-emerald-950 mb-2">Learning Objectives & Industrial Competencies</h3>
            <ul class="list-disc list-inside space-y-1 text-xs text-emerald-900 leading-relaxed">
              <li>Master the architectural principles and operational workflow of ${modTitle}.</li>
              <li>Analyze real-world industrial use cases and performance implications.</li>
              <li>Avoid common antipatterns and adhere to standard corporate engineering practices.</li>
            </ul>
          </div>

          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900">Key Curriculum Topics</h3>
              <span class="text-xs text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-full">Interactive Topics</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${m.topics
                .map(
                  (t: string) => `
                <div class="topic-pill cursor-pointer p-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-between text-xs font-semibold text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.03)]" data-topic="${t}">
                  <div class="flex items-center gap-2">
                    <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>${t}</span>
                  </div>
                  <span class="text-[11px] text-emerald-700 font-medium">Study →</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>

          <div class="bg-slate-900 text-slate-100 p-5 rounded-2xl space-y-3 font-mono text-xs">
            <div class="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span>SYSTEM ARCHITECTURE & FLOW</span>
              <span class="text-emerald-400">SOFTLAB-V2-SPEC</span>
            </div>
            <pre class="overflow-x-auto py-2">
CLIENT / REQUEST LAYER  ───►  LOGIC & PROCESSING ENGINE  ───►  PERSISTENCE & AUDIT
         │                               │                             │
         ▼                               ▼                             ▼
   Authentication             Business Rule Validation          Encrypted Ledger
            </pre>
          </div>

          <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-1">
            <strong class="font-bold">Important Best Practices:</strong>
            <p>Always maintain clean separation of concerns, write idempotent code, and commit your working code to the designated Git branch before proceeding to the practical lab.</p>
          </div>
        </div>
      `;

      await prisma.lessonContent.create({
        data: {
          lessonId: l1.id,
          bodyHtml: bodyHtmlLesson1,
          bodyText: `Curriculum lecture for ${modTitle} covering ${m.topics.join(", ")}.`,
        },
      });

      // Lesson 2: Practical Lab & Hands-on Coding
      const l2 = await prisma.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          title: `${modTitle}: Hands-on Practical Lab`,
          slug: `${def.slug}-m${mIdx + 1}-l2`,
          summary: `Hands-on laboratory execution, commands, coding exercises, and validation.`,
          type: LessonType.RICH_TEXT,
          durationMin: 60,
          sortOrder: 2,
          status: ContentStatus.PUBLISHED,
        },
      });

      const bodyHtmlLesson2 = `
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
                ${(m.labs.length > 0 ? m.labs : ["Environment Setup & Diagnostic Verification", "Core Implementation of Module Topics", "Edge Case & Error Handling Scenarios"]).map((lab) => `<li>${lab}</li>`).join("")}
              </ul>
            </div>
          </div>

          <div class="bg-slate-950 text-emerald-400 p-5 rounded-2xl font-mono text-xs space-y-2">
            <div class="text-slate-400 text-[11px] pb-1 border-b border-slate-800">TERMINAL & CODE EXECUTION WORKFLOW</div>
            <p># Step 1: Initialize local branch for Module ${mIdx + 1}</p>
            <p class="text-slate-300">git checkout -b lab-${def.slug}-m${mIdx + 1}</p>
            <p># Step 2: Run verification and compile / test suite</p>
            <p class="text-slate-300">npm test || make test || ./diagnostics.sh</p>
            <p># Step 3: Implement required solution logic and verify with mentor</p>
          </div>

          <div class="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs text-blue-900">
            <span class="font-bold">Mentor Checkpoint:</span> Present your terminal/console output or running application to your batch mentor for verification.
          </div>
        </div>
      `;

      await prisma.lessonContent.create({
        data: {
          lessonId: l2.id,
          bodyHtml: bodyHtmlLesson2,
          bodyText: `Hands-on practical lab for ${modTitle}.`,
        },
      });

      // Lesson 3: Assignment & Capstone Rubric
      const l3 = await prisma.lesson.create({
        data: {
          moduleId: moduleRecord.id,
          title: `${modTitle}: Project Assignment & Evaluation`,
          slug: `${def.slug}-m${mIdx + 1}-l3`,
          summary: `Evaluated assignment challenge, rubric specifications, and submission guidelines.`,
          type: LessonType.ASSIGNMENT,
          durationMin: 60,
          sortOrder: 3,
          status: ContentStatus.PUBLISHED,
        },
      });

      const bodyHtmlLesson3 = `
        <div class="space-y-6 text-slate-800">
          <div class="border-l-4 border-indigo-600 pl-4 py-1">
            <h2 class="text-xl font-extrabold text-slate-900">${modTitle}: Assignment & Mini-Project</h2>
            <p class="text-sm text-slate-600 mt-1">Evaluated Deliverable for Course Completion</p>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <h3 class="text-base font-bold text-slate-900">Assignment Brief</h3>
            <p class="text-xs text-slate-600 leading-relaxed">
              Design and deliver a fully functional implementation applying the concepts learned in ${modTitle}. Your project will be reviewed during weekly code reviews and viva examinations.
            </p>
            <div class="border-t border-slate-100 pt-3">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Grading Rubric</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span class="font-bold text-slate-900">Functionality (40%)</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Code correctness, zero critical exceptions, passing tests.</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span class="font-bold text-slate-900">Code Quality (30%)</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Clean architecture, modular design, documentation.</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span class="font-bold text-slate-900">Viva & Defense (30%)</span>
                  <p class="text-[11px] text-slate-500 mt-0.5">Ability to explain architecture and debug scenarios.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      await prisma.lessonContent.create({
        data: {
          lessonId: l3.id,
          bodyHtml: bodyHtmlLesson3,
          bodyText: `Assignment brief and rubric for ${modTitle}.`,
        },
      });
    }

    cleanedCourseDataList.push({
      ...def,
      moduleCount: modules.length,
      modules: modules.map((m, idx) => ({
        sortOrder: idx + 1,
        title: m.title,
        topics: m.topics,
        labs: m.labs,
      })),
    });
  }

  // Write out cleaned JSON
  fs.writeFileSync(
    "scripts/curriculum-21-courses.json",
    JSON.stringify(cleanedCourseDataList, null, 2)
  );
  console.log("\n✅ ALL 21 SOFTLAB COURSES CLEANED, RE-SEEDED AND SYNCHRONIZED SUCCESSFULLY!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
