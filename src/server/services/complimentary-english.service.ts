import { Prisma, ContentStatus, LessonType, EnrollmentStatus, FeePaymentStatus, FeeStructureStatus, BatchStatus, DeliveryMode } from "@prisma/client";
import { prisma } from "@/server/db";

export const ENGLISH_COURSE_SLUG = "professional-english-speaking-personality-development";
export const ENGLISH_WEEKLY_BATCH_CODE = "ENG-PD-WEEKLY-2026";
export const PROPOSED_ENGLISH_FEE_PAISE = 1499900; // ₹14,999 proposed standalone fee (editable in Admin Course CMS)

const SIX_MONTH_MODULES = [
  {
    title: "Month 1 — Module 1: English Language Fundamentals",
    description: "Basic grammar, sentence formation, parts of speech, tenses, articles, prepositions, common & daily-use vocabulary.",
    lessons: [
      { title: "Basic Grammar, Parts of Speech & Sentence Formation", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Tenses, Articles & Prepositions Mastery", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Common Vocabulary & Daily-Use English Expressions", type: LessonType.RICH_TEXT, durationMin: 40 },
    ],
  },
  {
    title: "Month 1 — Module 2: Speaking Fundamentals & Practicals",
    description: "Self-introduction, daily conversations, asking/giving answers, pronunciation basics, listening practice.",
    lessons: [
      { title: "Confident Self-Introduction & Daily Conversations", type: LessonType.VIDEO, durationMin: 45 },
      { title: "Asking Questions, Giving Clear Answers & Pronunciation Basics", type: LessonType.RICH_TEXT, durationMin: 40 },
      { title: "Practical: Daily Introduction Recording & Vocabulary Exercise", type: LessonType.ASSIGNMENT, durationMin: 45 },
    ],
  },
  {
    title: "Month 2 — Module 3: Spoken English & Fluency",
    description: "Daily conversation, professional vocabulary, sentence fluency, speaking without hesitation, group discussions.",
    lessons: [
      { title: "Sentence Fluency & Speaking Without Hesitation", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Describing Situations, Expressing Opinions & Group Discussions", type: LessonType.RICH_TEXT, durationMin: 45 },
    ],
  },
  {
    title: "Month 2 — Module 4: Listening & Pronunciation Lab",
    description: "Active listening, accent clarity, word stress, intonation, listening comprehension, speaking confidence.",
    lessons: [
      { title: "Active Listening, Accent Clarity, Word Stress & Intonation", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Practical: Recorded Speaking Session & Conversation Simulation", type: LessonType.ASSIGNMENT, durationMin: 45 },
    ],
  },
  {
    title: "Month 3 — Module 5: Personality Development",
    description: "Self-confidence, self-awareness, positive mindset, emotional intelligence, time management, goal setting.",
    lessons: [
      { title: "Self-Confidence, Self-Awareness & Positive Mindset", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Emotional Intelligence, Time Management & Goal Setting", type: LessonType.RICH_TEXT, durationMin: 45 },
    ],
  },
  {
    title: "Month 3 — Module 6: Body Language & Non-Verbal Mastery",
    description: "Posture, eye contact, facial expressions, gestures, professional appearance, non-verbal communication.",
    lessons: [
      { title: "Posture, Eye Contact, Facial Expressions & Professional Appearance", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Practical: Self-Presentation Recording & Body Language Evaluation", type: LessonType.ASSIGNMENT, durationMin: 45 },
    ],
  },
  {
    title: "Month 4 — Module 7: Workplace Communication",
    description: "Formal & informal communication, email writing, business vocabulary, workplace etiquette, telephone etiquette.",
    lessons: [
      { title: "Formal vs Informal Workplace & Telephone Communication", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Business Email Writing & Corporate Vocabulary", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Practical: Business Email Drafting Assignment", type: LessonType.ASSIGNMENT, durationMin: 40 },
    ],
  },
  {
    title: "Month 4 — Module 8: Presentation & Public Speaking",
    description: "Presentation structure, public speaking, stage confidence, storytelling, speech preparation & delivery.",
    lessons: [
      { title: "Presentation Structure, Storytelling & Stage Confidence", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Practical: Professional Presentation & Public Speaking Recording", type: LessonType.ASSIGNMENT, durationMin: 50 },
    ],
  },
  {
    title: "Month 5 — Module 9: Interview Preparation",
    description: "HR interview questions, technical interview communication, resume discussion, strengths/weaknesses, salary discussion, mock interviews.",
    lessons: [
      { title: "HR & Technical Interview Communication + Resume Walkthrough", type: LessonType.RICH_TEXT, durationMin: 50 },
      { title: "Strengths, Weaknesses, Situational Questions & Salary Discussion", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Practical: Recorded Mock HR Interview & Performance Assessment", type: LessonType.ASSIGNMENT, durationMin: 60 },
    ],
  },
  {
    title: "Month 5 — Module 10: Group Discussion & Corporate Readiness",
    description: "Group discussion techniques, debate, leadership communication, problem-solving communication, corporate etiquette.",
    lessons: [
      { title: "Group Discussion Techniques, Debate & Leadership Communication", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Corporate Etiquette & Problem-Solving Communication", type: LessonType.RICH_TEXT, durationMin: 45 },
    ],
  },
  {
    title: "Month 6 — Module 11: Advanced Professional Communication",
    description: "Business communication, negotiation basics, persuasive communication, conflict resolution, client handling, networking.",
    lessons: [
      { title: "Negotiation, Persuasive Communication & Conflict Resolution", type: LessonType.RICH_TEXT, durationMin: 45 },
      { title: "Client Handling, Leadership & Professional Networking", type: LessonType.RICH_TEXT, durationMin: 45 },
    ],
  },
  {
    title: "Month 6 — Module 12: Final Assessment & Capstone Portfolio",
    description: "Final speaking assessment, professional presentation, mock interview, GD, personality & career-readiness evaluation.",
    lessons: [
      { title: "Capstone Portfolio: Self-Intro, Presentation, Mock Interview & Business Emails", type: LessonType.ASSIGNMENT, durationMin: 90 },
      { title: "Final Career-Readiness Evaluation & Certification Assessment", type: LessonType.QUIZ, durationMin: 60 },
    ],
  },
];

export class ComplimentaryEnglishService {
  static async ensureFlagshipCourse() {
    let course = await prisma.course.findUnique({
      where: { slug: ENGLISH_COURSE_SLUG },
      include: { modules: { include: { lessons: true } }, batches: true },
    });

    if (!course) {
      course = await prisma.course.create({
        data: {
          title: "Professional English Speaking & Personality Development",
          slug: ENGLISH_COURSE_SLUG,
          courseCode: "SLG-ENG-PD-06",
          summary:
            "6-Month flagship communication, spoken English, body language, workplace etiquette, public speaking & interview readiness program — available standalone or 100% complimentary with eligible SoftLab Global admissions.",
          description:
            "A comprehensive 6-month (12-module) career-readiness program designed to build fluent spoken English, executive body language, business email & presentation mastery, group discussion leadership, and HR/technical interview confidence. Included at 100% complimentary discount (₹0 payable) for all eligible SoftLab Global students via weekly supplementary classes.",
          durationWeeks: 26,
          baseFee: PROPOSED_ENGLISH_FEE_PAISE,
          level: "Beginner to Executive",
          language: "English / Bilingual Support",
          eligibility: "Open to all learners, college students & working professionals",
          status: ContentStatus.PUBLISHED,
          providerType: "SOFTLAB",
          providerName: "SoftLab Global",
          programCategory: "COMMUNICATION_CAREER",
          mode: "HYBRID",
          placementInfo: "Includes Mock HR Interviews, GD Practice & Career Readiness Portfolio",
        },
        include: { modules: { include: { lessons: true } }, batches: true },
      });
    }

    if (course.modules.length === 0) {
      for (let mIdx = 0; mIdx < SIX_MONTH_MODULES.length; mIdx++) {
        const modSpec = SIX_MONTH_MODULES[mIdx];
        const mod = await prisma.module.create({
          data: {
            courseId: course.id,
            title: modSpec.title,
            description: modSpec.description,
            sortOrder: mIdx,
            status: ContentStatus.PUBLISHED,
          },
        });
        for (let lIdx = 0; lIdx < modSpec.lessons.length; lIdx++) {
          const lSpec = modSpec.lessons[lIdx];
          const lesson = await prisma.lesson.create({
            data: {
              moduleId: mod.id,
              title: lSpec.title,
              type: lSpec.type,
              durationMin: lSpec.durationMin,
              sortOrder: lIdx,
              status: ContentStatus.PUBLISHED,
            },
          });
          await prisma.lessonContent.create({
            data: {
              lessonId: lesson.id,
              learningObjectives: `Master ${lSpec.title} as part of ${modSpec.title}.`,
              bodyText: `${modSpec.description}\n\nTopic Focus: ${lSpec.title}`,
              practicalInstructions:
                lSpec.type === LessonType.ASSIGNMENT
                  ? `Complete and submit your recorded speaking/writing deliverable for: ${lSpec.title}.`
                  : `Attend the weekly interactive session and practice guided exercises on: ${lSpec.title}.`,
            },
          });
        }
      }
    }

    let weeklyBatch = await prisma.batch.findUnique({
      where: { code: ENGLISH_WEEKLY_BATCH_CODE },
    });
    if (!weeklyBatch) {
      const start = new Date();
      weeklyBatch = await prisma.batch.create({
        data: {
          courseId: course.id,
          code: ENGLISH_WEEKLY_BATCH_CODE,
          name: "Weekly English & Personality Development Cohort (1 Class / Week)",
          startDate: start,
          status: BatchStatus.ONGOING,
          maxCapacity: 500,
          deliveryMode: DeliveryMode.HYBRID,
          location: "SoftLab Global Campus / LiveKit Online Classroom (Saturdays 11:00 AM)",
        },
      });

      // Seed 4 upcoming Saturday weekly classes if none exist
      const existingClasses = await prisma.scheduledClass.count({
        where: { batchId: weeklyBatch.id },
      });
      if (existingClasses === 0) {
        const nextSat = new Date();
        const day = nextSat.getDay();
        const diff = (6 - day + 7) % 7 || 7;
        nextSat.setDate(nextSat.getDate() + diff);
        nextSat.setHours(11, 0, 0, 0);

        for (let w = 0; w < 4; w++) {
          const sTime = new Date(nextSat.getTime() + w * 7 * 24 * 60 * 60 * 1000);
          const eTime = new Date(sTime.getTime() + 90 * 60 * 1000);
          await prisma.scheduledClass.create({
            data: {
              batchId: weeklyBatch.id,
              title: `Weekly English Speaking & Personality Session #${w + 1}`,
              description: "1 class per week supplementary communication & interview readiness session.",
              startTime: sTime,
              endTime: eTime,
              deliveryMode: DeliveryMode.HYBRID,
            },
          });
        }
      }
    }

    return { course, weeklyBatch };
  }

  static async auditEligibility() {
    const { course } = await this.ensureFlagshipCourse();
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        enrollments: {
          where: { status: { in: [EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED] } },
          include: { course: { select: { id: true, title: true, providerType: true } } },
        },
      },
    });

    const report = students.map((s) => {
      const hasEnglish = s.enrollments.some((e) => e.courseId === course.id);
      const eligibleTech = s.enrollments.filter(
        (e) => e.courseId !== course.id && (e.course.providerType || "SOFTLAB") === "SOFTLAB"
      );
      return {
        studentProfileId: s.id,
        studentCode: s.studentId,
        studentName: `${s.user.firstName} ${s.user.lastName ?? ""}`.trim(),
        email: s.user.email,
        eligibleCoursesCount: eligibleTech.length,
        primaryCourse: eligibleTech[0]?.course.title || "None",
        alreadyHasEnglish: hasEnglish,
        eligibleForGrant: eligibleTech.length > 0 && !hasEnglish,
      };
    });

    return {
      courseId: course.id,
      courseTitle: course.title,
      proposedFeeINR: course.baseFee / 100,
      totalStudents: report.length,
      eligibleForGrant: report.filter((r) => r.eligibleForGrant).length,
      alreadyEnrolled: report.filter((r) => r.alreadyHasEnglish).length,
      students: report,
    };
  }

  static async grantComplimentaryInTx(
    tx: Prisma.TransactionClient,
    params: {
      studentProfileId: string;
      studentUserId: string;
      courseId: string;
      courseBaseFee: number;
      batchId: string | null;
      sourceAdmissionId?: string | null;
      reason: string;
      actorId?: string | null;
    }
  ): Promise<{ granted: boolean; enrollmentId?: string }> {
    const existing = await tx.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: params.studentProfileId,
          courseId: params.courseId,
        },
      },
    });

    if (existing) {
      return { granted: false, enrollmentId: existing.id };
    }

    const enrollment = await tx.enrollment.create({
      data: {
        studentId: params.studentProfileId,
        courseId: params.courseId,
        batchId: params.batchId,
        status: EnrollmentStatus.ACTIVE,
        enrollmentType: "COMPLIMENTARY",
        sourceAdmissionId: params.sourceAdmissionId || null,
        complimentaryReason: params.reason,
      },
    });

    // Zero-payable 100% non-cash waiver FeeStructure (NEVER creates PaymentTransaction or revenue!)
    await tx.feeStructure.create({
      data: {
        studentId: params.studentProfileId,
        enrollmentId: enrollment.id,
        courseId: params.courseId,
        batchId: params.batchId,
        totalCourseFee: params.courseBaseFee,
        registrationFee: 0,
        discountAmount: params.courseBaseFee,
        scholarshipAmount: 0,
        netPayableAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        paymentStatus: FeePaymentStatus.WAIVED,
        status: FeeStructureStatus.ACTIVE,
        isComplimentary: true,
        waiverType: "COMPLIMENTARY_100_PERCENT",
        waiverReason: params.reason,
        nonCashWaiverAmount: params.courseBaseFee,
        remarks: "100% Complimentary Benefit (Non-Cash Waiver — ₹0 Payable)",
        createdById: params.actorId || null,
      },
    });

    await tx.notification.create({
      data: {
        userId: params.studentUserId,
        title: "Complimentary Course Unlocked: Professional English & Personality Development",
        message:
          "You have received complimentary access (100% Discount — ₹0 Payable) to our 6-Month Professional English Speaking & Personality Development program (1 class/week).",
        type: "ACADEMIC",
        linkUrl: "/student/courses",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: params.actorId || params.studentUserId,
        action: "COMPLIMENTARY_ENGLISH_ENROLLED",
        entityType: "Enrollment",
        entityId: enrollment.id,
        newData: {
          studentProfileId: params.studentProfileId,
          sourceAdmissionId: params.sourceAdmissionId,
          waiverAmountPaise: params.courseBaseFee,
          netPayablePaise: 0,
        },
      },
    });

    return { granted: true, enrollmentId: enrollment.id };
  }

  static async migrateExistingEligibleStudents(actorId?: string) {
    const { course, weeklyBatch } = await this.ensureFlagshipCourse();
    const audit = await this.auditEligibility();
    let newlyGranted = 0;
    let alreadyEnrolled = 0;

    for (const st of audit.students) {
      if (!st.eligibleForGrant) {
        if (st.alreadyHasEnglish) alreadyEnrolled++;
        continue;
      }
      const profile = await prisma.studentProfile.findUnique({
        where: { id: st.studentProfileId },
        select: { userId: true },
      });
      if (!profile) continue;

      const res = await prisma.$transaction((tx) =>
        this.grantComplimentaryInTx(tx, {
          studentProfileId: st.studentProfileId,
          studentUserId: profile.userId,
          courseId: course.id,
          courseBaseFee: course.baseFee,
          batchId: weeklyBatch.id,
          reason: `Complimentary benefit with ${st.primaryCourse}`,
          actorId,
        })
      );
      if (res.granted) newlyGranted++;
    }

    return {
      courseId: course.id,
      courseTitle: course.title,
      totalStudentsScanned: audit.totalStudents,
      newlyGranted,
      alreadyEnrolled,
    };
  }
}
