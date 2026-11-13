import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

interface LessonContentData {
  id: string;
  lessonId: string;
  videoProvider: string | null;
  bunnyVideoId: string | null;
  videoUrl: string | null;
  storageFileKey: string | null;
  fileName: string | null;
  documentUrl: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
  externalUrl: string | null;
}

interface LessonData {
  id: string;
  moduleId: string;
  title: string;
  slug: string | null;
  summary: string | null;
  type: string;
  durationMin: number;
  sortOrder: number;
  status: string;
  isFreePreview: boolean;
  contentDetails: LessonContentData | null;
}

interface ModuleData {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: string;
  lessons: LessonData[];
  exams: Array<{ id: string; title: string; type: string; _count: { questions: number } }>;
  _count: { questions: number };
}

interface CourseData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationWeeks: number;
  baseFee: number;
  level: string | null;
  language: string | null;
  eligibility: string | null;
  status: string;
  providerType: string | null;
  providerName: string | null;
  programCategory: string | null;
  courseCode: string | null;
  mode: string | null;
  modules: ModuleData[];
  trainers: Array<{
    trainer: {
      user: { firstName: string; lastName: string | null; email: string };
    };
  }>;
  batches: Array<{ id: string; name: string; code: string; status: string; deliveryMode: string }>;
  exams: Array<{
    id: string;
    title: string;
    type: string;
    totalMarks: number;
    passingPercentage: number;
    durationMinutes: number;
    _count: { questions: number };
  }>;
  _count: {
    enrollments: number;
    applications: number;
    questionBank: number;
    certificates: number;
  };
}

function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function inferLabProfile(course: CourseData): {
  labType: string;
  tools: string;
  projectFocus: string;
} {
  const text = `${course.title} ${course.programCategory ?? ""} ${course.slug}`.toLowerCase();
  if (text.includes("python") || text.includes("java") || text.includes("mern") || text.includes("full stack") || text.includes("web")) {
    return {
      labType: "PROGRAMMING_CODE_SANDBOX",
      tools: "Browser IDE (Python / Java / Node.js / HTML-CSS-JS / SQL), Git CLI, Isolated Sandbox Container",
      projectFocus: "End-to-end deployable software application with automated test cases and code review",
    };
  }
  if (text.includes("data science") || text.includes("machine learning") || text.includes("ai") || text.includes("power bi") || text.includes("analytics")) {
    return {
      labType: "DATA_AI_SQL_SANDBOX",
      tools: "Python (NumPy/Pandas/Scikit-learn), SQLite/PostgreSQL Lab DB, BI Dashboard Workspace",
      projectFocus: "Real-world dataset analysis, predictive model / interactive BI dashboard report",
    };
  }
  if (text.includes("cloud") || text.includes("devops") || text.includes("linux") || text.includes("rhcsa") || text.includes("aws") || text.includes("azure")) {
    return {
      labType: "LINUX_CLOUD_CONTAINER_LAB",
      tools: "Browser Linux Bash Terminal, Docker CLI Sandbox, Cloud/IaC Simulation Lab",
      projectFocus: "Automated Linux server provisioning, containerization & CI/CD deployment pipeline",
    };
  }
  if (text.includes("network") || text.includes("ccna") || text.includes("ccnp") || text.includes("fortigate") || text.includes("hardware")) {
    return {
      labType: "NETWORKING_SUBNET_LAB",
      tools: "Interactive Subnetting & Routing Simulator, VLAN/NAT/Firewall Rule Builder, Linux Net-Tools",
      projectFocus: "Enterprise multi-VLAN topology design with firewall policies and troubleshooting report",
    };
  }
  if (text.includes("cyber") || text.includes("ethical hacking") || text.includes("security")) {
    return {
      labType: "CYBER_SECURITY_SANDBOX",
      tools: "Isolated Linux Security Terminal, Network Scanning & Log Analysis Lab, OWASP Practice Environment",
      projectFocus: "Vulnerability assessment, hardening checklist, and incident response report",
    };
  }
  if (text.includes("365") || text.includes("office") || text.includes("workspace") || text.includes("dca") || text.includes("bca") || text.includes("digital marketing")) {
    return {
      labType: "OFFICE_PRODUCTIVITY_COLLABORA",
      tools: "Collabora CODE Online Office Suite (Writer/Calc/Impress), Relational DB SQL Lab, Admin Console Simulator",
      projectFocus: "Business documentation, automated Excel/Calc dashboard, and executive presentation deck",
    };
  }
  return {
    labType: "ACADEMIC_DOCUMENT_CASE_LAB",
    tools: "LMS Rich-Text & Document Viewer, Collabora CODE Document/Presentation Workspace, MCQ Assessment Engine",
    projectFocus: "Structured subject assignment, case study report, and capstone viva/assessment",
  };
}

