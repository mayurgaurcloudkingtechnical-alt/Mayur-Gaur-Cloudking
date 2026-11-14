import { db } from "../src/server/db/client";
import { INITIAL_SKILLVERSE_COURSES } from "../src/lib/constants/skillverse-data";
import { ContentStatus, BatchStatus, DeliveryMode, LessonType } from "@prisma/client";

async function main() {
  console.log("=== SEEDING 45-DAY BOARD EXAM POWER PREPARATION (COMMERCE & SCIENCE) ===");

  // 1. Sync Skillverse Dynamic Catalog in system_settings
  const setting = await db.systemSetting.findUnique({
    where: { key: "SKILLVERSE_CATALOG_COURSES_V1" },
  });

  let catalogCourses = Array.isArray(setting?.value)
    ? [...(setting.value as any[])]
    : [...INITIAL_SKILLVERSE_COURSES];

  const commerceCourse = INITIAL_SKILLVERSE_COURSES.find((c) => c.slug === "45-day-board-exam-commerce");
  const scienceCourse = INITIAL_SKILLVERSE_COURSES.find((c) => c.slug === "45-day-board-exam-science");

  if (!commerceCourse || !scienceCourse) {
    throw new Error("45-day courses not found in INITIAL_SKILLVERSE_COURSES constants!");
  }

  // Update or insert Commerce
  const commIdx = catalogCourses.findIndex((c) => c.slug === "45-day-board-exam-commerce");
  if (commIdx >= 0) {
    catalogCourses[commIdx] = commerceCourse;
    console.log("Updated Commerce course in Skillverse catalog.");
  } else {
    catalogCourses.push(commerceCourse);
    console.log("Appended Commerce course to Skillverse catalog.");
  }

  // Update or insert Science
  const sciIdx = catalogCourses.findIndex((c) => c.slug === "45-day-board-exam-science");
  if (sciIdx >= 0) {
    catalogCourses[sciIdx] = scienceCourse;
    console.log("Updated Science course in Skillverse catalog.");
  } else {
    catalogCourses.push(scienceCourse);
    console.log("Appended Science course to Skillverse catalog.");
  }

  await db.systemSetting.upsert({
    where: { key: "SKILLVERSE_CATALOG_COURSES_V1" },
    update: { value: catalogCourses as any, updatedBy: "45-Day Power Prep Syncer" },
    create: {
      key: "SKILLVERSE_CATALOG_COURSES_V1",
      category: "SKILLVERSE_CONFIG",
      value: catalogCourses as any,
      isSecret: false,
      updatedBy: "45-Day Power Prep Syncer",
    },
  });
  console.log("Synced system_settings catalog courses. Total:", catalogCourses.length);

  // 1b. Align SKILLVERSE_CMS_SETTINGS_V1 contact phone numbers
  const cmsSetting = await db.systemSetting.findUnique({
    where: { key: "SKILLVERSE_CMS_SETTINGS_V1" },
  });
  if (cmsSetting && cmsSetting.value && typeof cmsSetting.value === "object") {
    const cmsVal = { ...(cmsSetting.value as Record<string, any>) };
    cmsVal.contactPhone = "+91 91965 96975";
    cmsVal.counselorPhone = "+91 91965 96979";
    cmsVal.contactWhatsapp = "+91 91965 96975";
    await db.systemSetting.update({
      where: { key: "SKILLVERSE_CMS_SETTINGS_V1" },
      data: { value: cmsVal as any, updatedBy: "Phone Alignment Syncer" },
    });
    console.log("Aligned SKILLVERSE_CMS_SETTINGS_V1 in system_settings to +91 91965 96975 / 96979");
  }

  // 2. Upsert Commerce Course in Prisma Course table
  const dbCommerce = await db.course.upsert({
    where: { slug: "45-day-board-exam-commerce" },
    update: {
      title: commerceCourse.title,
      summary: commerceCourse.shortSummary,
      description: commerceCourse.description,
      durationWeeks: 6, // 45 days
      baseFee: 450000, // ₹4,500 in paise
      level: "Class 12 Board Prep",
      language: "English / Hindi",
      eligibility: "Class 12 Commerce students appearing for Board Examinations (CBSE, ISC, State Boards)",
      status: ContentStatus.PUBLISHED,
      providerType: "SKILLVERSE",
      providerName: "SKILLVERSE — Powered by SoftLab Global",
      branch: "Civil Lines, Prayagraj",
      programCategory: "PROFESSIONAL",
      sortOrder: 2,
    },
    create: {
      title: commerceCourse.title,
      slug: commerceCourse.slug,
      summary: commerceCourse.shortSummary,
      description: commerceCourse.description,
      durationWeeks: 6,
      baseFee: 450000,
      level: "Class 12 Board Prep",
      language: "English / Hindi",
      eligibility: "Class 12 Commerce students appearing for Board Examinations (CBSE, ISC, State Boards)",
      status: ContentStatus.PUBLISHED,
      providerType: "SKILLVERSE",
      providerName: "SKILLVERSE — Powered by SoftLab Global",
      branch: "Civil Lines, Prayagraj",
      programCategory: "PROFESSIONAL",
      sortOrder: 2,
    },
  });
  console.log(`Prisma Commerce Course ID: ${dbCommerce.id}`);

  // Upsert Commerce Modules & Lessons
  for (let mIdx = 0; mIdx < commerceCourse.modules.length; mIdx++) {
    const mod = commerceCourse.modules[mIdx];
    let modRec = await db.module.findFirst({
      where: { courseId: dbCommerce.id, sortOrder: mIdx + 1 },
    });
    if (!modRec) {
      modRec = await db.module.create({
        data: {
          courseId: dbCommerce.id,
          title: mod.title,
          sortOrder: mIdx + 1,
          status: ContentStatus.PUBLISHED,
        },
      });
    } else {
      await db.module.update({
        where: { id: modRec.id },
        update: { title: mod.title, status: ContentStatus.PUBLISHED },
      });
    }

    for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
      const lessonTitle = mod.lessons[lIdx];
      const existingLesson = await db.lesson.findFirst({
        where: { moduleId: modRec.id, sortOrder: lIdx + 1 },
      });
      if (!existingLesson) {
        await db.lesson.create({
          data: {
            moduleId: modRec.id,
            title: lessonTitle,
            type: LessonType.RICH_TEXT,
            durationMin: 60,
            sortOrder: lIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      } else {
        await db.lesson.update({
          where: { id: existingLesson.id },
          update: { title: lessonTitle, status: ContentStatus.PUBLISHED },
        });
      }
    }
  }

  // 3. Upsert Science Course in Prisma Course table
  const dbScience = await db.course.upsert({
    where: { slug: "45-day-board-exam-science" },
    update: {
      title: scienceCourse.title,
      summary: scienceCourse.shortSummary,
      description: scienceCourse.description,
      durationWeeks: 6, // 45 days
      baseFee: 510000, // ₹5,100 in paise
      level: "Class 12 Board Prep",
      language: "English / Hindi",
      eligibility: "Class 12 Science students (PCM, PCB, or PCMB) appearing for Board Examinations",
      status: ContentStatus.PUBLISHED,
      providerType: "SKILLVERSE",
      providerName: "SKILLVERSE — Powered by SoftLab Global",
      branch: "Civil Lines, Prayagraj",
      programCategory: "PROFESSIONAL",
      sortOrder: 3,
    },
    create: {
      title: scienceCourse.title,
      slug: scienceCourse.slug,
      summary: scienceCourse.shortSummary,
      description: scienceCourse.description,
      durationWeeks: 6,
      baseFee: 510000,
      level: "Class 12 Board Prep",
      language: "English / Hindi",
      eligibility: "Class 12 Science students (PCM, PCB, or PCMB) appearing for Board Examinations",
      status: ContentStatus.PUBLISHED,
      providerType: "SKILLVERSE",
      providerName: "SKILLVERSE — Powered by SoftLab Global",
      branch: "Civil Lines, Prayagraj",
      programCategory: "PROFESSIONAL",
      sortOrder: 3,
    },
  });
  console.log(`Prisma Science Course ID: ${dbScience.id}`);

  // Upsert Science Modules & Lessons
  for (let mIdx = 0; mIdx < scienceCourse.modules.length; mIdx++) {
    const mod = scienceCourse.modules[mIdx];
    let modRec = await db.module.findFirst({
      where: { courseId: dbScience.id, sortOrder: mIdx + 1 },
    });
    if (!modRec) {
      modRec = await db.module.create({
        data: {
          courseId: dbScience.id,
          title: mod.title,
          sortOrder: mIdx + 1,
          status: ContentStatus.PUBLISHED,
        },
      });
    } else {
      await db.module.update({
        where: { id: modRec.id },
        update: { title: mod.title, status: ContentStatus.PUBLISHED },
      });
    }

    for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
      const lessonTitle = mod.lessons[lIdx];
      const existingLesson = await db.lesson.findFirst({
        where: { moduleId: modRec.id, sortOrder: lIdx + 1 },
      });
      if (!existingLesson) {
        await db.lesson.create({
          data: {
            moduleId: modRec.id,
            title: lessonTitle,
            type: LessonType.RICH_TEXT,
            durationMin: 60,
            sortOrder: lIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      } else {
        await db.lesson.update({
          where: { id: existingLesson.id },
          update: { title: lessonTitle, status: ContentStatus.PUBLISHED },
        });
      }
    }
  }

  // 4. Upsert Batches for Commerce & Science
  const batchCommerce = await db.batch.upsert({
    where: { code: "BATCH-BOARD-COMMERCE-45" },
    update: {
      courseId: dbCommerce.id,
      name: "Class 12 Commerce — 45-Day Power Prep Batch",
      status: BatchStatus.ONGOING,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Skillverse Academic Wing, Civil Lines, Prayagraj / In-House Live Studio",
    },
    create: {
      courseId: dbCommerce.id,
      code: "BATCH-BOARD-COMMERCE-45",
      name: "Class 12 Commerce — 45-Day Power Prep Batch",
      startDate: new Date("2026-11-20T10:30:00.000Z"),
      endDate: new Date("2027-01-05T18:00:00.000Z"),
      status: BatchStatus.ONGOING,
      maxCapacity: 35,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Skillverse Academic Wing, Civil Lines, Prayagraj / In-House Live Studio",
    },
  });
  console.log(`Commerce Batch ID: ${batchCommerce.id} (${batchCommerce.code})`);

  const batchScience = await db.batch.upsert({
    where: { code: "BATCH-BOARD-SCIENCE-45" },
    update: {
      courseId: dbScience.id,
      name: "Class 12 Science — 45-Day Power Prep Batch",
      status: BatchStatus.ONGOING,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Skillverse Academic Wing, Civil Lines, Prayagraj / In-House Live Studio",
    },
    create: {
      courseId: dbScience.id,
      code: "BATCH-BOARD-SCIENCE-45",
      name: "Class 12 Science — 45-Day Power Prep Batch",
      startDate: new Date("2026-11-20T11:00:00.000Z"),
      endDate: new Date("2027-01-05T18:00:00.000Z"),
      status: BatchStatus.ONGOING,
      maxCapacity: 35,
      deliveryMode: DeliveryMode.HYBRID,
      location: "Skillverse Academic Wing, Civil Lines, Prayagraj / In-House Live Studio",
    },
  });
  console.log(`Science Batch ID: ${batchScience.id} (${batchScience.code})`);

  console.log("=== 45-DAY BOARD EXAM POWER PREPARATION SEEDING COMPLETE ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FATAL SEED ERROR:", err);
    process.exit(1);
  });
