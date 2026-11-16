import { db } from "@/server/db/client";
import { ContentStatus, ExamStatus, ExamType, LessonType, QuestionType } from "@prisma/client";

export interface ProjectAllocationRule {
  durationLabel: string;
  isExactStandard: boolean;
  semesters: number;
  semester1: { minor: number; major: number };
  semester2: { minor: number; major: number };
  totalMinor: number;
  totalMajor: number;
}

export function computeProjectAllocation(durationWeeks: number): ProjectAllocationRule {
  if (durationWeeks === 12) {
    return {
      durationLabel: "3 Months (12 Weeks)",
      isExactStandard: true,
      semesters: 1,
      semester1: { minor: 2, major: 1 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 2,
      totalMajor: 1,
    };
  }
  if (durationWeeks === 24) {
    return {
      durationLabel: "6 Months (24 Weeks)",
      isExactStandard: true,
      semesters: 1,
      semester1: { minor: 4, major: 2 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 4,
      totalMajor: 2,
    };
  }
  if (durationWeeks === 52) {
    return {
      durationLabel: "12 Months (52 Weeks — 2 Semesters)",
      isExactStandard: true,
      semesters: 2,
      semester1: { minor: 3, major: 1 },
      semester2: { minor: 4, major: 2 },
      totalMinor: 7,
      totalMajor: 3,
    };
  }
  if (durationWeeks <= 2) {
    return {
      durationLabel: `${durationWeeks} Week(s) (Proportionate Workshop Plan)`,
      isExactStandard: false,
      semesters: 1,
      semester1: { minor: 1, major: 0 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 1,
      totalMajor: 0,
    };
  }
  if (durationWeeks <= 8) {
    return {
      durationLabel: `${durationWeeks} Weeks (Proportionate Short-Term Plan)`,
      isExactStandard: false,
      semesters: 1,
      semester1: { minor: 1, major: 1 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 1,
      totalMajor: 1,
    };
  }
  if (durationWeeks <= 16) {
    return {
      durationLabel: `${durationWeeks} Weeks (Proportionate Intermediate Plan)`,
      isExactStandard: false,
      semesters: 1,
      semester1: { minor: 3, major: 1 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 3,
      totalMajor: 1,
    };
  }
  if (durationWeeks <= 20) {
    return {
      durationLabel: `${durationWeeks} Weeks (Proportionate Extended Plan)`,
      isExactStandard: false,
      semesters: 1,
      semester1: { minor: 3, major: 2 },
      semester2: { minor: 0, major: 0 },
      totalMinor: 3,
      totalMajor: 2,
    };
  }
  return {
    durationLabel: `${durationWeeks} Weeks (Proportionate Advanced Plan)`,
    isExactStandard: false,
    semesters: 1,
    semester1: { minor: 4, major: 2 },
    semester2: { minor: 0, major: 0 },
    totalMinor: 4,
    totalMajor: 2,
  };
}

export function classifyCourseDomain(title: string): {
  category: string;
  labType: string;
  language: string;
  tools: string;
  docUrl: string;
  docName: string;
} {
  const t = title.toLowerCase();
  if (t.includes("sap") || t.includes("tally") || t.includes("gst") || t.includes("accounting") || t.includes("erp")) {
    return {
      category: "SAP_ERP",
      labType: "SAP_ERP",
      language: "sap-abap",
      tools: "SAP S/4HANA Sandbox / TallyPrime / Excel Financial Models",
      docUrl: "https://learning.sap.com/",
      docName: "SAP Learning Official Docs",
    };
  }
  if (t.includes("cyber") || t.includes("ethical hacking") || t.includes("security") || t.includes("network") || t.includes("ccna") || t.includes("linux")) {
    return {
      category: "NETWORKING_CYBER",
      labType: "CYBER_SECURITY",
      language: "bash",
      tools: "Kali Linux / Wireshark / Nmap / Cisco Packet Tracer",
      docUrl: "https://www.kernel.org/doc/html/latest/",
      docName: "Linux & Security Official Docs",
    };
  }
  if (t.includes("data science") || t.includes("machine learning") || t.includes("ai") || t.includes("analytics") || t.includes("power bi") || t.includes("python")) {
    return {
      category: "DATA_SCIENCE",
      labType: "PROGRAMMING",
      language: "python",
      tools: "Python 3.12 / JupyterLab / Pandas / Scikit-Learn / SQL",
      docUrl: "https://docs.python.org/3/",
      docName: "Python Official Documentation",
    };
  }
  if (t.includes("digital marketing") || t.includes("seo") || t.includes("graphic") || t.includes("ui/ux") || t.includes("figma") || t.includes("english") || t.includes("personality")) {
    return {
      category: "DESIGN_MARKETING",
      labType: "DIGITAL_MARKETING",
      language: "markdown",
      tools: "Google Analytics 4 / Search Console / Figma / SoftLab Studio",
      docUrl: "https://developers.google.com/search/docs",
      docName: "Google Search & Analytics Official Docs",
    };
  }
  return {
    category: "SOFTWARE_ENGINEERING",
    labType: "PROGRAMMING",
    language: t.includes("java") ? "java" : t.includes("c++") || t.includes("cpp") ? "cpp" : "javascript",
    tools: "VS Code / Git / Node.js / Compiler Sandbox / PostgreSQL",
    docUrl: "https://developer.mozilla.org/en-US/",
    docName: "MDN Web & Official Language Docs",
  };
}

export class AcademicContentEngineService {
  /**
   * Phase 3: Seed the Common Academic Source Library (GeeksforGeeks, W3Schools, Tutorialspoint + Official Docs)
   */
  public static async seedCommonAcademicSources() {
    const sources = [
      {
        name: "GeeksforGeeks",
        baseUrl: "https://www.geeksforgeeks.org/",
        sourceType: "REFERENCE_PORTAL",
        subjectCategories: ["DSA", "Python", "Java", "C++", "Web Development", "SQL", "Machine Learning", "Cybersecurity"],
        accessStatus: "LINK_ONLY",
        licenseStatus: "ATTRIBUTION_REQUIRED_NO_SCRAPE",
        attributionText: "Reference link only — GeeksforGeeks (https://www.geeksforgeeks.org/). Original SoftLab Global content authored independently.",
      },
      {
        name: "W3Schools",
        baseUrl: "https://www.w3schools.com/",
        sourceType: "REFERENCE_PORTAL",
        subjectCategories: ["HTML", "CSS", "JavaScript", "SQL", "Python", "React", "Node.js", "TypeScript"],
        accessStatus: "LINK_ONLY",
        licenseStatus: "ATTRIBUTION_REQUIRED_NO_SCRAPE",
        attributionText: "Reference link only — W3Schools (https://www.w3schools.com/). Original SoftLab Global content authored independently.",
      },
      {
        name: "Tutorialspoint",
        baseUrl: "https://www.tutorialspoint.com/",
        sourceType: "REFERENCE_PORTAL",
        subjectCategories: ["Cloud", "DevOps", "Linux", "Networking", "SAP", "Software Engineering", "DBMS"],
        accessStatus: "LINK_ONLY",
        licenseStatus: "ATTRIBUTION_REQUIRED_NO_SCRAPE",
        attributionText: "Reference link only — Tutorialspoint (https://www.tutorialspoint.com/). Original SoftLab Global content authored independently.",
      },
      {
        name: "MDN Web Docs",
        baseUrl: "https://developer.mozilla.org/",
        sourceType: "OFFICIAL_DOCS",
        subjectCategories: ["HTML", "CSS", "JavaScript", "Web APIs", "HTTP"],
        accessStatus: "PERMITTED_REFERENCE",
        licenseStatus: "CC-BY-SA-2.5",
        attributionText: "Official Web Standards Reference — MDN Web Docs.",
      },
      {
        name: "Python Official Documentation",
        baseUrl: "https://docs.python.org/3/",
        sourceType: "OFFICIAL_DOCS",
        subjectCategories: ["Python", "Data Science", "Machine Learning", "AI"],
        accessStatus: "PERMITTED_REFERENCE",
        licenseStatus: "PSF-LICENSE",
        attributionText: "Official Python 3 Documentation — Python Software Foundation.",
      },
    ];

    const results = [];
    for (const s of sources) {
      const upserted = await db.academicSourceRegistry.upsert({
        where: { baseUrl: s.baseUrl },
        update: {
          name: s.name,
          sourceType: s.sourceType,
          subjectCategories: s.subjectCategories,
          accessStatus: s.accessStatus,
          licenseStatus: s.licenseStatus,
          attributionText: s.attributionText,
          lastVerifiedAt: new Date(),
          isActive: true,
        },
        create: {
          ...s,
          lastVerifiedAt: new Date(),
          isActive: true,
        },
      });
      results.push(upserted);
    }
    return results;
  }

  /**
   * Phase 10: Seed configurable Project Evaluation Rubrics
   */
  public static async seedDefaultRubrics() {
    const defaultCriteria = [
      { key: "technical_accuracy", label: "Technical accuracy and correctness", weightPercent: 25, description: "Correctness of logic, architecture, commands, or domain workflow." },
      { key: "topic_application", label: "Application of course topics", weightPercent: 20, description: "Effective integration of covered module and lesson concepts." },
      { key: "practical_impl", label: "Practical implementation", weightPercent: 20, description: "Hands-on execution, reproducibility, and configuration quality." },
      { key: "deliverable_quality", label: "Functionality and deliverable quality", weightPercent: 15, description: "Completeness, edge-case handling, and output accuracy." },
      { key: "documentation", label: "Documentation and presentation", weightPercent: 10, description: "Clarity of README, architecture diagram, and test evidence." },
      { key: "viva", label: "Viva and problem-solving", weightPercent: 10, description: "Defense of design choices and debugging during viva." },
    ];

    const categories = [
      "GENERAL",
      "SOFTWARE_ENGINEERING",
      "DATA_SCIENCE",
      "NETWORKING_CYBER",
      "SAP_ERP",
      "DESIGN_MARKETING",
    ];

    for (const cat of categories) {
      await db.projectEvaluationRubric.upsert({
        where: { category: cat },
        update: { criteriaJson: defaultCriteria, isDefault: cat === "GENERAL" },
        create: { category: cat, criteriaJson: defaultCriteria, isDefault: cat === "GENERAL" },
      });
    }
    return defaultCriteria;
  }

  private static buildOriginalSvgDiagram(courseTitle: string, lessonTitle: string): string {
    const safeCourse = courseTitle.replace(/[<>&"]/g, "");
    const safeLesson = lessonTitle.replace(/[<>&"]/g, "");
    return `<svg viewBox="0 0 760 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:760px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;margin:12px 0;">
      <rect x="20" y="35" width="155" height="70" rx="8" fill="#0284c7" />
      <text x="97" y="65" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">1. Concept &amp; Setup</text>
      <text x="97" y="84" fill="#e0f2fe" font-size="10" text-anchor="middle">${safeLesson.slice(0, 22)}</text>
      <line x1="175" y1="70" x2="215" y2="70" stroke="#475569" stroke-width="2" />
      <rect x="215" y="35" width="165" height="70" rx="8" fill="#0f172a" />
      <text x="297" y="65" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">2. Practical Execution</text>
      <text x="297" y="84" fill="#94a3b8" font-size="10" text-anchor="middle">Lab &amp; Workflow</text>
      <line x1="380" y1="70" x2="420" y2="70" stroke="#475569" stroke-width="2" />
      <rect x="420" y="35" width="155" height="70" rx="8" fill="#059669" />
      <text x="497" y="65" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">3. Verification</text>
      <text x="497" y="84" fill="#d1fae5" font-size="10" text-anchor="middle">Expected Output</text>
      <line x1="575" y1="70" x2="615" y2="70" stroke="#475569" stroke-width="2" />
      <rect x="615" y="35" width="125" height="70" rx="8" fill="#4f46e5" />
      <text x="677" y="65" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle">4. Assessment</text>
      <text x="677" y="84" fill="#e0e7ff" font-size="10" text-anchor="middle">10+ MCQs &amp; Project</text>
      <text x="380" y="135" fill="#475569" font-size="11" text-anchor="middle">SoftLab Global Original Learning Flow — ${safeCourse.slice(0, 48)}</text>
    </svg>`;
  }

  private static buildComprehensiveLessonContent(
    course: { id: string; title: string; slug: string; level: string | null },
    moduleTitle: string,
    lessonTitle: string,
    domain: ReturnType<typeof classifyCourseDomain>
  ) {
    const svg = this.buildOriginalSvgDiagram(course.title, lessonTitle);
    const codeSnippet =
      domain.language === "python"
        ? `# SoftLab Global Practical Example — ${lessonTitle}\ndef verify_topic_workflow(sample_input: list[int]) -> dict:\n    cleaned = [x for x in sample_input if x >= 0]\n    return {"count": len(cleaned), "sum": sum(cleaned), "avg": round(sum(cleaned)/max(1, len(cleaned)), 2)}\n\nprint(verify_topic_workflow([12, 18, 25, 30]))`
        : domain.language === "bash"
          ? `# SoftLab Global Lab Command — ${lessonTitle}\nuname -a && ip addr show | head -n 12\necho "Verification check completed for ${lessonTitle}"`
          : `// SoftLab Global Practical Example — ${lessonTitle}\nfunction evaluateTopic(items) {\n  const valid = items.filter((v) => v !== null && v !== undefined);\n  return { processed: valid.length, status: "VERIFIED" };\n}\nconsole.log(evaluateTopic(["step1", "step2", "step3"]));`;

    const learningObjectives = [
      `Understand the core principles and terminology of ${lessonTitle} within ${moduleTitle}.`,
      `Apply step-by-step industry procedures using ${domain.tools}.`,
      `Execute hands-on lab verification and troubleshoot common implementation errors.`,
    ].join("\n");

    const practicalInstructions = [
      `1. Environment Setup: Open ${domain.tools} in your isolated SoftLab Lab workspace.`,
      `2. Implementation: Follow the structured workflow for "${lessonTitle}" and execute the starter template.`,
      `3. Verification: Compare your actual output against the expected output specification below.`,
      `4. Troubleshooting: Review logs/syntax if any assertion fails before submitting.`,
    ].join("\n");

    const expectedOutput = `{"status": "VERIFIED", "topic": "${lessonTitle}", "module": "${moduleTitle}", "checksPassed": true}`;

    const assignmentPrompt = `Complete a practical case study applying "${lessonTitle}" from "${moduleTitle}" (${course.title}). Submit your implementation steps, observed output screenshot/log, and a 3-point troubleshooting summary.`;

    const bodyHtml = `
      <div class="slg-academic-lesson">
        <h2>${lessonTitle}</h2>
        <p><strong>Course:</strong> ${course.title} | <strong>Module:</strong> ${moduleTitle} | <strong>Level:</strong> ${course.level || "Beginner to Advanced"}</p>

        <h3>1. Learning Objectives</h3>
        <ul>
          <li>Master foundational concepts and architecture behind <strong>${lessonTitle}</strong>.</li>
          <li>Configure and apply <strong>${domain.tools}</strong> in realistic scenarios.</li>
          <li>Validate outputs, diagnose errors, and complete topic assessments.</li>
        </ul>

        <h3>2. Prerequisites</h3>
        <p>Completion of earlier topics in <em>${moduleTitle}</em> and basic familiarity with ${domain.tools}.</p>

        <h3>3. Introduction &amp; Detailed Theory</h3>
        <p><strong>${lessonTitle}</strong> is a core competency in <strong>${course.title}</strong>. In production environments, teams rely on structured workflows, repeatable validation, and clear separation between configuration, execution, and verification stages to ensure predictable outcomes.</p>

        <h3>4. Key Terminology</h3>
        <ul>
          <li><strong>Workflow Unit:</strong> The discrete operational step governed by ${lessonTitle}.</li>
          <li><strong>Validation Gate:</strong> Automated or manual check confirming expected output before promotion.</li>
          <li><strong>Error Boundary:</strong> Guardrail preventing invalid inputs from corrupting downstream records.</li>
        </ul>

        <h3>5. Architecture &amp; Learning Flow Diagram</h3>
        ${svg}

        <h3>6. Step-by-Step Explanation &amp; Practical Example</h3>
        <pre><code class="language-${domain.language}">${codeSnippet.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>

        <h3>7. Comparison &amp; Best Practices</h3>
        <table>
          <thead><tr><th>Approach</th><th>Reliability</th><th>Recommended Use</th></tr></thead>
          <tbody>
            <tr><td>Ad-hoc Manual Execution</td><td>Low</td><td>Quick exploratory checks only</td></tr>
            <tr><td>Validated Structured Workflow</td><td>High</td><td>Production &amp; SoftLab LMS Lab submissions</td></tr>
          </tbody>
        </table>

        <h3>8. Common Errors &amp; Troubleshooting</h3>
        <ul>
          <li><strong>Configuration Mismatch:</strong> Verify environment variables and tool versions in ${domain.tools}.</li>
          <li><strong>Validation Failure:</strong> Inspect input schema and re-run step-by-step verification.</li>
        </ul>

        <h3>9. References &amp; Further Reading (Outbound Links Only)</h3>
        <ul>
          <li><a href="${domain.docUrl}" target="_blank" rel="noopener noreferrer">${domain.docName}</a></li>
          <li><a href="https://www.geeksforgeeks.org/" target="_blank" rel="noopener noreferrer">GeeksforGeeks Reference Portal</a></li>
          <li><a href="https://www.w3schools.com/" target="_blank" rel="noopener noreferrer">W3Schools Interactive Reference</a></li>
          <li><a href="https://www.tutorialspoint.com/" target="_blank" rel="noopener noreferrer">Tutorialspoint Technical Reference</a></li>
        </ul>
      </div>
    `.trim();

    return {
      learningObjectives,
      practicalInstructions,
      expectedOutput,
      assignmentPrompt,
      bodyHtml,
      bodyText: `${lessonTitle} — ${moduleTitle} (${course.title}). ${learningObjectives} ${practicalInstructions}`,
      codeExamplesJson: [{ language: domain.language, title: `${lessonTitle} Starter`, code: codeSnippet }],
      resourcesJson: [
        { title: domain.docName, url: domain.docUrl, license: "Official Docs" },
        { title: "GeeksforGeeks", url: "https://www.geeksforgeeks.org/", license: "Reference Link Only" },
        { title: "W3Schools", url: "https://www.w3schools.com/", license: "Reference Link Only" },
        { title: "Tutorialspoint", url: "https://www.tutorialspoint.com/", license: "Reference Link Only" },
      ],
      requiredTools: domain.tools,
      codeSnippet,
    };
  }

  /**
   * Validate generated lesson content before auto-publishing
   */
  public static validateLessonQuality(input: {
    title: string;
    bodyHtml?: string | null;
    learningObjectives?: string | null;
    practicalInstructions?: string | null;
    expectedOutput?: string | null;
  }): { valid: boolean; errors: string[]; confidenceScore: number } {
    const errors: string[] = [];
    if (!input.title || input.title.trim().length < 3) errors.push("Missing topic title");
    if (!input.bodyHtml || input.bodyHtml.trim().length < 300) errors.push("Theory bodyHtml incomplete (<300 chars)");
    if (!input.learningObjectives || input.learningObjectives.trim().length < 15) errors.push("Missing learning objectives");
    if (!input.practicalInstructions || input.practicalInstructions.trim().length < 20) errors.push("Missing practical lab instructions");
    if (!input.expectedOutput || input.expectedOutput.trim().length < 5) errors.push("Missing expected output");
    if (input.bodyHtml && /<script/i.test(input.bodyHtml)) errors.push("Unsafe script tag detected in HTML");
    return {
      valid: errors.length === 0,
      errors,
      confidenceScore: errors.length === 0 ? 94 : Math.max(35, 90 - errors.length * 15),
    };
  }

  /**
   * Process a single SOFTLAB course end-to-end:
   * 1. Ensure modules & lessons exist (preserving all existing IDs!)
   * 2. Fill missing theory, objectives, practicals, diagrams, assignments
   * 3. Create PracticalLab per topic where missing
   * 4. Create 10 topic-mapped MCQs in QuestionBank per topic where missing
   * 5. Create duration-based Minor/Major CourseProjectPlans (with Semesters for 52-week courses)
   * 6. Create Module Quizzes, Semester Exams (52w), and Final Course Exam
   * 7. Validate & auto-publish (or route to correction queue)
   */
  public static async enrichAndPublishCourse(courseId: string, triggeredById?: string) {
    const course = await db.course.findUnique({
      where: { id: courseId },
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
      },
    });
    if (!course) throw new Error(`Course not found: ${courseId}`);

    const domain = classifyCourseDomain(course.title);
    let modules = course.modules;

    // Step 1: If course has 0 modules, create domain-structured modules & lessons without altering course ID
    if (modules.length === 0) {
      const targetModCount = course.durationWeeks >= 52 ? 8 : course.durationWeeks >= 24 ? 6 : course.durationWeeks <= 2 ? 2 : 4;
      for (let mIdx = 1; mIdx <= targetModCount; mIdx++) {
        const mod = await db.module.create({
          data: {
            courseId: course.id,
            title: `Module ${mIdx}: ${course.title} — ${mIdx === 1 ? "Foundations & Setup" : mIdx === targetModCount ? "Capstone & Industry Readiness" : `Core Track ${mIdx}`}`,
            description: `Structured curriculum module ${mIdx} for ${course.title}.`,
            sortOrder: mIdx,
            status: ContentStatus.PUBLISHED,
          },
        });
        const lessonsPerMod = course.durationWeeks <= 2 ? 2 : 3;
        for (let lIdx = 1; lIdx <= lessonsPerMod; lIdx++) {
          await db.lesson.create({
            data: {
              moduleId: mod.id,
              title: `${course.title.split(" ").slice(0, 3).join(" ")} — Unit ${mIdx}.${lIdx}`,
              summary: `Structured topic ${mIdx}.${lIdx} covering applied concepts and lab verification.`,
              type: LessonType.RICH_TEXT,
              durationMin: 45,
              sortOrder: lIdx,
              status: ContentStatus.PUBLISHED,
            },
          });
        }
      }
      const reloaded = await db.course.findUnique({
        where: { id: course.id },
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
        },
      });
      modules = reloaded?.modules || [];
    }

    let lessonsUpdated = 0;
    let labsCreated = 0;
    let mcqsCreated = 0;
    let publishedLogs = 0;
    let correctionLogs = 0;

    const existingLabs = await db.practicalLab.findMany({
      where: { courseId: course.id },
      select: { lessonId: true, slug: true },
    });
    const labByLesson = new Set(existingLabs.map((l) => l.lessonId).filter(Boolean));

    const existingQuestions = await db.questionBank.findMany({
      where: { courseId: course.id },
      select: { moduleId: true, topic: true, questionText: true },
    });
    const questionTexts = new Set(existingQuestions.map((q) => q.questionText));

    for (const mod of modules) {
      if (mod.status !== ContentStatus.PUBLISHED) {
        await db.module.update({ where: { id: mod.id }, data: { status: ContentStatus.PUBLISHED } });
      }
      for (const lesson of mod.lessons) {
        const cd = lesson.contentDetails;
        const needsEnrichment =
          !cd?.bodyHtml ||
          cd.bodyHtml.trim().length < 300 ||
          !cd.learningObjectives ||
          !cd.practicalInstructions ||
          !cd.assignmentPrompt ||
          !cd.expectedOutput;

        let latestVersionId: string | undefined;

        if (needsEnrichment) {
          const generated = this.buildComprehensiveLessonContent(course, mod.title, lesson.title, domain);

          // Snapshot previous version for safe rollback
          const prevCount = await db.academicContentVersion.count({ where: { lessonId: lesson.id } });
          const version = await db.academicContentVersion.create({
            data: {
              lessonId: lesson.id,
              courseId: course.id,
              versionNumber: prevCount + 1,
              title: lesson.title,
              bodyHtml: cd?.bodyHtml || generated.bodyHtml,
              bodyText: cd?.bodyText || generated.bodyText,
              learningObjectives: cd?.learningObjectives || generated.learningObjectives,
              practicalInstructions: cd?.practicalInstructions || generated.practicalInstructions,
              codeExamplesJson: (cd?.codeExamplesJson as any) || generated.codeExamplesJson,
              assignmentPrompt: cd?.assignmentPrompt || generated.assignmentPrompt,
              expectedOutput: cd?.expectedOutput || generated.expectedOutput,
              requiredTools: cd?.requiredTools || generated.requiredTools,
              resourcesJson: (cd?.resourcesJson as any) || generated.resourcesJson,
              changeSource: "AI_ACADEMIC_ENGINE",
              changedById: triggeredById || null,
            },
          });
          latestVersionId = version.id;

          const merged = {
            bodyHtml: cd?.bodyHtml && cd.bodyHtml.trim().length >= 300 ? cd.bodyHtml : generated.bodyHtml,
            bodyText: cd?.bodyText && cd.bodyText.trim().length >= 100 ? cd.bodyText : generated.bodyText,
            learningObjectives: cd?.learningObjectives || generated.learningObjectives,
            practicalInstructions: cd?.practicalInstructions || generated.practicalInstructions,
            expectedOutput: cd?.expectedOutput || generated.expectedOutput,
            assignmentPrompt: cd?.assignmentPrompt || generated.assignmentPrompt,
            requiredTools: cd?.requiredTools || generated.requiredTools,
            codeExamplesJson: (cd?.codeExamplesJson as any) || generated.codeExamplesJson,
            resourcesJson: (cd?.resourcesJson as any) || generated.resourcesJson,
          };

          const validation = this.validateLessonQuality({
            title: lesson.title,
            ...merged,
          });

          await db.lessonContent.upsert({
            where: { lessonId: lesson.id },
            update: merged,
            create: { lessonId: lesson.id, ...merged },
          });
          lessonsUpdated++;

          if (validation.valid) {
            await db.lesson.update({ where: { id: lesson.id }, data: { status: ContentStatus.PUBLISHED } });
            await db.academicGenerationLog.create({
              data: {
                courseId: course.id,
                moduleId: mod.id,
                lessonId: lesson.id,
                stage: "PUBLISHED",
                status: "PASS",
                confidenceScore: validation.confidenceScore,
                sourceUrls: [domain.docUrl, "https://www.geeksforgeeks.org/", "https://www.w3schools.com/", "https://www.tutorialspoint.com/"],
                versionId: latestVersionId,
                triggeredById: triggeredById || null,
              },
            });
            publishedLogs++;
          } else {
            await db.academicGenerationLog.create({
              data: {
                courseId: course.id,
                moduleId: mod.id,
                lessonId: lesson.id,
                stage: "CORRECTION_QUEUE",
                status: "PENDING_REVIEW",
                confidenceScore: validation.confidenceScore,
                validationErrors: validation.errors,
                versionId: latestVersionId,
                triggeredById: triggeredById || null,
              },
            });
            correctionLogs++;
          }
        }

        // Step 2: PracticalLab per topic
        if (!labByLesson.has(lesson.id)) {
          const generated = this.buildComprehensiveLessonContent(course, mod.title, lesson.title, domain);
          const slug = `lab-${lesson.id.slice(-10)}-${Date.now().toString(36).slice(-4)}`;
          await db.practicalLab.create({
            data: {
              courseId: course.id,
              moduleId: mod.id,
              lessonId: lesson.id,
              title: `Lab: ${lesson.title}`,
              slug,
              labType: domain.labType,
              language: domain.language,
              instructions: generated.practicalInstructions,
              starterCode: generated.codeSnippet,
              expectedOutput: generated.expectedOutput,
              testCasesJson: [{ input: "default", expectedOutput: generated.expectedOutput }],
              status: "PUBLISHED",
              assignedById: triggeredById || null,
            },
          });
          labByLesson.add(lesson.id);
          labsCreated++;
        }

        // Step 3: Minimum 10 MCQs per topic in QuestionBank
        const topicQCount = existingQuestions.filter((q) => q.moduleId === mod.id && q.topic === lesson.title).length;
        if (topicQCount < 10) {
          const toCreate = 10 - topicQCount;
          const difficulties = ["EASY", "EASY", "MEDIUM", "MEDIUM", "MEDIUM", "HARD"];
          for (let qIdx = 1; qIdx <= toCreate; qIdx++) {
            const num = topicQCount + qIdx;
            const qText = `[${course.title.split(" ")[0]}] (${lesson.title}) Q${num}: Which practice best ensures reliable execution and verification in ${lesson.title}?`;
            if (questionTexts.has(qText)) continue;
            await db.questionBank.create({
              data: {
                courseId: course.id,
                moduleId: mod.id,
                topic: lesson.title,
                type: QuestionType.MCQ,
                questionText: qText,
                options: [
                  { id: "opt_1", text: `Applying structured ${domain.tools} workflow with output verification` },
                  { id: "opt_2", text: "Skipping prerequisites and ignoring validation checks" },
                  { id: "opt_3", text: "Hardcoding credentials or bypassing error boundaries" },
                  { id: "opt_4", text: "Deploying unverified changes without testing" },
                ],
                correctAnswer: "opt_1",
                marks: 1.0,
                difficulty: difficulties[num % difficulties.length],
                explanation: `Structured execution using ${domain.tools} with output verification ensures repeatable, production-safe results for ${lesson.title}.`,
                isActive: true,
              },
            });
            questionTexts.add(qText);
            mcqsCreated++;
          }
        }
      }
    }

    // Step 4: Duration-based Minor & Major Projects (CourseProjectPlan)
    const alloc = computeProjectAllocation(course.durationWeeks);
    const existingProjects = await db.courseProjectPlan.count({ where: { courseId: course.id } });
    let projectsCreated = 0;
    if (existingProjects === 0) {
      const rubric = await db.projectEvaluationRubric.findUnique({ where: { category: domain.category } });
      const rubricJson = rubric?.criteriaJson || (await this.seedDefaultRubrics());
      const allLessons = modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id, moduleTitle: m.title })));

      const createProjectsForSemester = async (sem: number, minorCount: number, majorCount: number) => {
        const half = Math.ceil(allLessons.length / 2);
        const semLessons = alloc.semesters === 2 ? (sem === 1 ? allLessons.slice(0, half) : allLessons.slice(half)) : allLessons;
        const pool = semLessons.length > 0 ? semLessons : allLessons;

        for (let i = 1; i <= minorCount; i++) {
          const slice = pool.slice((i - 1) * 2, Math.max(i * 2, 2));
          const covered = slice.length > 0 ? slice : pool.slice(0, 2);
          await db.courseProjectPlan.create({
            data: {
              courseId: course.id,
              title: `${course.title} — ${alloc.semesters === 2 ? `Sem ${sem} ` : ""}Minor Project ${i}: ${covered[0]?.title || "Applied Module Implementation"}`,
              projectType: "MINOR",
              semester: sem,
              sortOrder: i,
              coveredModuleIds: Array.from(new Set(covered.map((c) => c.moduleId))),
              coveredTopicIds: covered.map((c) => c.id),
              coveredTopicTitles: covered.map((c) => c.title),
              objectives: `Demonstrate topic-level mastery of ${covered.map((c) => c.title).join(", ")} using ${domain.tools}.`,
              problemStatement: `Design and verify a focused practical deliverable applying ${covered.map((c) => c.title).join(" & ")} for a realistic SoftLab Global scenario.`,
              prerequisiteKnowledge: `Completion of ${covered.map((c) => c.moduleTitle).join(", ")}`,
              requiredTools: domain.tools,
              functionalReqsJson: ["Configured workspace", "Core topic workflow implemented", "Verified output log"],
              milestonesJson: ["Milestone 1: Setup & Plan", "Milestone 2: Implementation", "Milestone 3: Verification & Viva"],
              practicalStepsJson: ["1. Initialize workspace", "2. Implement covered topic steps", "3. Capture output & submit"],
              deliverablesJson: ["Implementation artifact", "Expected output proof", "Brief technical notes"],
              testingReqs: "All topic verification checks must pass with zero critical errors.",
              rubricJson: rubricJson as any,
              vivaQuestionsJson: [
                `Explain the core architecture of ${covered[0]?.title || course.title}.`,
                `How did you verify expected outputs using ${domain.tools}?`,
              ],
              status: "PUBLISHED",
            },
          });
          projectsCreated++;
        }

        for (let j = 1; j <= majorCount; j++) {
          const covered = pool.slice(0, Math.min(pool.length, 6));
          await db.courseProjectPlan.create({
            data: {
              courseId: course.id,
              title: `${course.title} — ${alloc.semesters === 2 ? `Sem ${sem} ` : ""}Major Project ${j}: End-to-End Capstone System`,
              projectType: "MAJOR",
              semester: sem,
              sortOrder: minorCount + j,
              coveredModuleIds: Array.from(new Set(covered.map((c) => c.moduleId))),
              coveredTopicIds: covered.map((c) => c.id),
              coveredTopicTitles: covered.map((c) => c.title),
              objectives: `Integrate multiple modules across ${course.title} (${alloc.durationLabel}) into an end-to-end production-grade capstone.`,
              problemStatement: `Build, test, and document a comprehensive multi-module capstone integrating ${covered.slice(0, 4).map((c) => c.title).join(", ")}.`,
              prerequisiteKnowledge: `All Semester ${sem} core modules and practical labs`,
              requiredTools: domain.tools,
              functionalReqsJson: ["Multi-module integration", "Error handling & validation", "Complete documentation & demo"],
              milestonesJson: ["Milestone 1: Architecture", "Milestone 2: Core Build", "Milestone 3: Testing & QA", "Milestone 4: Final Viva"],
              practicalStepsJson: ["1. Architecture design", "2. Multi-module integration", "3. End-to-end testing & presentation"],
              deliverablesJson: ["Complete capstone artifact", "Test report", "Presentation & viva defense"],
              testingReqs: "End-to-end integration test suite and rubric evaluation >= 60%.",
              rubricJson: rubricJson as any,
              vivaQuestionsJson: [
                `Walk through how multiple modules interact in your Major Project.`,
                `What edge cases and troubleshooting steps did you resolve?`,
              ],
              status: "PUBLISHED",
            },
          });
          projectsCreated++;
        }
      };

      await createProjectsForSemester(1, alloc.semester1.minor, alloc.semester1.major);
      if (alloc.semesters === 2) {
        await createProjectsForSemester(2, alloc.semester2.minor, alloc.semester2.major);
      }
    }

    // Step 5: Module Quizzes + Final Course Exam (plus Semester Exams for 52w)
    const existingExamCount = await db.exam.count({ where: { courseId: course.id } });
    let examsCreated = 0;
    if (existingExamCount === 0) {
      const courseQs = await db.questionBank.findMany({
        where: { courseId: course.id, isActive: true },
        take: 40,
        select: { id: true, moduleId: true },
      });

      if (courseQs.length > 0) {
        // Final Course Exam
        const finalExam = await db.exam.create({
          data: {
            courseId: course.id,
            title: `${course.title} — Final Certification Examination`,
            slug: `final-exam-${course.id.slice(-8)}`,
            description: `Comprehensive final assessment covering all modules of ${course.title}.`,
            type: ExamType.FINAL_EXAM,
            status: ExamStatus.PUBLISHED,
            durationMinutes: 60,
            totalMarks: Math.min(courseQs.length, 30),
            passingPercentage: 50,
            createdById: triggeredById || null,
          },
        });
        for (let idx = 0; idx < Math.min(courseQs.length, 30); idx++) {
          await db.examQuestion.create({
            data: { examId: finalExam.id, questionId: courseQs[idx].id, sortOrder: idx + 1 },
          });
        }
        examsCreated++;

        // Module Quiz for first module
        if (modules[0]) {
          const modQs = courseQs.filter((q) => q.moduleId === modules[0].id).slice(0, 10);
          if (modQs.length > 0) {
            const modExam = await db.exam.create({
              data: {
                courseId: course.id,
                moduleId: modules[0].id,
                title: `${modules[0].title} — Module Assessment`,
                slug: `mod-quiz-${modules[0].id.slice(-8)}`,
                type: ExamType.MODULE_QUIZ,
                status: ExamStatus.PUBLISHED,
                durationMinutes: 20,
                totalMarks: modQs.length,
                passingPercentage: 50,
                createdById: triggeredById || null,
              },
            });
            for (let idx = 0; idx < modQs.length; idx++) {
              await db.examQuestion.create({
                data: { examId: modExam.id, questionId: modQs[idx].id, sortOrder: idx + 1 },
              });
            }
            examsCreated++;
          }
        }
      }
    }

    return {
      courseId: course.id,
      title: course.title,
      durationWeeks: course.durationWeeks,
      projectAllocation: alloc,
      lessonsUpdated,
      labsCreated,
      mcqsCreated,
      projectsCreated,
      examsCreated,
      publishedLogs,
      correctionLogs,
    };
  }

  /**
   * Rollback a lesson to a specific AcademicContentVersion
   */
  public static async rollbackLessonToVersion(versionId: string, adminUserId?: string) {
    const version = await db.academicContentVersion.findUnique({ where: { id: versionId } });
    if (!version) throw new Error("AcademicContentVersion not found");

    await db.lessonContent.upsert({
      where: { lessonId: version.lessonId },
      update: {
        bodyHtml: version.bodyHtml,
        bodyText: version.bodyText,
        learningObjectives: version.learningObjectives,
        practicalInstructions: version.practicalInstructions,
        codeExamplesJson: version.codeExamplesJson as any,
        assignmentPrompt: version.assignmentPrompt,
        projectPrompt: version.projectPrompt,
        expectedOutput: version.expectedOutput,
        requiredTools: version.requiredTools,
        resourcesJson: version.resourcesJson as any,
      },
      create: {
        lessonId: version.lessonId,
        bodyHtml: version.bodyHtml,
        bodyText: version.bodyText,
        learningObjectives: version.learningObjectives,
        practicalInstructions: version.practicalInstructions,
        codeExamplesJson: version.codeExamplesJson as any,
        assignmentPrompt: version.assignmentPrompt,
        projectPrompt: version.projectPrompt,
        expectedOutput: version.expectedOutput,
        requiredTools: version.requiredTools,
        resourcesJson: version.resourcesJson as any,
      },
    });

    await db.academicGenerationLog.create({
      data: {
        courseId: version.courseId,
        lessonId: version.lessonId,
        stage: "ROLLBACK",
        status: "ROLLED_BACK",
        confidenceScore: 100,
        versionId: version.id,
        triggeredById: adminUserId || null,
      },
    });

    return { success: true, lessonId: version.lessonId, restoredVersion: version.versionNumber };
  }
}
