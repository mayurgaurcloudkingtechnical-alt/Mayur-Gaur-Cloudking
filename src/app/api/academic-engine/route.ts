import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import ExcelJS from "exceljs";
import { db } from "@/server/db/client";
import {
  AcademicContentEngineService,
  computeProjectAllocation,
} from "@/server/services/academic-content-engine.service";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"];

async function getAdminAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub) return { error: "Unauthorized", status: 401 as const, token: null };
  if (!ADMIN_ROLES.includes(String(token.roleCode || ""))) {
    return { error: "Forbidden", status: 403 as const, token: null };
  }
  return { error: null, status: 200 as const, token };
}

export async function GET(req: NextRequest) {
  const auth = await getAdminAuth(req);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const exportFmt = (req.nextUrl.searchParams.get("export") || "").toLowerCase();

  const [courses, labs, projects, sources, rubrics, correctionQueue, recentLogs] = await Promise.all([
    db.course.findMany({
      where: { providerType: "SOFTLAB", deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
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
        _count: { select: { exams: true, questionBank: true, enrollments: true } },
      },
    }),
    db.practicalLab.findMany({ orderBy: { createdAt: "desc" } }),
    db.courseProjectPlan.findMany({ orderBy: [{ courseId: "asc" }, { semester: "asc" }, { sortOrder: "asc" }] }),
    db.academicSourceRegistry.findMany({ orderBy: { name: "asc" } }),
    db.projectEvaluationRubric.findMany({ orderBy: { category: "asc" } }),
    db.academicGenerationLog.findMany({ where: { status: "PENDING_REVIEW" }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.academicGenerationLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  if (exportFmt === "xlsx") {
    const wb = new ExcelJS.Workbook();
    wb.creator = "SoftLab Global AI Academic Content Engine";

    // 1. Course Master
    const s1 = wb.addWorksheet("Course Master");
    s1.columns = [
      { header: "Course ID", key: "id", width: 26 },
      { header: "Course Code", key: "code", width: 16 },
      { header: "Title", key: "title", width: 42 },
      { header: "Slug", key: "slug", width: 32 },
      { header: "Duration (Weeks)", key: "durationWeeks", width: 16 },
      { header: "Level", key: "level", width: 20 },
      { header: "Status", key: "status", width: 14 },
      { header: "Provider", key: "providerType", width: 12 },
    ];
    s1.getRow(1).font = { bold: true };
    courses.forEach((c) =>
      s1.addRow({
        id: c.id,
        code: c.courseCode || "-",
        title: c.title,
        slug: c.slug,
        durationWeeks: c.durationWeeks,
        level: c.level || "Beginner to Advanced",
        status: c.status,
        providerType: c.providerType,
      })
    );

    // 2. Module Master
    const s2 = wb.addWorksheet("Module Master");
    s2.columns = [
      { header: "Module ID", key: "id", width: 26 },
      { header: "Course ID", key: "courseId", width: 26 },
      { header: "Course Title", key: "courseTitle", width: 36 },
      { header: "Module Title", key: "title", width: 42 },
      { header: "Sort Order", key: "sortOrder", width: 12 },
      { header: "Status", key: "status", width: 14 },
    ];
    s2.getRow(1).font = { bold: true };
    courses.forEach((c) =>
      c.modules.forEach((m) =>
        s2.addRow({ id: m.id, courseId: c.id, courseTitle: c.title, title: m.title, sortOrder: m.sortOrder, status: m.status })
      )
    );

    // 3. Topic Master & 4. Subtopic Master & 5. Theory Content & 8. Assignments
    const s3 = wb.addWorksheet("Topic Master");
    s3.columns = [
      { header: "Lesson ID", key: "id", width: 26 },
      { header: "Course ID", key: "courseId", width: 26 },
      { header: "Module ID", key: "moduleId", width: 26 },
      { header: "Topic Title", key: "title", width: 42 },
      { header: "Type", key: "type", width: 14 },
      { header: "Duration (Min)", key: "durationMin", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];
    s3.getRow(1).font = { bold: true };

    const s4 = wb.addWorksheet("Subtopic Master");
    s4.columns = [
      { header: "Lesson ID", key: "lessonId", width: 26 },
      { header: "Topic Title", key: "title", width: 38 },
      { header: "Learning Objectives", key: "objectives", width: 50 },
      { header: "Required Tools", key: "tools", width: 32 },
    ];
    s4.getRow(1).font = { bold: true };

    const s5 = wb.addWorksheet("Theory Content");
    s5.columns = [
      { header: "Lesson ID", key: "lessonId", width: 26 },
      { header: "Topic Title", key: "title", width: 38 },
      { header: "Has Theory", key: "hasTheory", width: 12 },
      { header: "Theory Excerpt", key: "excerpt", width: 64 },
    ];
    s5.getRow(1).font = { bold: true };

    const s8 = wb.addWorksheet("Assignments");
    s8.columns = [
      { header: "Lesson ID", key: "lessonId", width: 26 },
      { header: "Course Title", key: "courseTitle", width: 36 },
      { header: "Topic Title", key: "title", width: 36 },
      { header: "Assignment Prompt", key: "prompt", width: 64 },
    ];
    s8.getRow(1).font = { bold: true };

    courses.forEach((c) =>
      c.modules.forEach((m) =>
        m.lessons.forEach((l) => {
          s3.addRow({ id: l.id, courseId: c.id, moduleId: m.id, title: l.title, type: l.type, durationMin: l.durationMin, status: l.status });
          s4.addRow({
            lessonId: l.id,
            title: l.title,
            objectives: l.contentDetails?.learningObjectives || "",
            tools: l.contentDetails?.requiredTools || "",
          });
          s5.addRow({
            lessonId: l.id,
            title: l.title,
            hasTheory: Boolean(l.contentDetails?.bodyHtml && l.contentDetails.bodyHtml.length > 100) ? "YES" : "NO",
            excerpt: (l.contentDetails?.bodyText || "").slice(0, 300),
          });
          s8.addRow({
            lessonId: l.id,
            courseTitle: c.title,
            title: l.title,
            prompt: l.contentDetails?.assignmentPrompt || "",
          });
        })
      )
    );

    // 6. Practical Labs
    const s6 = wb.addWorksheet("Practical Labs");
    s6.columns = [
      { header: "Lab ID", key: "id", width: 26 },
      { header: "Course ID", key: "courseId", width: 26 },
      { header: "Lesson ID", key: "lessonId", width: 26 },
      { header: "Lab Title", key: "title", width: 42 },
      { header: "Lab Type", key: "labType", width: 18 },
      { header: "Language", key: "language", width: 14 },
      { header: "Status", key: "status", width: 14 },
    ];
    s6.getRow(1).font = { bold: true };
    labs.forEach((lab) => s6.addRow(lab));

    // 7. Projects (with semester, type, topic mapping, objectives, milestones, deliverables, rubric)
    const s7 = wb.addWorksheet("Projects");
    s7.columns = [
      { header: "Project ID", key: "id", width: 26 },
      { header: "Course ID", key: "courseId", width: 26 },
      { header: "Semester", key: "semester", width: 10 },
      { header: "Project Type", key: "projectType", width: 12 },
      { header: "Project Title", key: "title", width: 46 },
      { header: "Covered Topics", key: "coveredTopics", width: 46 },
      { header: "Objectives", key: "objectives", width: 48 },
      { header: "Deliverables", key: "deliverables", width: 40 },
      { header: "Status", key: "status", width: 14 },
    ];
    s7.getRow(1).font = { bold: true };
    projects.forEach((p) =>
      s7.addRow({
        id: p.id,
        courseId: p.courseId,
        semester: p.semester,
        projectType: p.projectType,
        title: p.title,
        coveredTopics: p.coveredTopicTitles.join("; "),
        objectives: p.objectives,
        deliverables: Array.isArray(p.deliverablesJson) ? (p.deliverablesJson as string[]).join("; ") : "",
        status: p.status,
      })
    );

    // 9. Assessments
    const exams = await db.exam.findMany({ include: { _count: { select: { questions: true } } } });
    const s9 = wb.addWorksheet("Assessments");
    s9.columns = [
      { header: "Exam ID", key: "id", width: 26 },
      { header: "Course ID", key: "courseId", width: 26 },
      { header: "Title", key: "title", width: 42 },
      { header: "Type", key: "type", width: 16 },
      { header: "Questions", key: "qCount", width: 12 },
      { header: "Total Marks", key: "totalMarks", width: 12 },
      { header: "Status", key: "status", width: 14 },
    ];
    s9.getRow(1).font = { bold: true };
    exams.forEach((e) =>
      s9.addRow({
        id: e.id,
        courseId: e.courseId,
        title: e.title,
        type: e.type,
        qCount: e._count.questions,
        totalMarks: e.totalMarks,
        status: e.status,
      })
    );

    // 10. Content Status
    const s10 = wb.addWorksheet("Content Status");
    s10.columns = [
      { header: "Course ID", key: "id", width: 26 },
      { header: "Course Title", key: "title", width: 40 },
      { header: "Duration (Wks)", key: "durationWeeks", width: 14 },
      { header: "Modules", key: "modules", width: 10 },
      { header: "Lessons", key: "lessons", width: 10 },
      { header: "Theory Done", key: "theory", width: 12 },
      { header: "Labs", key: "labs", width: 10 },
      { header: "Projects", key: "projects", width: 10 },
      { header: "MCQs", key: "mcqs", width: 10 },
      { header: "Completion %", key: "pct", width: 14 },
    ];
    s10.getRow(1).font = { bold: true };
    courses.forEach((c) => {
      const totalL = c.modules.reduce((a, m) => a + m.lessons.length, 0);
      const theoryL = c.modules.reduce(
        (a, m) => a + m.lessons.filter((l) => Boolean(l.contentDetails?.bodyHtml && l.contentDetails.bodyHtml.length > 200)).length,
        0
      );
      const cLabs = labs.filter((lb) => lb.courseId === c.id).length;
      const cProj = projects.filter((pr) => pr.courseId === c.id).length;
      const pct = totalL > 0 ? Math.round((theoryL / totalL) * 100) : 0;
      s10.addRow({
        id: c.id,
        title: c.title,
        durationWeeks: c.durationWeeks,
        modules: c.modules.length,
        lessons: totalL,
        theory: theoryL,
        labs: cLabs,
        projects: cProj,
        mcqs: c._count.questionBank,
        pct,
      });
    });

    // 11. Bulk LMS Import Template
    const s11 = wb.addWorksheet("Bulk LMS Import Template");
    s11.columns = [
      { header: "courseSlug", key: "courseSlug", width: 28 },
      { header: "moduleTitle", key: "moduleTitle", width: 32 },
      { header: "topicTitle", key: "topicTitle", width: 32 },
      { header: "learningObjectives", key: "learningObjectives", width: 40 },
      { header: "practicalInstructions", key: "practicalInstructions", width: 40 },
      { header: "expectedOutput", key: "expectedOutput", width: 32 },
    ];
    s11.getRow(1).font = { bold: true };

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="SoftLab_Global_Course_Content_Master_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  const courseRows = courses.map((c) => {
    const lessons = c.modules.flatMap((m) => m.lessons);
    const withTheory = lessons.filter((l) => Boolean(l.contentDetails?.bodyHtml && l.contentDetails.bodyHtml.length > 200)).length;
    const withPractical = lessons.filter((l) => Boolean(l.contentDetails?.practicalInstructions)).length;
    const cLabs = labs.filter((lb) => lb.courseId === c.id).length;
    const cProjects = projects.filter((pr) => pr.courseId === c.id);
    const completionPercent = lessons.length > 0 ? Math.round((withTheory / lessons.length) * 100) : 0;
    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      durationWeeks: c.durationWeeks,
      status: c.status,
      modulesCount: c.modules.length,
      lessonsCount: lessons.length,
      withTheory,
      withPractical,
      labsCount: cLabs,
      projectsCount: cProjects.length,
      minorProjects: cProjects.filter((p) => p.projectType === "MINOR").length,
      majorProjects: cProjects.filter((p) => p.projectType === "MAJOR").length,
      mcqsCount: c._count.questionBank,
      examsCount: c._count.exams,
      enrollmentsCount: c._count.enrollments,
      completionPercent,
      projectAllocation: computeProjectAllocation(c.durationWeeks),
    };
  });

  return NextResponse.json({
    summary: {
      totalSoftlabCourses: courseRows.length,
      totalModules: courseRows.reduce((a, c) => a + c.modulesCount, 0),
      totalLessons: courseRows.reduce((a, c) => a + c.lessonsCount, 0),
      theoryCompleted: courseRows.reduce((a, c) => a + c.withTheory, 0),
      labsGenerated: labs.length,
      projectsGenerated: projects.length,
      mcqsGenerated: courseRows.reduce((a, c) => a + c.mcqsCount, 0),
      examsGenerated: courseRows.reduce((a, c) => a + c.examsCount, 0),
      coursesMissingContent: courseRows.filter((c) => c.completionPercent < 100).length,
      correctionQueueCount: correctionQueue.length,
      lastGenerationAt: recentLogs[0]?.createdAt || null,
    },
    courses: courseRows,
    sources,
    rubrics,
    correctionQueue,
    recentLogs,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAdminAuth(req);
  if (auth.error || !auth.token) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const action = String(body.action || "").toUpperCase();

  if (action === "SEED_SOURCES_AND_RUBRICS") {
    const sources = await AcademicContentEngineService.seedCommonAcademicSources();
    const rubrics = await AcademicContentEngineService.seedDefaultRubrics();
    return NextResponse.json({ success: true, sourcesCount: sources.length, rubricsSeeded: rubrics.length });
  }

  if (action === "GENERATE_COURSE") {
    const courseId = String(body.courseId || "");
    if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
    const result = await AcademicContentEngineService.enrichAndPublishCourse(courseId, String(auth.token.sub));
    return NextResponse.json({ success: true, result });
  }

  if (action === "ROLLBACK") {
    const versionId = String(body.versionId || "");
    if (!versionId) return NextResponse.json({ error: "versionId required" }, { status: 400 });
    const result = await AcademicContentEngineService.rollbackLessonToVersion(versionId, String(auth.token.sub));
    return NextResponse.json({ success: true, result });
  }

  if (action === "UPDATE_RUBRIC") {
    const category = String(body.category || "");
    if (!category || !Array.isArray(body.criteriaJson)) {
      return NextResponse.json({ error: "category and criteriaJson required" }, { status: 400 });
    }
    const updated = await db.projectEvaluationRubric.upsert({
      where: { category },
      update: { criteriaJson: body.criteriaJson },
      create: { category, criteriaJson: body.criteriaJson },
    });
    return NextResponse.json({ success: true, rubric: updated });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