function hasTheory(l: LessonData): boolean {
  const c = l.contentDetails;
  if (!c) return false;
  return Boolean((c.bodyHtml && stripHtml(c.bodyHtml).length > 20) || (c.bodyText && c.bodyText.trim().length > 20));
}

function hasMediaOrDoc(l: LessonData): boolean {
  const c = l.contentDetails;
  if (!c) return false;
  return Boolean(c.videoUrl || c.bunnyVideoId || c.documentUrl || c.storageFileKey || c.externalUrl);
}

function hasPractical(l: LessonData): boolean {
  const t = l.title.toLowerCase();
  const body = stripHtml(l.contentDetails?.bodyHtml || l.contentDetails?.bodyText || "").toLowerCase();
  return l.type === "ASSIGNMENT" || t.includes("lab") || t.includes("practical") || t.includes("project") || body.includes("step-by-step") || body.includes("hands-on");
}

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  const rootDir = process.cwd();
  const exportDir = path.join(rootDir, "audit-exports");
  const csvDir = path.join(exportDir, "csv");
  fs.mkdirSync(csvDir, { recursive: true });

  const rawPath = path.join(exportDir, "raw_vps_courses_audit.json");
  if (!fs.existsSync(rawPath)) {
    throw new Error(`Missing ${rawPath}`);
  }
  const courses: CourseData[] = JSON.parse(fs.readFileSync(rawPath, "utf8").replace(/^\uFEFF/, ""));
  console.log(`Loaded ${courses.length} courses from ${rawPath}`);

  // Build normalized rows for Excel, JSON, CSV, and PDF
  const courseRows: Record<string, unknown>[] = [];
  const moduleRows: Record<string, unknown>[] = [];
  const topicRows: Record<string, unknown>[] = [];
  const subtopicRows: Record<string, unknown>[] = [];
  const theoryRows: Record<string, unknown>[] = [];
  const practicalRows: Record<string, unknown>[] = [];
  const projectRows: Record<string, unknown>[] = [];
  const assignmentRows: Record<string, unknown>[] = [];
  const assessmentRows: Record<string, unknown>[] = [];
  const statusRows: Record<string, unknown>[] = [];
  const importTemplateRows: Record<string, unknown>[] = [];

  let totalModules = 0;
  let totalTopics = 0;
  let totalWithTheory = 0;
  let totalWithMedia = 0;
  let totalExams = 0;

  for (const c of courses) {
    const labProfile = inferLabProfile(c);
    const modCount = c.modules.length;
    const lessonCount = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const theoryCount = c.modules.reduce((acc, m) => acc + m.lessons.filter(hasTheory).length, 0);
    const mediaCount = c.modules.reduce((acc, m) => acc + m.lessons.filter(hasMediaOrDoc).length, 0);
    const practicalCount = c.modules.reduce((acc, m) => acc + m.lessons.filter(hasPractical).length, 0);
    const examCount = c.exams.length;

    totalModules += modCount;
    totalTopics += lessonCount;
    totalWithTheory += theoryCount;
    totalWithMedia += mediaCount;
    totalExams += examCount;

    const trainerNames = c.trainers.map((t) => `${t.trainer.user.firstName} ${t.trainer.user.lastName ?? ""}`.trim()).join("; ") || "Unassigned";
    const batchCodes = c.batches.map((b) => `${b.code} (${b.status})`).join("; ") || "No Batch";
    const completionPct = lessonCount > 0 ? Math.round((theoryCount / lessonCount) * 100) : 0;

    const statusFlag =
      modCount === 0
        ? "Content Missing (0 Modules)"
        : theoryCount === 0
          ? "Content Missing (Skeleton Modules/Topics Only)"
          : theoryCount < lessonCount
            ? "Partial Content — Trainer Review Required"
            : practicalCount === 0
              ? "Theory Present — Practical Missing"
              : "Existing Content";

    courseRows.push({
      courseId: c.id,
      courseCode: c.courseCode || c.slug.toUpperCase().slice(0, 16),
      courseName: c.title,
      slug: c.slug,
      providerType: c.providerType || "SOFTLAB",
      category: c.programCategory || "GENERAL",
      durationWeeks: c.durationWeeks,
      baseFeeINR: c.baseFee / 100,
      status: c.status,
      modulesCount: modCount,
      topicsCount: lessonCount,
      theoryPopulatedCount: theoryCount,
      mediaPopulatedCount: mediaCount,
      examsCount: examCount,
      questionBankCount: c._count.questionBank,
      enrollmentsCount: c._count.enrollments,
      trainers: trainerNames,
      batches: batchCodes,
      certificateRule: "Completion >= 80%, Exam >= 50%, Attendance >= 75% (LMS Rule)",
      description: stripHtml(c.summary || c.description).slice(0, 500),
    });

    statusRows.push({
      courseId: c.id,
      courseCode: c.courseCode || c.slug,
      courseName: c.title,
      providerType: c.providerType || "SOFTLAB",
      modulesCount: modCount,
      topicsCount: lessonCount,
      theoryCount,
      practicalCount,
      examCount,
      completionPct: `${completionPct}%`,
      auditStatus: statusFlag,
      labRequirement: labProfile.labType,
      requiredTools: labProfile.tools,
      projectRequirement: labProfile.projectFocus,
    });

    for (const ex of c.exams) {
      assessmentRows.push({
        courseId: c.id,
        courseName: c.title,
        examId: ex.id,
        examTitle: ex.title,
        examType: ex.type,
        totalMarks: ex.totalMarks,
        passingPercentage: ex.passingPercentage,
        durationMinutes: ex.durationMinutes,
        questionsCount: ex._count.questions,
        auditFlag: ex._count.questions > 0 ? "Existing Content" : "Questions Missing — Trainer Review Required",
      });
    }

    if (c.exams.length === 0) {
      assessmentRows.push({
        courseId: c.id,
        courseName: c.title,
        examId: "MISSING",
        examTitle: `${c.title} — Final Assessment (To Be Created)`,
        examType: "FINAL_EXAM",
        totalMarks: 100,
        passingPercentage: 50,
        durationMinutes: 60,
        questionsCount: c._count.questionBank,
        auditFlag: "Assessment Missing — Trainer Review Required",
      });
    }

    for (const m of c.modules) {
      moduleRows.push({
        moduleId: m.id,
        courseId: c.id,
        courseName: c.title,
        sortOrder: m.sortOrder,
        moduleTitle: m.title,
        moduleDescription: stripHtml(m.description),
        status: m.status,
        topicsCount: m.lessons.length,
        questionsCount: m._count.questions,
        auditFlag: m.lessons.length > 0 ? "Existing Structure" : "Topics Missing",
      });

      for (const l of m.lessons) {
        const theoryPresent = hasTheory(l);
        const mediaPresent = hasMediaOrDoc(l);
        const practicalPresent = hasPractical(l);
        const bodyPreview = stripHtml(l.contentDetails?.bodyHtml || l.contentDetails?.bodyText || "").slice(0, 300);

        topicRows.push({
          lessonId: l.id,
          moduleId: m.id,
          courseId: c.id,
          courseName: c.title,
          moduleTitle: m.title,
          sortOrder: l.sortOrder,
          topicTitle: l.title,
          lessonType: l.type,
          durationMin: l.durationMin,
          status: l.status,
          hasTheory: theoryPresent ? "YES" : "NO",
          hasVideoOrDoc: mediaPresent ? "YES" : "NO",
          hasPractical: practicalPresent ? "YES" : "NO",
          auditFlag: theoryPresent ? "Existing Content" : "Content Missing",
        });

        subtopicRows.push({
          subtopicId: `${l.id}-SUB-1`,
          lessonId: l.id,
          moduleId: m.id,
          courseId: c.id,
          courseName: c.title,
          topicTitle: l.title,
          subtopicTitle: `${l.title} — Core Concepts & Guided Walkthrough`,
          auditFlag: theoryPresent ? "Existing Content" : "Subtopic Breakdown Required",
        });

        theoryRows.push({
          lessonId: l.id,
          courseId: c.id,
          courseName: c.title,
          moduleTitle: m.title,
          topicTitle: l.title,
          learningObjectives: `Understand and apply ${l.title} within ${c.title}`,
          existingBodyPreview: bodyPreview || "[Content Missing]",
          theoryToBeAdded: theoryPresent ? "Optional enhancement / Trainer Review" : `Add structured concept notes, diagrams, and real-world examples for ${l.title}`,
          videoUrl: l.contentDetails?.videoUrl || l.contentDetails?.bunnyVideoId || "[Missing]",
          documentUrl: l.contentDetails?.documentUrl || l.contentDetails?.fileName || "[Missing]",
          auditFlag: theoryPresent ? "Existing Content" : "Content Missing",
        });

        practicalRows.push({
          lessonId: l.id,
          courseId: c.id,
          courseName: c.title,
          moduleTitle: m.title,
          topicTitle: l.title,
          labType: labProfile.labType,
          requiredTools: labProfile.tools,
          stepByStepPractical: practicalPresent
            ? `Review existing practical for ${l.title}`
            : `1. Open SoftLab Virtual Lab (${labProfile.labType}); 2. Implement exercise for ${l.title}; 3. Verify expected output & submit.`,
          expectedOutput: `Verified execution output / artifact demonstrating ${l.title}`,
          auditFlag: practicalPresent ? "Existing Practical" : "Practical Missing",
        });

        assignmentRows.push({
          lessonId: l.id,
          courseId: c.id,
          courseName: c.title,
          topicTitle: l.title,
          assignmentTitle: `Assignment: ${l.title}`,
          realWorldApplication: `Apply ${l.title} to an industry scenario in ${c.title}`,
          submissionType: labProfile.labType.includes("CODE") ? "Code Sandbox Submission" : "LMS Upload / Virtual Lab",
          auditFlag: l.type === "ASSIGNMENT" ? "Existing Assignment" : "Assignment Missing",
        });

        importTemplateRows.push({
          courseId: c.id,
          courseSlug: c.slug,
          moduleId: m.id,
          moduleTitle: m.title,
          lessonId: l.id,
          topicTitle: l.title,
          lessonType: l.type,
          durationMin: l.durationMin,
          bodyHtml: l.contentDetails?.bodyHtml || "",
          bodyText: l.contentDetails?.bodyText || "",
          videoUrl: l.contentDetails?.videoUrl || "",
          documentUrl: l.contentDetails?.documentUrl || "",
          practicalInstructions: "",
          assignmentPrompt: "",
          action: "UPDATE_EXISTING",
        });
      }

      if (m.lessons.length === 0) {
        importTemplateRows.push({
          courseId: c.id,
          courseSlug: c.slug,
          moduleId: m.id,
          moduleTitle: m.title,
          lessonId: "",
          topicTitle: `${m.title} — Lesson 1`,
          lessonType: "RICH_TEXT",
          durationMin: 45,
          bodyHtml: "",
          bodyText: "",
          videoUrl: "",
          documentUrl: "",
          practicalInstructions: "",
          assignmentPrompt: "",
          action: "CREATE_TOPIC",
        });
      }
    }

    projectRows.push({
      courseId: c.id,
      courseName: c.title,
      projectTitle: `${c.title} — Capstone Project`,
      projectFocus: labProfile.projectFocus,
      labType: labProfile.labType,
      assessmentCriteria: "Functionality/Accuracy (40%), Best Practices (25%), Documentation (20%), Viva/Demo (15%)",
      auditFlag: "Project Missing — Trainer Review Required",
    });
  }

  // 1. Write JSON Master
  const jsonMaster = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCourses: courses.length,
      totalModules,
      totalTopics,
      totalWithTheory,
      totalWithMedia,
      totalExams,
    },
    courses: courseRows,
    modules: moduleRows,
    topics: topicRows,
    subtopics: subtopicRows,
    theoryContent: theoryRows,
    practicalLabs: practicalRows,
    projects: projectRows,
    assignments: assignmentRows,
    assessments: assessmentRows,
    contentStatus: statusRows,
    bulkImportTemplate: importTemplateRows,
  };
  fs.writeFileSync(path.join(exportDir, "SoftLab_Global_Course_Content_Master.json"), JSON.stringify(jsonMaster, null, 2));

  // 2. Write CSV Exports
  const writeCsv = (name: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(","))];
    fs.writeFileSync(path.join(csvDir, `${name}.csv`), lines.join("\n"), "utf8");
  };
  writeCsv("01_course_master", courseRows);
  writeCsv("02_module_master", moduleRows);
  writeCsv("03_topic_master", topicRows);
  writeCsv("04_content_status", statusRows);
  writeCsv("05_bulk_lms_import_template", importTemplateRows);

  // 3. Write Excel Workbook (11 sheets)
  const wb = new ExcelJS.Workbook();
  wb.creator = "SoftLab Global Academic Architecture Engine";
  wb.created = new Date();

  const addSheet = (name: string, rows: Record<string, unknown>[]) => {
    const ws = wb.addWorksheet(name);
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    ws.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.min(48, Math.max(16, h.length + 4)),
    }));
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B2241" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
    for (const r of rows) {
      ws.addRow(r);
    }
  };

  addSheet("Course Master", courseRows);
  addSheet("Module Master", moduleRows);
  addSheet("Topic Master", topicRows);
  addSheet("Subtopic Master", subtopicRows);
  addSheet("Theory Content", theoryRows);
  addSheet("Practical Labs", practicalRows);
  addSheet("Projects", projectRows);
  addSheet("Assignments", assignmentRows);
  addSheet("Assessments", assessmentRows);
  addSheet("Content Status", statusRows);
  addSheet("Bulk LMS Import Template", importTemplateRows);

  const xlsxPath = path.join(exportDir, "SoftLab_Global_Course_Content_Master.xlsx");
  await wb.xlsx.writeFile(xlsxPath);

  // 4. Write Comprehensive PDF Audit Report
  const pdfPath = path.join(exportDir, "SoftLab_Global_Complete_Course_Curriculum_Audit.pdf");
  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const ensureSpace = (minHeight = 90) => {
      if (doc.y + minHeight > doc.page.height - 50) {
        doc.addPage();
      }
    };

    // Cover Page
    doc.rect(0, 0, doc.page.width, 190).fill("#0B2241");
    doc.fillColor("#38BDF8").fontSize(12).font("Helvetica-Bold").text("SOFTLAB GLOBAL — ACADEMIC ARCHITECTURE & LMS AUDIT", 42, 46);
    doc.fillColor("#FFFFFF").fontSize(24).font("Helvetica-Bold").text("Complete Course Curriculum Audit & Content Master Blueprint", 42, 72, { width: 510 });
    doc.fillColor("#CBD5E1").fontSize(11).font("Helvetica").text(`Generated from Production LMS Database • ${new Date().toISOString().slice(0, 10)}`, 42, 146);

    doc.fillColor("#0F172A").fontSize(14).font("Helvetica-Bold").text("Executive Audit Summary", 42, 220);
    doc.fontSize(10).font("Helvetica").fillColor("#334155");
    const kpis = [
      `Total Courses Discovered in LMS/CMS: ${courses.length}`,
      `Total Modules Discovered: ${totalModules}`,
      `Total Topics (Lessons) Discovered: ${totalTopics}`,
      `Topics with Existing Theory Content: ${totalWithTheory} (${totalTopics > 0 ? Math.round((totalWithTheory / totalTopics) * 100) : 0}%)`,
      `Topics with Video / Document Resources: ${totalWithMedia}`,
      `Total Existing Exams Configured: ${totalExams}`,
      `Audit Hierarchy: Course -> Module -> Topic -> Subtopic -> Theory -> Practical -> Project -> Assessment`,
    ];
    let ky = 248;
    for (const line of kpis) {
      doc.text(`•  ${line}`, 48, ky, { width: 500 });
      ky += 18;
    }

    doc.roundedRect(42, 392, 510, 88, 6).fillAndStroke("#F8FAFC", "#CBD5E1");
    doc.fillColor("#0B2241").fontSize(11).font("Helvetica-Bold").text("Audit Integrity & Status Legend", 54, 404);
    doc.fillColor("#334155").fontSize(9.5).font("Helvetica").text(
      "This audit faithfully reflects the actual production LMS database without inventing missing modules or fake practicals.\n" +
      "Indicators used: [Existing Content] | [Content Missing] | [Practical Missing] | [Project Missing] | [Trainer Review Required]",
      54, 424, { width: 486 }
    );

    // Table of Contents / Course-Wise Index
    doc.addPage();
    doc.fillColor("#0B2241").fontSize(16).font("Helvetica-Bold").text("Table of Contents & Course-Wise Index", 42, 42);
    doc.moveDown(0.5);
    courses.forEach((c, idx) => {
      ensureSpace(24);
      const lCount = c.modules.reduce((a, m) => a + m.lessons.length, 0);
      const tCount = c.modules.reduce((a, m) => a + m.lessons.filter(hasTheory).length, 0);
      const badge = c.modules.length === 0 ? "Content Missing" : tCount === 0 ? "Skeleton Only" : `${tCount}/${lCount} Theory`;
      doc
        .fontSize(8.8)
        .font("Helvetica-Bold")
        .fillColor("#0F172A")
        .text(`${idx + 1}. ${c.title}`, 42, doc.y, { continued: true, width: 390 })
        .font("Helvetica")
        .fillColor("#475569")
        .text(`  [${c.providerType || "SOFTLAB"} | ${c.modules.length}M / ${lCount}T | ${badge}]`, { align: "right" });
      doc.moveDown(0.15);
    });

    // Course-by-Course Audit Chapters
    courses.forEach((c, idx) => {
      doc.addPage();
      const labProfile = inferLabProfile(c);
      const lCount = c.modules.reduce((a, m) => a + m.lessons.length, 0);
      const tCount = c.modules.reduce((a, m) => a + m.lessons.filter(hasTheory).length, 0);
      const pCount = c.modules.reduce((a, m) => a + m.lessons.filter(hasPractical).length, 0);
      const pct = lCount > 0 ? Math.round((tCount / lCount) * 100) : 0;

      doc.rect(42, 42, 510, 44).fill("#0B2241");
      doc.fillColor("#38BDF8").fontSize(9).font("Helvetica-Bold").text(`COURSE ${idx + 1} OF ${courses.length} • ${c.courseCode || c.slug.toUpperCase()}`, 52, 49);
      doc.fillColor("#FFFFFF").fontSize(13).font("Helvetica-Bold").text(c.title, 52, 62, { width: 490 });

      doc.y = 96;
      doc.fillColor("#1E293B").fontSize(9.2).font("Helvetica");
      doc.text(`Category: ${c.programCategory || "GENERAL"}   |   Provider: ${c.providerType || "SOFTLAB"}   |   Duration: ${c.durationWeeks} Weeks   |   Fee: INR ${(c.baseFee / 100).toLocaleString("en-IN")}   |   Status: ${c.status}`);
      doc.text(`Modules: ${c.modules.length}   |   Topics: ${lCount}   |   Theory Populated: ${tCount} (${pct}%)   |   Practicals Found: ${pCount}   |   Exams: ${c.exams.length}   |   Enrollments: ${c._count.enrollments}`);
      doc.text(`Lab Requirement: ${labProfile.labType} — ${labProfile.tools}`);
      doc.text(`Project Requirement: ${labProfile.projectFocus}`);
      doc.moveDown(0.4);

      const desc = stripHtml(c.summary || c.description).slice(0, 450);
      if (desc) {
        doc.font("Helvetica-Bold").text("Description: ", { continued: true }).font("Helvetica").text(desc);
        doc.moveDown(0.4);
      }

      if (c.modules.length === 0) {
        doc.roundedRect(42, doc.y, 510, 38, 4).fillAndStroke("#FEF2F2", "#FCA5A5");
        doc.fillColor("#991B1B").font("Helvetica-Bold").fontSize(9.5).text(
          "AUDIT FLAG: [Content Missing] [Practical Missing] [Project Missing] [Trainer Review Required] — 0 Modules configured in LMS.",
          50, doc.y + 12, { width: 494 }
        );
        doc.y += 48;
      } else {
        for (const m of c.modules) {
          ensureSpace(65);
          doc.fillColor("#0B2241").font("Helvetica-Bold").fontSize(10.5).text(`Module ${m.sortOrder + 1}: ${m.title} (${m.status})`);
          if (m.description) {
            doc.fillColor("#475569").font("Helvetica").fontSize(8.8).text(stripHtml(m.description).slice(0, 220));
          }
          if (m.lessons.length === 0) {
            doc.fillColor("#B91C1C").font("Helvetica-Oblique").fontSize(8.8).text("  • [Content Missing] No topics/lessons under this module.");
          } else {
            for (const l of m.lessons) {
              ensureSpace(88);
              const th = hasTheory(l);
              const pr = hasPractical(l);
              const flags = [
                th ? "Existing Content" : "Content Missing",
                pr ? "Existing Practical" : "Practical Missing",
                "Project Missing",
                th && pr ? "" : "Trainer Review Required",
              ].filter(Boolean).join(" | ");

              doc.fillColor("#0F172A").font("Helvetica-Bold").fontSize(9.2).text(`  • Topic: ${l.title} (${l.type}, ${l.durationMin}m) — [${flags}]`);
              doc.fillColor("#334155").font("Helvetica").fontSize(8.2);
              doc.text(`      Subtopic: ${l.title} — Core Concepts & Guided Walkthrough`);
              doc.text(`      Learning Objectives: Master ${l.title} concepts and apply them in ${labProfile.labType}.`);
              doc.text(`      Theory to Add: ${th ? "Existing theory present (review for depth)" : `Author conceptual notes, syntax/architecture & examples for ${l.title}.`}`);
              doc.text(`      Step-by-Step Practical: 1) Launch ${labProfile.labType}; 2) Execute task for ${l.title}; 3) Verify output & submit.`);
              doc.text(`      Tools: ${labProfile.tools}`);
              doc.text(`      Expected Output & Real-World App: Verified lab execution applied to industry workflows in ${c.title}.`);
              doc.text(`      Assignment / Project / Assessment: Hands-on assignment + capstone contribution + rubric/MCQ check.`);
            }
          }
          doc.moveDown(0.3);
        }
      }
    });

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  console.log("Generated PDF:", pdfPath);
  console.log("Generated XLSX:", xlsxPath);
  console.log("Generated JSON & CSVs in:", exportDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
