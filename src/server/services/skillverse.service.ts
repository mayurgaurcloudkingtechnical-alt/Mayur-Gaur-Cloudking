import { db } from "@/server/db/client";
import crypto from "crypto";
import {
  SKILLVERSE_BRAND,
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_ACADEMIC_PACKAGES,
  INITIAL_COMPETITIVE_ADDONS,
  INITIAL_SKILLVERSE_FEE_RULES,
  INITIAL_SKILLVERSE_FAQS,
  INITIAL_SKILLVERSE_BLOGS,
  INITIAL_DIAGNOSTIC_QUESTIONS,
  type SkillverseCourseItem,
  type SkillverseAcademicPackage,
  type SkillverseCompetitiveAddon,
  type SkillverseFeeRuleConfig,
} from "@/lib/constants/skillverse-data";

export type SkillverseAdmissionStage =
  | "ENQUIRY"
  | "FOLLOW_UP"
  | "DEMO_BOOKING"
  | "ASSESSMENT"
  | "COUNSELING"
  | "APPLICATION"
  | "PARENT_CONSENT"
  | "FEE_PAYMENT"
  | "ENROLLMENT"
  | "BATCH_ALLOCATION"
  | "ACTIVE_STUDENT";

export interface SkillverseEnquiryRecord {
  id: string;
  referenceNumber: string; // e.g., SV-ADM-2026-1001
  applicationNumber?: string; // e.g., SV-APP-2026-1001
  stage: SkillverseAdmissionStage;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  currentClass: string; // Class 8..12
  board: string;
  schoolName?: string;
  preferredCourseSlug: string;
  preferredPackageId?: string;
  competitiveAddonId?: string;
  preferredBatchTiming: string;
  deliveryMode: "ONLINE" | "OFFLINE" | "HYBRID";
  city: string;
  locality: string;
  enquirySource: string;
  campaign?: string;
  parentConsentAccepted: boolean;
  parentConsentTimestamp: string;
  assignedCounselor?: string;
  followUpDate?: string;
  followUpNotes?: string;
  followUpHistory?: {
    timestamp: string;
    note: string;
    actorName: string;
    stage?: string;
    nextFollowUpDate?: string;
  }[];
  demoScheduledAt?: string;
  assessmentScore?: number;
  assessmentMaxScore?: number;
  allocatedBatchCode?: string;
  enrolledStudentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkillverseStudentProfileRecord {
  id: string;
  enrollmentCode: string; // e.g., SV-STU-2026-001
  studentName: string;
  currentClass: string;
  board: string;
  schoolName: string;
  studentEmail: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  parentAccessPinHash: string; // Server-side verified link token for parent portal isolation
  enrolledPackageId?: string;
  enrolledCourseSlugs: string[];
  competitiveAddonIds: string[];
  batchCode: string;
  deliveryMode: "ONLINE" | "OFFLINE" | "HYBRID";
  attendancePercent: number;
  attendanceRecords: {
    date: string;
    subject: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    markedBy: string;
  }[];
  assignments: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    status: "PENDING" | "SUBMITTED" | "EVALUATED";
    score?: string;
    teacherFeedback?: string;
  }[];
  assessmentScores: {
    attemptId?: string;
    testTitle: string;
    subject: string;
    date: string;
    marksObtained: number;
    maxMarks: number;
    status?: "COMPLETED" | "PENDING_TEACHER_REVIEW" | "EVALUATED";
    teacherRemark?: string;
  }[];
  communicationPreferences?: {
    whatsappAlerts: boolean;
    emailReports: boolean;
    smsAttendanceAlerts: boolean;
    preferredLanguage: "ENGLISH" | "HINDI_ENGLISH";
    updatedAt: string;
  };
  ptmSchedules: {
    id: string;
    scheduledDate: string;
    teacherName: string;
    agenda: string;
    status: "SCHEDULED" | "COMPLETED";
  }[];
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED";
  createdAt: string;
}

export interface SkillverseQuizAttemptRecord {
  attemptId: string;
  enrollmentCode?: string;
  studentName?: string;
  quizTitle: string;
  autoAwardedMarks: number;
  descriptiveAwardedMarks: number;
  totalAwardedMarks: number;
  totalMaxMarks: number;
  hasDescriptivePending: boolean;
  overallStatus: "COMPLETED" | "PENDING_TEACHER_REVIEW" | "EVALUATED";
  teacherFeedback?: string;
  evaluatedBy?: string;
  evaluatedAt?: string;
  itemResults: {
    questionId: string;
    type: "MCQ" | "MSQ" | "DESCRIPTIVE";
    prompt?: string;
    awardedMarks: number;
    maxMarks: number;
    descriptiveAnswer?: string;
    status: "AUTO_EVALUATED" | "PENDING_TEACHER_EVALUATION" | "TEACHER_EVALUATED";
  }[];
  submittedAt: string;
}

export interface SkillverseInvoiceRecord {
  id: string;
  invoiceNumber: string; // e.g., SV-INV-2026-1001
  studentId?: string;
  enquiryId?: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  packageTitle?: string;
  packageMonthlyAmountInr: number;
  addonTitle?: string;
  addonMonthlyAmountInr: number;
  standaloneCourseTitle?: string;
  standaloneAmountInr: number;
  admissionFeeInr: number;
  learningKitFeeInr: number;
  discountInr: number;
  taxAmountInr: number;
  totalPayableInr: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  receiptNumber?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface SkillverseCertificateRecord {
  id: string;
  certificateNumber: string; // e.g., SLG-SV-CERT-2026-1001
  studentId: string;
  studentName: string;
  classGrade: string;
  courseTitle: string;
  completionDate: string;
  issueDate: string;
  authorizedIssuer: string;
  status: "ISSUED" | "REVOKED";
  revocationReason?: string;
}

export interface SkillverseBatchRecord {
  id: string;
  batchCode: string;
  title: string;
  gradeBand: string;
  courseSlug: string;
  teacherName: string;
  schedule: string;
  deliveryMode: "ONLINE" | "OFFLINE" | "HYBRID";
  capacity: number;
  enrolledCount: number;
  status: "OPEN" | "ONGOING" | "COMPLETED";
}

export interface SkillverseCmsSettings {
  heroHeadline: string;
  heroSubheadline: string;
  announcementBanner: string;
  contactAddress: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  supportHours: string;
  seoTitle: string;
  seoDescription: string;
}

const KEYS = {
  COURSES: "SKILLVERSE_CATALOG_COURSES_V1",
  PACKAGES: "SKILLVERSE_CATALOG_PACKAGES_V1",
  ADDONS: "SKILLVERSE_CATALOG_ADDONS_V1",
  FEE_RULES: "SKILLVERSE_FEE_RULES_V1",
  CMS: "SKILLVERSE_CMS_SETTINGS_V1",
  FAQS: "SKILLVERSE_FAQS_V1",
  BLOGS: "SKILLVERSE_BLOGS_V1",
  BATCHES: "SKILLVERSE_BATCHES_V1",
} as const;

const CATEGORIES = {
  CONFIG: "SKILLVERSE_CONFIG",
  ENQUIRY: "SKILLVERSE_ENQUIRY",
  STUDENT: "SKILLVERSE_STUDENT",
  INVOICE: "SKILLVERSE_INVOICE",
  CERTIFICATE: "SKILLVERSE_CERTIFICATE",
  ASSESSMENT: "SKILLVERSE_ASSESSMENT",
  QUIZ_ATTEMPT: "SKILLVERSE_QUIZ_ATTEMPT",
  NOTIFICATION: "SKILLVERSE_NOTIFICATION",
  ANALYTICS: "SKILLVERSE_ANALYTICS",
  AUDIT: "SKILLVERSE_AUDIT",
} as const;

// Simple in-memory rate limit guard per IP/fingerprint
const submissionRateMap = new Map<string, number[]>();

export function checkSkillverseRateLimit(identifier: string, maxPerMinute = 8): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (submissionRateMap.get(identifier) || []).filter((ts) => ts > windowStart);
  if (recent.length >= maxPerMinute) {
    return false;
  }
  recent.push(now);
  submissionRateMap.set(identifier, recent);
  return true;
}

export function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(`skillverse_salt_${pin}`).digest("hex");
}

async function getOrInitSetting<T>(key: string, category: string, defaultValue: T): Promise<T> {
  try {
    const existing = await db.systemSetting.findUnique({ where: { key } });
    if (existing && existing.value) {
      return existing.value as unknown as T;
    }
    await db.systemSetting.upsert({
      where: { key },
      update: {},
      create: {
        key,
        category,
        value: defaultValue as any,
        isSecret: false,
      },
    });
    return defaultValue;
  } catch {
    return defaultValue;
  }
}

export class SkillverseService {
  static async getCatalogAndConfig() {
    const [courses, packages, addons, feeRules, cms, faqs, blogs, batches] = await Promise.all([
      getOrInitSetting<SkillverseCourseItem[]>(
        KEYS.COURSES,
        CATEGORIES.CONFIG,
        INITIAL_SKILLVERSE_COURSES
      ),
      getOrInitSetting<SkillverseAcademicPackage[]>(
        KEYS.PACKAGES,
        CATEGORIES.CONFIG,
        INITIAL_ACADEMIC_PACKAGES
      ),
      getOrInitSetting<SkillverseCompetitiveAddon[]>(
        KEYS.ADDONS,
        CATEGORIES.CONFIG,
        INITIAL_COMPETITIVE_ADDONS
      ),
      getOrInitSetting<SkillverseFeeRuleConfig>(
        KEYS.FEE_RULES,
        CATEGORIES.CONFIG,
        INITIAL_SKILLVERSE_FEE_RULES
      ),
      getOrInitSetting<SkillverseCmsSettings>(KEYS.CMS, CATEGORIES.CONFIG, {
        heroHeadline: "Build Strong Foundations. Become Future Ready.",
        heroSubheadline:
          "Comprehensive Academic Foundation for Classes 8–12, IIT-JEE, NEET-UG, Olympiads, CUET, NDA, AI Literacy, Coding, Robotics, and Career Readiness — Powered by SoftLab Global.",
        announcementBanner:
          "Admissions Open for 2026–27 Academic & FutureReady Batches (Classes 8 to 12) | Free Diagnostic Assessment & Free Demo Class.",
        contactAddress: SKILLVERSE_BRAND.defaultContact.address,
        contactPhone: SKILLVERSE_BRAND.defaultContact.phone,
        contactWhatsapp: SKILLVERSE_BRAND.defaultContact.whatsapp,
        contactEmail: SKILLVERSE_BRAND.defaultContact.email,
        supportHours: SKILLVERSE_BRAND.defaultContact.supportHours,
        seoTitle:
          "SLG SKILLVERSE — Powered by SoftLab Global | Classes 8–12, IIT-JEE, NEET, AI & Coding",
        seoDescription:
          "Your World of Future Skills. School Foundation (Classes 8–12), IIT-JEE Main & Advanced Extension, NEET-UG, Olympiad, CUET, NDA, AI Literacy, Python Coding & Robotics.",
      }),
      getOrInitSetting(KEYS.FAQS, CATEGORIES.CONFIG, INITIAL_SKILLVERSE_FAQS),
      getOrInitSetting(KEYS.BLOGS, CATEGORIES.CONFIG, INITIAL_SKILLVERSE_BLOGS),
      getOrInitSetting<SkillverseBatchRecord[]>(KEYS.BATCHES, CATEGORIES.CONFIG, [
        {
          id: "BATCH-810-MORNING",
          batchCode: "SV-B26-810A",
          title: "Classes 8–10 Foundation & FutureReady Batch A",
          gradeBand: "Classes 8–10",
          courseSlug: "school-foundation-8-10",
          teacherName: "Academic Faculty Wing",
          schedule: "Mon–Sat | 4:00 PM – 6:00 PM",
          deliveryMode: "HYBRID",
          capacity: 25,
          enrolledCount: 0,
          status: "OPEN",
        },
        {
          id: "BATCH-1112-JEE",
          batchCode: "SV-B26-1112J",
          title: "Classes 11–12 Senior Science + JEE Main Track",
          gradeBand: "Classes 11–12",
          courseSlug: "jee-main-preparation",
          teacherName: "Engineering Foundation Faculty",
          schedule: "Mon–Sat | 5:30 PM – 8:00 PM",
          deliveryMode: "HYBRID",
          capacity: 25,
          enrolledCount: 0,
          status: "OPEN",
        },
        {
          id: "BATCH-1112-NEET",
          batchCode: "SV-B26-1112N",
          title: "Classes 11–12 Senior Biology + NEET-UG Track",
          gradeBand: "Classes 11–12",
          courseSlug: "neet-ug-foundation",
          teacherName: "Medical Foundation Faculty",
          schedule: "Mon–Sat | 5:30 PM – 8:00 PM",
          deliveryMode: "HYBRID",
          capacity: 25,
          enrolledCount: 0,
          status: "OPEN",
        },
        {
          id: "BATCH-AI-PYTHON",
          batchCode: "SV-B26-TECH1",
          title: "AI Literacy, Python & Robotics Weekend Lab",
          gradeBand: "Classes 8–12",
          courseSlug: "python-programming-foundation",
          teacherName: "SoftLab Global Tech Mentors",
          schedule: "Sat & Sun | 3:00 PM – 5:30 PM",
          deliveryMode: "HYBRID",
          capacity: 20,
          enrolledCount: 0,
          status: "OPEN",
        },
      ]),
    ]);

    // Fetch verified faculty records from database without fabricating profiles
    let verifiedFaculty: {
      id: string;
      name: string;
      specializations: string[];
      experienceYears: number;
      bio: string | null;
    }[] = [];
    try {
      const dbTrainers = await db.trainerProfile.findMany({
        take: 8,
        include: {
          user: {
            select: { firstName: true, lastName: true, status: true },
          },
        },
      });
      verifiedFaculty = dbTrainers
        .filter((t) => t.user?.status === "ACTIVE")
        .map((t) => ({
          id: t.id,
          name: `${t.user.firstName} ${t.user.lastName}`.trim(),
          specializations: t.specializations,
          experienceYears: t.experienceYears,
          bio: t.bio,
        }));
    } catch {
      verifiedFaculty = [];
    }

    return {
      brand: SKILLVERSE_BRAND,
      courses,
      packages,
      addons,
      feeRules,
      cms,
      faqs,
      blogs,
      batches,
      verifiedFaculty,
      diagnosticQuestions: INITIAL_DIAGNOSTIC_QUESTIONS,
    };
  }

  /**
   * Public Catalog & Config: Server-side enforcement of PUBLISHED courses and ACTIVE packages/add-ons.
   * Draft and Archived items are strictly excluded from public discovery.
   */
  static async getPublicCatalogAndConfig() {
    const full = await this.getCatalogAndConfig();
    return {
      ...full,
      courses: full.courses.filter((c) => c.status === "PUBLISHED"),
      packages: full.packages.filter((p) => p.status === "ACTIVE"),
      addons: full.addons.filter((a) => a.status === "ACTIVE"),
    };
  }

  static calculateTransparentFeeBreakdown(params: {
    packageId?: string;
    addonId?: string;
    standaloneCourseSlug?: string;
    includeOneTimeAdmissionFees: boolean;
    packages: SkillverseAcademicPackage[];
    addons: SkillverseCompetitiveAddon[];
    courses: SkillverseCourseItem[];
    feeRules: SkillverseFeeRuleConfig;
  }) {
    const selectedPkg = params.packageId
      ? params.packages.find((p) => p.id === params.packageId)
      : undefined;
    const selectedAddon = params.addonId
      ? params.addons.find((a) => a.id === params.addonId)
      : undefined;
    const selectedCourse = params.standaloneCourseSlug
      ? params.courses.find(
          (c) => c.slug === params.standaloneCourseSlug && c.pricingType === "STANDALONE"
        )
      : undefined;

    const packageMonthlyInr = selectedPkg ? selectedPkg.monthlyPriceInr : 0;
    const packageAnnualUndiscountedInr = selectedPkg
      ? selectedPkg.twelveMonthUndiscountedTotalInr
      : 0;
    const addonMonthlyInr = selectedAddon ? selectedAddon.monthlyAddonPriceInr : 0;
    const standaloneCourseInr = selectedCourse ? selectedCourse.priceInr : 0;

    const admissionFeeInr = params.includeOneTimeAdmissionFees
      ? params.feeRules.admissionAndRegistrationFeeInr
      : 0;
    const learningKitFeeInr = params.includeOneTimeAdmissionFees
      ? params.feeRules.studentIdAndLearningKitFeeInr
      : 0;

    const subtotalBeforeTaxInr =
      packageMonthlyInr +
      addonMonthlyInr +
      standaloneCourseInr +
      admissionFeeInr +
      learningKitFeeInr;

    const taxInr = Math.round(
      (subtotalBeforeTaxInr * (params.feeRules.gstPercentOnApplicableItems || 0)) / 100
    );

    const totalInitialPayableInr = subtotalBeforeTaxInr + taxInr;

    return {
      packageTitle: selectedPkg?.name,
      packageMonthlyInr,
      packageAnnualUndiscountedInr,
      addonTitle: selectedAddon?.name,
      addonMonthlyInr,
      standaloneCourseTitle: selectedCourse?.title,
      standaloneCourseInr,
      admissionFeeInr,
      learningKitFeeInr,
      assessmentFeeInr: params.feeRules.initialAcademicAssessmentFeeInr,
      demoClassFeeInr: params.feeRules.demoClassFeeInr,
      taxInr,
      totalInitialPayableInr,
      recurringMonthlyInr: packageMonthlyInr + addonMonthlyInr,
    };
  }

  static async submitAdmissionEnquiry(input: {
    studentName: string;
    parentName: string;
    phone: string;
    email: string;
    currentClass: string;
    board: string;
    schoolName?: string;
    preferredCourseSlug: string;
    preferredPackageId?: string;
    competitiveAddonId?: string;
    preferredBatchTiming: string;
    deliveryMode: "ONLINE" | "OFFLINE" | "HYBRID";
    city: string;
    locality: string;
    enquirySource?: string;
    campaign?: string;
    parentConsentAccepted: boolean;
    initialStage?: SkillverseAdmissionStage;
    demoScheduledAt?: string;
  }) {
    if (!input.parentConsentAccepted) {
      throw new Error(
        "Parent/Guardian consent and Child Safety Policy acknowledgement is required for students in Classes 8–12."
      );
    }

    const normalizedPhone = input.phone.replace(/\D/g, "").slice(-10);
    if (normalizedPhone.length < 10) {
      throw new Error("Please enter a valid 10-digit parent/guardian mobile number.");
    }

    if (!checkSkillverseRateLimit(`enq_${normalizedPhone}`, 5)) {
      throw new Error("Too many submissions received. Please wait a minute before trying again.");
    }

    // Duplicate detection within last 24 hours in isolated SKILLVERSE_ENQUIRY namespace
    const existingSettings = await db.systemSetting.findMany({
      where: { category: CATEGORIES.ENQUIRY },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const oneDayAgo = Date.now() - 24 * 3600 * 1000;
    for (const row of existingSettings) {
      const rec = row.value as unknown as SkillverseEnquiryRecord;
      if (
        rec &&
        rec.phone.replace(/\D/g, "").slice(-10) === normalizedPhone &&
        rec.preferredCourseSlug === input.preferredCourseSlug &&
        new Date(rec.createdAt).getTime() > oneDayAgo
      ) {
        return {
          duplicate: true,
          record: rec,
        };
      }
    }

    const seq = 1001 + existingSettings.length;
    const year = new Date().getFullYear();
    const referenceNumber = `SV-ADM-${year}-${seq}`;
    const id = `sv_enq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nowIso = new Date().toISOString();

    const record: SkillverseEnquiryRecord = {
      id,
      referenceNumber,
      stage: input.initialStage || "ENQUIRY",
      studentName: input.studentName.trim(),
      parentName: input.parentName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      currentClass: input.currentClass,
      board: input.board,
      schoolName: input.schoolName?.trim(),
      preferredCourseSlug: input.preferredCourseSlug,
      preferredPackageId: input.preferredPackageId,
      competitiveAddonId: input.competitiveAddonId,
      preferredBatchTiming: input.preferredBatchTiming,
      deliveryMode: input.deliveryMode,
      city: input.city.trim(),
      locality: input.locality.trim(),
      enquirySource: input.enquirySource || "SKILLVERSE_WEBSITE",
      campaign: input.campaign,
      parentConsentAccepted: true,
      parentConsentTimestamp: nowIso,
      demoScheduledAt: input.demoScheduledAt,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await db.systemSetting.create({
      data: {
        key: `SV_ENQ_${referenceNumber}`,
        category: CATEGORIES.ENQUIRY,
        value: record as any,
        isSecret: false,
      },
    });

    // Log privacy-conscious conversion event (NO PII stored)
    await this.recordAnalyticsEvent({
      eventType:
        input.initialStage === "DEMO_BOOKING" ? "DEMO_FORM_COMPLETED" : "ADMISSION_ENQUIRY_SUBMITTED",
      courseSlug: input.preferredCourseSlug,
      gradeBand: input.currentClass,
      source: record.enquirySource,
    });

    // Queue notification log
    await this.logNotification({
      type:
        input.initialStage === "DEMO_BOOKING"
          ? "DEMO_CLASS_CONFIRMATION"
          : "ADMISSION_ENQUIRY_ACK",
      recipientRole: "PARENT",
      recipientMasked: `${input.email.slice(0, 3)}***@${input.email.split("@")[1] || "mail.com"}`,
      channel: "EMAIL",
      referenceNumber,
      status: process.env.RESEND_API_KEY || process.env.SMTP_USER ? "QUEUED_PROVIDER" : "LOGGED_PENDING_PROVIDER_CONFIG",
    });

    return {
      duplicate: false,
      record,
    };
  }

  static async submitDiagnosticAssessment(input: {
    studentName: string;
    parentName: string;
    phone: string;
    email: string;
    currentClass: string;
    board: string;
    answers: { questionId: string; selectedIndex: number }[];
    parentConsentAccepted: boolean;
  }) {
    if (!input.parentConsentAccepted) {
      throw new Error("Parent/Guardian consent is required to record student diagnostic scores.");
    }

    const questions = INITIAL_DIAGNOSTIC_QUESTIONS;
    let score = 0;
    const breakdown = questions.map((q) => {
      const submitted = input.answers.find((a) => a.questionId === q.id);
      const isCorrect = submitted?.selectedIndex === q.correctIndex;
      if (isCorrect) score += 1;
      return {
        questionId: q.id,
        subject: q.subject,
        isCorrect,
        explanation: q.explanation,
      };
    });

    const maxScore = questions.length;
    const percentage = Math.round((score / maxScore) * 100);
    const attemptId = `SV-DIAG-${Date.now().toString().slice(-6)}`;

    const recommendedPackage =
      input.currentClass === "Class 11" || input.currentClass === "Class 12"
        ? "Package 5 — Skillverse Senior FutureReady"
        : percentage >= 80
        ? "Package 3 — Skillverse FutureReady + Olympiad / JEE-NEET Foundation"
        : "Package 2 — Skillverse Academic Excellence";

    const attemptRecord = {
      attemptId,
      studentName: input.studentName.trim(),
      parentName: input.parentName.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      currentClass: input.currentClass,
      board: input.board,
      score,
      maxScore,
      percentage,
      recommendedPackage,
      breakdown,
      completedAt: new Date().toISOString(),
    };

    await db.systemSetting.create({
      data: {
        key: `SV_ASSESS_${attemptId}`,
        category: CATEGORIES.ASSESSMENT,
        value: attemptRecord as any,
        isSecret: false,
      },
    });

    return attemptRecord;
  }

  static async getAdminDashboardData() {
    const [
      catalogConfig,
      enquiryRows,
      studentRows,
      invoiceRows,
      certRows,
      assessmentRows,
      quizAttemptRows,
      notificationRows,
      analyticsRows,
      auditRows,
    ] = await Promise.all([
      this.getCatalogAndConfig(),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.ENQUIRY },
        orderBy: { updatedAt: "desc" },
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.STUDENT },
        orderBy: { updatedAt: "desc" },
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.INVOICE },
        orderBy: { updatedAt: "desc" },
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.CERTIFICATE },
        orderBy: { updatedAt: "desc" },
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.ASSESSMENT },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.QUIZ_ATTEMPT },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.NOTIFICATION },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.ANALYTICS },
        orderBy: { updatedAt: "desc" },
        take: 100,
      }),
      db.systemSetting.findMany({
        where: { category: CATEGORIES.AUDIT },
        orderBy: { updatedAt: "desc" },
        take: 50,
      }),
    ]);

    const enquiries = enquiryRows.map((r) => r.value as unknown as SkillverseEnquiryRecord);
    const students = studentRows.map((r) => r.value as unknown as SkillverseStudentProfileRecord);
    const invoices = invoiceRows.map((r) => r.value as unknown as SkillverseInvoiceRecord);
    const certificates = certRows.map((r) => r.value as unknown as SkillverseCertificateRecord);
    const quizAttempts = quizAttemptRows.map(
      (r) => r.value as unknown as SkillverseQuizAttemptRecord
    );

    const paidRevenueInr = invoices
      .filter((inv) => inv.status === "PAID")
      .reduce((acc, inv) => acc + inv.totalPayableInr, 0);

    const pendingFeeInr = invoices
      .filter((inv) => inv.status === "PENDING")
      .reduce((acc, inv) => acc + inv.totalPayableInr, 0);

    return {
      ...catalogConfig,
      enquiries,
      students,
      invoices,
      certificates,
      assessments: assessmentRows.map((r) => r.value as any),
      quizAttempts,
      notifications: notificationRows.map((r) => r.value as any),
      analyticsEvents: analyticsRows.map((r) => r.value as any),
      auditLogs: auditRows.map((r) => r.value as any),
      metrics: {
        totalEnquiries: enquiries.length,
        demoBookingsCount: enquiries.filter((e) => e.stage === "DEMO_BOOKING" || Boolean(e.demoScheduledAt)).length,
        activeStudentsCount: students.filter((s) => s.status === "ACTIVE").length,
        conversionRatePercent:
          enquiries.length > 0
            ? Math.round(
                (enquiries.filter((e) => e.stage === "ACTIVE_STUDENT" || e.stage === "ENROLLMENT")
                  .length /
                  enquiries.length) *
                  100
              )
            : 0,
        paidRevenueInr,
        pendingFeeInr,
        certificatesIssuedCount: certificates.filter((c) => c.status === "ISSUED").length,
      },
    };
  }

  static async updateEnquiryStage(input: {
    referenceNumber: string;
    stage: SkillverseAdmissionStage;
    assignedCounselor?: string;
    followUpDate?: string;
    followUpNotes?: string;
    demoScheduledAt?: string;
    allocatedBatchCode?: string;
    actorName: string;
  }) {
    const key = `SV_ENQ_${input.referenceNumber}`;
    const existing = await db.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      throw new Error(`Enquiry ${input.referenceNumber} not found.`);
    }

    const rec = existing.value as unknown as SkillverseEnquiryRecord;
    const updated: SkillverseEnquiryRecord = {
      ...rec,
      stage: input.stage,
      assignedCounselor: input.assignedCounselor ?? rec.assignedCounselor,
      followUpDate: input.followUpDate ?? rec.followUpDate,
      followUpNotes: input.followUpNotes ?? rec.followUpNotes,
      demoScheduledAt: input.demoScheduledAt ?? rec.demoScheduledAt,
      allocatedBatchCode: input.allocatedBatchCode ?? rec.allocatedBatchCode,
      applicationNumber:
        input.stage === "APPLICATION" && !rec.applicationNumber
          ? rec.referenceNumber.replace("SV-ADM-", "SV-APP-")
          : rec.applicationNumber,
      updatedAt: new Date().toISOString(),
    };

    // If converted to ENROLLMENT or ACTIVE_STUDENT and not yet enrolled, create isolated Student + Parent Link + Invoice
    if (
      (input.stage === "ENROLLMENT" || input.stage === "ACTIVE_STUDENT") &&
      !updated.enrolledStudentId
    ) {
      const studentEnrollment = await this.enrollStudentFromEnquiry(updated, input.actorName);
      updated.enrolledStudentId = studentEnrollment.student.enrollmentCode;
    }

    await db.systemSetting.update({
      where: { key },
      data: { value: updated as any },
    });

    await this.logAudit({
      action: `ADMISSION_STAGE_${input.stage}`,
      actor: input.actorName,
      target: input.referenceNumber,
      details: `Updated stage from ${rec.stage} to ${input.stage}`,
    });

    return updated;
  }

  static async deleteEnquiry(referenceNumber: string, actorName: string) {
    const key = `SV_ENQ_${referenceNumber}`;
    await db.systemSetting.delete({ where: { key } }).catch(() => null);
    await this.logAudit({
      action: "ENQUIRY_DELETED",
      actor: actorName,
      target: referenceNumber,
      details: `Deleted enquiry ${referenceNumber}`,
    });
    return { success: true, referenceNumber };
  }

  static async addFollowUpNote(input: {
    referenceNumber: string;
    note: string;
    nextFollowUpDate?: string;
    stage?: SkillverseAdmissionStage;
    actorName: string;
  }) {
    const key = `SV_ENQ_${input.referenceNumber}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) throw new Error(`Enquiry ${input.referenceNumber} not found.`);

    const enq = row.value as unknown as SkillverseEnquiryRecord;
    const history = enq.followUpHistory || [];
    history.unshift({
      timestamp: new Date().toISOString(),
      note: input.note,
      actorName: input.actorName,
      stage: input.stage || enq.stage,
      nextFollowUpDate: input.nextFollowUpDate,
    });

    const updated: SkillverseEnquiryRecord = {
      ...enq,
      followUpNotes: input.note,
      followUpDate: input.nextFollowUpDate ?? enq.followUpDate,
      stage: input.stage || enq.stage,
      followUpHistory: history,
      updatedAt: new Date().toISOString(),
    };

    // If stage was changed to ENROLLMENT or ACTIVE_STUDENT, trigger student auto-creation
    if (
      (updated.stage === "ENROLLMENT" || updated.stage === "ACTIVE_STUDENT") &&
      !updated.enrolledStudentId
    ) {
      const studentEnrollment = await this.enrollStudentFromEnquiry(updated, input.actorName);
      updated.enrolledStudentId = studentEnrollment.student.enrollmentCode;
    }

    await db.systemSetting.update({
      where: { key },
      data: { value: updated as any },
    });

    await this.logAudit({
      action: "FOLLOW_UP_LOGGED",
      actor: input.actorName,
      target: input.referenceNumber,
      details: `Note: ${input.note.slice(0, 100)}`,
    });

    return updated;
  }

  static async createDirectLead(input: {
    studentName: string;
    parentName: string;
    phone: string;
    email: string;
    currentClass: string;
    board?: string;
    schoolName?: string;
    preferredCourseSlug: string;
    preferredPackageId?: string;
    competitiveAddonId?: string;
    deliveryMode?: "ONLINE" | "OFFLINE" | "HYBRID";
    city?: string;
    locality?: string;
    stage?: string;
    notes?: string;
    followUpDate?: string;
    demoScheduledAt?: string;
    actorName: string;
  }) {
    const res = await this.submitAdmissionEnquiry({
      studentName: input.studentName,
      parentName: input.parentName,
      phone: input.phone,
      email: input.email,
      currentClass: input.currentClass,
      board: input.board || "CBSE",
      schoolName: input.schoolName,
      preferredCourseSlug: input.preferredCourseSlug,
      preferredPackageId: input.preferredPackageId,
      competitiveAddonId: input.competitiveAddonId,
      preferredBatchTiming: "Evening (4:00 PM – 6:00 PM)",
      deliveryMode: input.deliveryMode || "HYBRID",
      city: input.city || "Prayagraj",
      locality: input.locality || "Civil Lines",
      enquirySource: "DIRECT_STAFF_CRM",
      parentConsentAccepted: true,
      initialStage: (input.stage as SkillverseAdmissionStage) || "ENQUIRY",
      demoScheduledAt: input.demoScheduledAt,
    });

    if (input.notes) {
      await this.addFollowUpNote({
        referenceNumber: res.record.referenceNumber,
        note: input.notes,
        nextFollowUpDate: input.followUpDate,
        stage: res.record.stage,
        actorName: input.actorName,
      });
    }

    await this.logAudit({
      action: "DIRECT_LEAD_CREATED",
      actor: input.actorName,
      target: res.record.referenceNumber,
      details: `Staff created direct lead for ${input.studentName} (${input.currentClass})`,
    });

    return res.record;
  }

  static async enrollStudentFromEnquiry(enquiry: SkillverseEnquiryRecord, actorName: string) {
    const existingStudents = await db.systemSetting.count({
      where: { category: CATEGORIES.STUDENT },
    });
    const enrollmentCode = `SV-STU-${new Date().getFullYear()}-${101 + existingStudents}`;
    // Default initial parent access PIN is last 4 digits of phone (hashed on server)
    const defaultPin = enquiry.phone.replace(/\D/g, "").slice(-4) || "1234";

    const student: SkillverseStudentProfileRecord = {
      id: `sv_stu_${Date.now()}`,
      enrollmentCode,
      studentName: enquiry.studentName,
      currentClass: enquiry.currentClass,
      board: enquiry.board,
      schoolName: enquiry.schoolName || "Registered School",
      studentEmail: enquiry.email,
      parentName: enquiry.parentName,
      parentEmail: enquiry.email,
      parentPhone: enquiry.phone,
      parentAccessPinHash: hashPin(defaultPin),
      enrolledPackageId: enquiry.preferredPackageId || "PKG-2-EXCELLENCE",
      enrolledCourseSlugs: [enquiry.preferredCourseSlug],
      competitiveAddonIds: enquiry.competitiveAddonId ? [enquiry.competitiveAddonId] : [],
      batchCode: enquiry.allocatedBatchCode || "SV-B26-810A",
      deliveryMode: enquiry.deliveryMode,
      attendancePercent: 100,
      attendanceRecords: [
        {
          date: new Date().toISOString().slice(0, 10),
          subject: "Orientation & Foundation Diagnostic",
          status: "PRESENT",
          markedBy: actorName,
        },
      ],
      assignments: [
        {
          id: `ASG-${Date.now()}`,
          title: "Chapter 1 Concept & Analytical Worksheet",
          subject: "Core Foundation",
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          status: "PENDING",
        },
      ],
      assessmentScores: [],
      communicationPreferences: {
        whatsappAlerts: true,
        emailReports: true,
        smsAttendanceAlerts: true,
        preferredLanguage: "ENGLISH",
        updatedAt: new Date().toISOString(),
      },
      ptmSchedules: [
        {
          id: `PTM-${Date.now()}`,
          scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
          teacherName: "Academic Coordinator",
          agenda: "Initial 15-Day Academic Onboarding & Study Plan Review",
          status: "SCHEDULED",
        },
      ],
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    await db.systemSetting.create({
      data: {
        key: `SV_STU_${enrollmentCode}`,
        category: CATEGORIES.STUDENT,
        value: student as any,
        isSecret: false,
      },
    });

    // Generate itemized transparent Fee Invoice
    const config = await this.getCatalogAndConfig();
    const breakdown = this.calculateTransparentFeeBreakdown({
      packageId: enquiry.preferredPackageId,
      addonId: enquiry.competitiveAddonId,
      standaloneCourseSlug: enquiry.preferredPackageId ? undefined : enquiry.preferredCourseSlug,
      includeOneTimeAdmissionFees: true,
      packages: config.packages,
      addons: config.addons,
      courses: config.courses,
      feeRules: config.feeRules,
    });

    const invoiceNumber = `SV-INV-${new Date().getFullYear()}-${1001 + existingStudents}`;
    const invoice: SkillverseInvoiceRecord = {
      id: `sv_inv_${Date.now()}`,
      invoiceNumber,
      studentId: enrollmentCode,
      enquiryId: enquiry.referenceNumber,
      studentName: enquiry.studentName,
      parentName: enquiry.parentName,
      parentEmail: enquiry.email,
      parentPhone: enquiry.phone,
      packageTitle: breakdown.packageTitle,
      packageMonthlyAmountInr: breakdown.packageMonthlyInr,
      addonTitle: breakdown.addonTitle,
      addonMonthlyAmountInr: breakdown.addonMonthlyInr,
      standaloneCourseTitle: breakdown.standaloneCourseTitle,
      standaloneAmountInr: breakdown.standaloneCourseInr,
      admissionFeeInr: breakdown.admissionFeeInr,
      learningKitFeeInr: breakdown.learningKitFeeInr,
      discountInr: 0,
      taxAmountInr: breakdown.taxInr,
      totalPayableInr: breakdown.totalInitialPayableInr,
      status: "PENDING",
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    await db.systemSetting.create({
      data: {
        key: `SV_INV_${invoiceNumber}`,
        category: CATEGORIES.INVOICE,
        value: invoice as any,
        isSecret: false,
      },
    });

    return { student, invoice };
  }

  /**
   * Strict Parent-to-Student Family Access Verification:
   * A parent can ONLY view the student profile linked to their verified phone + enrollmentCode + PIN.
   */
  static async getVerifiedParentPortalData(input: {
    enrollmentCode: string;
    parentPhone: string;
    accessPin: string;
  }) {
    const key = `SV_STU_${input.enrollmentCode.trim().toUpperCase()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      throw new Error("No student enrollment found with that Enrollment Code.");
    }

    const student = row.value as unknown as SkillverseStudentProfileRecord;
    const normalizedInputPhone = input.parentPhone.replace(/\D/g, "").slice(-10);
    const normalizedRecordPhone = student.parentPhone.replace(/\D/g, "").slice(-10);

    if (
      normalizedInputPhone !== normalizedRecordPhone ||
      hashPin(input.accessPin.trim()) !== student.parentAccessPinHash
    ) {
      throw new Error(
        "Parent authorization failed. You are only permitted to access your own linked child's academic record."
      );
    }

    // Fetch only this student's invoices & certificates
    const [invoiceRows, certRows] = await Promise.all([
      db.systemSetting.findMany({ where: { category: CATEGORIES.INVOICE } }),
      db.systemSetting.findMany({ where: { category: CATEGORIES.CERTIFICATE } }),
    ]);

    const invoices = invoiceRows
      .map((r) => r.value as unknown as SkillverseInvoiceRecord)
      .filter((inv) => inv.studentId === student.enrollmentCode);

    const certificates = certRows
      .map((r) => r.value as unknown as SkillverseCertificateRecord)
      .filter((c) => c.studentId === student.enrollmentCode && c.status === "ISSUED");

    const { parentAccessPinHash, ...safeStudent } = student;

    return {
      student: safeStudent,
      invoices,
      certificates,
    };
  }

  static async verifyCertificateByNumber(certificateNumber: string) {
    const key = `SV_CERT_${certificateNumber.trim().toUpperCase()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      return null;
    }
    return row.value as unknown as SkillverseCertificateRecord;
  }

  static async issueCertificate(input: {
    studentId: string;
    studentName: string;
    classGrade: string;
    courseTitle: string;
    actorName: string;
  }) {
    const count = await db.systemSetting.count({ where: { category: CATEGORIES.CERTIFICATE } });
    const certificateNumber = `SLG-SV-CERT-${new Date().getFullYear()}-${1001 + count}`;
    const today = new Date().toISOString().slice(0, 10);

    const cert: SkillverseCertificateRecord = {
      id: `sv_cert_${Date.now()}`,
      certificateNumber,
      studentId: input.studentId,
      studentName: input.studentName,
      classGrade: input.classGrade,
      courseTitle: input.courseTitle,
      completionDate: today,
      issueDate: today,
      authorizedIssuer: "Academic Director — SLG SKILLVERSE (Powered by SoftLab Global)",
      status: "ISSUED",
    };

    await db.systemSetting.create({
      data: {
        key: `SV_CERT_${certificateNumber}`,
        category: CATEGORIES.CERTIFICATE,
        value: cert as any,
        isSecret: false,
      },
    });

    await this.logAudit({
      action: "CERTIFICATE_ISSUED",
      actor: input.actorName,
      target: certificateNumber,
      details: `Issued course completion certificate to ${input.studentName} (${input.courseTitle})`,
    });

    return cert;
  }

  /**
   * Admin Course Catalogue CRUD (Create / Edit / Publish / Archive without code changes)
   * Preserves existing curriculum modules and metadata when updating partial fields, and
   * populates complete valid defaults when creating a new course.
   */
  static async upsertCourse(input: {
    course: Partial<SkillverseCourseItem> & {
      slug: string;
      title?: string;
      monthlyFeeInr?: number;
      oneTimeFeeInr?: number | null;
      batchTiming?: string;
    };
    actorName: string;
  }) {
    const config = await this.getCatalogAndConfig();
    const existingIdx = config.courses.findIndex(
      (c) => (input.course.id && c.id === input.course.id) || c.slug === input.course.slug
    );
    const updatedCourses = [...config.courses];
    const resolvedPrice =
      input.course.priceInr ??
      input.course.monthlyFeeInr ??
      (input.course.oneTimeFeeInr !== null && input.course.oneTimeFeeInr !== undefined
        ? input.course.oneTimeFeeInr
        : undefined);

    let finalCourse: SkillverseCourseItem;

    if (existingIdx >= 0) {
      const prev = updatedCourses[existingIdx];
      finalCourse = {
        ...prev,
        ...input.course,
        id: prev.id,
        code: input.course.code || prev.code,
        slug: input.course.slug || prev.slug,
        title: input.course.title || prev.title,
        priceInr: resolvedPrice !== undefined ? resolvedPrice : prev.priceInr,
        status: input.course.status || prev.status,
        shortSummary: input.course.shortSummary || prev.shortSummary,
        defaultTimetable:
          input.course.defaultTimetable || input.course.batchTiming || prev.defaultTimetable,
        modules:
          input.course.modules && input.course.modules.length > 0
            ? input.course.modules
            : prev.modules,
        learningOutcomes:
          input.course.learningOutcomes && input.course.learningOutcomes.length > 0
            ? input.course.learningOutcomes
            : prev.learningOutcomes,
      };
      updatedCourses[existingIdx] = finalCourse;
    } else {
      const seq = 100 + updatedCourses.length + 1;
      finalCourse = {
        id: input.course.id || `SV-CRS-${seq}`,
        code: input.course.code || `SV-${seq}`,
        slug: input.course.slug.trim().toLowerCase(),
        title: input.course.title || input.course.slug,
        category: input.course.category || "TECH_AI_CODING",
        categoryLabel: input.course.categoryLabel || "Future Skills & Academic Program",
        eligibleGrades:
          input.course.eligibleGrades && input.course.eligibleGrades.length > 0
            ? input.course.eligibleGrades
            : ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
        applicableBoards:
          input.course.applicableBoards && input.course.applicableBoards.length > 0
            ? input.course.applicableBoards
            : ["CBSE", "ICSE / ISC", "UP Board / State Boards"],
        deliveryModes:
          input.course.deliveryModes && input.course.deliveryModes.length > 0
            ? input.course.deliveryModes
            : ["ONLINE", "OFFLINE", "HYBRID"],
        durationLabel: input.course.durationLabel || "3 Months (Structured Module)",
        durationMonths: input.course.durationMonths || 3,
        teachingHours: input.course.teachingHours || 48,
        pricingType: input.course.pricingType || "STANDALONE",
        priceInr: resolvedPrice !== undefined ? resolvedPrice : 1499,
        billingCycle: input.course.billingCycle || "MONTHLY",
        gstPercent: input.course.gstPercent ?? 0,
        installmentAvailable: input.course.installmentAvailable ?? true,
        batchCapacity: input.course.batchCapacity || 25,
        defaultTimetable:
          input.course.defaultTimetable ||
          input.course.batchTiming ||
          "Mon–Sat | 4:00 PM – 6:00 PM",
        prerequisites: input.course.prerequisites || "Open to eligible school students",
        shortSummary:
          input.course.shortSummary ||
          "Structured concept mastery, guided problem solving, and practical lab sessions.",
        description:
          input.course.description ||
          input.course.shortSummary ||
          "Comprehensive SLG SKILLVERSE academic and practical skill development program.",
        learningOutcomes:
          input.course.learningOutcomes && input.course.learningOutcomes.length > 0
            ? input.course.learningOutcomes
            : [
                "Master foundational concepts with structured analytical problem solving",
                "Complete hands-on assignments and unit evaluations",
              ],
        modules:
          input.course.modules && input.course.modules.length > 0
            ? input.course.modules
            : [
                {
                  title: "Module 1: Core Concepts & Guided Practice",
                  lessons: [
                    "Foundational Principles & Concept Walkthrough",
                    "Applied Problem Solving & Practical Exercises",
                  ],
                  teachingHours: 24,
                },
              ],
        assessmentPattern:
          input.course.assessmentPattern ||
          "Weekly objective quizzes + faculty-evaluated descriptive assessments.",
        syllabusRevisionDate:
          input.course.syllabusRevisionDate || new Date().toISOString().slice(0, 10),
        status: input.course.status || "PUBLISHED",
        officialExamNotice: input.course.officialExamNotice,
      };
      updatedCourses.unshift(finalCourse);
    }

    await db.systemSetting.upsert({
      where: { key: KEYS.COURSES },
      update: { value: updatedCourses as any, updatedBy: input.actorName },
      create: {
        key: KEYS.COURSES,
        category: CATEGORIES.CONFIG,
        value: updatedCourses as any,
        isSecret: false,
        updatedBy: input.actorName,
      },
    });

    await this.logAudit({
      action: existingIdx >= 0 ? "COURSE_UPDATED" : "COURSE_CREATED",
      actor: input.actorName,
      target: finalCourse.code,
      details: `${finalCourse.title} (${finalCourse.status}) — ₹${finalCourse.priceInr}`,
    });

    return finalCourse;
  }

  /**
   * Admin Package Pricing & Inclusions CRUD
   * Preserves all package metadata and automatically recalculates 12-month undiscounted total.
   */
  static async upsertPackage(input: {
    pkg: Partial<SkillverseAcademicPackage> & {
      id: string;
      monthlyFeeInr?: number;
      subjectsSummary?: string;
    };
    actorName: string;
  }) {
    const config = await this.getCatalogAndConfig();
    const idx = config.packages.findIndex((p) => p.id === input.pkg.id);
    const updatedPackages = [...config.packages];
    const resolvedMonthly =
      input.pkg.monthlyPriceInr ??
      input.pkg.monthlyFeeInr ??
      (idx >= 0 ? updatedPackages[idx].monthlyPriceInr : 1499);

    let finalPkg: SkillverseAcademicPackage;
    if (idx >= 0) {
      const prev = updatedPackages[idx];
      finalPkg = {
        ...prev,
        ...input.pkg,
        id: prev.id,
        code: input.pkg.code || prev.code,
        name: input.pkg.name || prev.name,
        monthlyPriceInr: resolvedMonthly,
        twelveMonthUndiscountedTotalInr: resolvedMonthly * 12,
        summary: input.pkg.summary || input.pkg.subjectsSummary || prev.summary,
        inclusions:
          input.pkg.inclusions && input.pkg.inclusions.length > 0
            ? input.pkg.inclusions
            : prev.inclusions,
        status: input.pkg.status || prev.status,
      };
      updatedPackages[idx] = finalPkg;
    } else {
      finalPkg = {
        id: input.pkg.id,
        code: input.pkg.code || input.pkg.id,
        name: input.pkg.name || input.pkg.id,
        badge: input.pkg.badge || "Custom Academic Package",
        eligibleGrades: input.pkg.eligibleGrades || "Classes 8–12",
        gradeList: input.pkg.gradeList || ["Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
        monthlyPriceInr: resolvedMonthly,
        twelveMonthUndiscountedTotalInr: resolvedMonthly * 12,
        summary:
          input.pkg.summary ||
          input.pkg.subjectsSummary ||
          "Structured monthly academic package with regular assessments.",
        inclusions: input.pkg.inclusions || ["Live & Hybrid Classes", "Unit Assessments"],
        subjectsCovered: input.pkg.subjectsCovered || ["Core Subjects"],
        status: input.pkg.status || "ACTIVE",
      };
      updatedPackages.push(finalPkg);
    }

    await db.systemSetting.upsert({
      where: { key: KEYS.PACKAGES },
      update: { value: updatedPackages as any, updatedBy: input.actorName },
      create: {
        key: KEYS.PACKAGES,
        category: CATEGORIES.CONFIG,
        value: updatedPackages as any,
        isSecret: false,
        updatedBy: input.actorName,
      },
    });

    await this.logAudit({
      action: "PACKAGE_UPDATED",
      actor: input.actorName,
      target: finalPkg.code,
      details: `${finalPkg.name} — ₹${finalPkg.monthlyPriceInr}/mo (12-mo: ₹${finalPkg.twelveMonthUndiscountedTotalInr})`,
    });

    return finalPkg;
  }

  /**
   * Admin / Academic Coordinator Batch Management CRUD
   */
  static async upsertBatch(input: {
    batch: Partial<SkillverseBatchRecord> & { batchCode: string; title: string };
    actorName: string;
  }) {
    const config = await this.getCatalogAndConfig();
    const updatedBatches = [...config.batches];
    const idx = updatedBatches.findIndex(
      (b) => b.batchCode === input.batch.batchCode || (input.batch.id && b.id === input.batch.id)
    );

    let finalBatch: SkillverseBatchRecord;
    if (idx >= 0) {
      const prev = updatedBatches[idx];
      finalBatch = {
        ...prev,
        ...input.batch,
        id: prev.id,
        batchCode: input.batch.batchCode || prev.batchCode,
        title: input.batch.title || prev.title,
      };
      updatedBatches[idx] = finalBatch;
    } else {
      finalBatch = {
        id: input.batch.id || `BATCH-${Date.now()}`,
        batchCode: input.batch.batchCode.trim().toUpperCase(),
        title: input.batch.title.trim(),
        gradeBand: input.batch.gradeBand || "Classes 8–10",
        courseSlug: input.batch.courseSlug || "school-foundation-8-10",
        teacherName: input.batch.teacherName || "Academic Faculty Wing",
        schedule: input.batch.schedule || "Mon–Sat | 4:00 PM – 6:00 PM",
        deliveryMode: input.batch.deliveryMode || "HYBRID",
        capacity: input.batch.capacity || 25,
        enrolledCount: input.batch.enrolledCount || 0,
        status: input.batch.status || "OPEN",
      };
      updatedBatches.unshift(finalBatch);
    }

    await db.systemSetting.upsert({
      where: { key: KEYS.BATCHES },
      update: { value: updatedBatches as any, updatedBy: input.actorName },
      create: {
        key: KEYS.BATCHES,
        category: CATEGORIES.CONFIG,
        value: updatedBatches as any,
        isSecret: false,
        updatedBy: input.actorName,
      },
    });

    await this.logAudit({
      action: idx >= 0 ? "BATCH_UPDATED" : "BATCH_CREATED",
      actor: input.actorName,
      target: finalBatch.batchCode,
      details: `${finalBatch.title} (${finalBatch.schedule}) — Faculty: ${finalBatch.teacherName}`,
    });

    return finalBatch;
  }

  /**
   * Persistent Student Quiz Submission & Faculty Descriptive Grading Workflow
   */
  static async submitAndPersistQuizAttempt(input: {
    enrollmentCode?: string;
    quizTitle: string;
    questions: {
      id: string;
      type: "MCQ" | "MSQ" | "DESCRIPTIVE";
      prompt: string;
      marks: number;
      correctOptionIndex?: number;
      correctOptionIndices?: number[];
    }[];
    responses: {
      questionId: string;
      selectedOptionIndex?: number;
      selectedOptionIndices?: number[];
      descriptiveAnswer?: string;
    }[];
  }) {
    const evaluation = this.evaluateQuizSubmissionPure({
      questions: input.questions,
      responses: input.responses,
    });

    const attemptId = `SV-QZ-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    let studentName: string | undefined;

    if (input.enrollmentCode) {
      const key = `SV_STU_${input.enrollmentCode.trim().toUpperCase()}`;
      const row = await db.systemSetting.findUnique({ where: { key } });
      if (row) {
        const student = row.value as unknown as SkillverseStudentProfileRecord;
        studentName = student.studentName;
        if (!Array.isArray(student.assessmentScores)) {
          student.assessmentScores = [];
        }
        student.assessmentScores.unshift({
          attemptId,
          testTitle: input.quizTitle,
          subject: "Online Quiz & Descriptive Assessment",
          date: new Date().toISOString().slice(0, 10),
          marksObtained: evaluation.autoAwardedMarks,
          maxMarks: evaluation.totalMaxMarks,
          status: evaluation.overallStatus,
          teacherRemark:
            evaluation.overallStatus === "PENDING_TEACHER_REVIEW"
              ? "Auto-graded objective items completed; descriptive answers queued for faculty grading."
              : "Auto-graded online assessment completed.",
        });
        await db.systemSetting.update({
          where: { key },
          data: { value: student as any },
        });
      }
    }

    const attemptRecord: SkillverseQuizAttemptRecord = {
      attemptId,
      enrollmentCode: input.enrollmentCode?.trim().toUpperCase(),
      studentName,
      quizTitle: input.quizTitle,
      autoAwardedMarks: evaluation.autoAwardedMarks,
      descriptiveAwardedMarks: 0,
      totalAwardedMarks: evaluation.autoAwardedMarks,
      totalMaxMarks: evaluation.totalMaxMarks,
      hasDescriptivePending: evaluation.hasDescriptivePending,
      overallStatus: evaluation.overallStatus,
      itemResults: evaluation.itemResults.map((ir) => {
        const q = input.questions.find(( item ) => item.id === ir.questionId);
        return {
          ...ir,
          prompt: q?.prompt,
        };
      }),
      submittedAt: new Date().toISOString(),
    };

    await db.systemSetting.create({
      data: {
        key: `SV_QUIZ_${attemptId}`,
        category: CATEGORIES.QUIZ_ATTEMPT,
        value: attemptRecord as any,
        isSecret: false,
      },
    });

    return {
      ...evaluation,
      attemptId,
    };
  }

  /**
   * Authorized Faculty Evaluation of Pending Descriptive Quiz Answers
   */
  static async gradeDescriptiveQuizAttempt(input: {
    attemptId: string;
    descriptiveMarksAwarded: number;
    teacherFeedback: string;
    actorName: string;
  }) {
    const key = `SV_QUIZ_${input.attemptId.trim()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      throw new Error(`Quiz attempt ${input.attemptId} not found.`);
    }

    const attempt = row.value as unknown as SkillverseQuizAttemptRecord;
    const descriptiveMax = attempt.itemResults
      .filter((i) => i.type === "DESCRIPTIVE")
      .reduce((acc, i) => acc + i.maxMarks, 0);

    if (input.descriptiveMarksAwarded < 0 || input.descriptiveMarksAwarded > descriptiveMax) {
      throw new Error(
        `Descriptive marks must be between 0 and ${descriptiveMax}.`
      );
    }

    attempt.descriptiveAwardedMarks = input.descriptiveMarksAwarded;
    attempt.totalAwardedMarks = attempt.autoAwardedMarks + input.descriptiveMarksAwarded;
    attempt.hasDescriptivePending = false;
    attempt.overallStatus = "EVALUATED";
    attempt.teacherFeedback = input.teacherFeedback.trim();
    attempt.evaluatedBy = input.actorName;
    attempt.evaluatedAt = new Date().toISOString();
    attempt.itemResults = attempt.itemResults.map((item) =>
      item.type === "DESCRIPTIVE"
        ? {
            ...item,
            awardedMarks: input.descriptiveMarksAwarded,
            status: "TEACHER_EVALUATED" as const,
          }
        : item
    );

    await db.systemSetting.update({
      where: { key },
      data: { value: attempt as any, updatedBy: input.actorName },
    });

    if (attempt.enrollmentCode) {
      const stuKey = `SV_STU_${attempt.enrollmentCode}`;
      const stuRow = await db.systemSetting.findUnique({ where: { key: stuKey } });
      if (stuRow) {
        const student = stuRow.value as unknown as SkillverseStudentProfileRecord;
        if (!Array.isArray(student.assessmentScores)) {
          student.assessmentScores = [];
        }
        const scoreIdx = student.assessmentScores.findIndex(
          (s) => s.attemptId === attempt.attemptId || s.testTitle === attempt.quizTitle
        );
        const updatedScoreEntry = {
          attemptId: attempt.attemptId,
          testTitle: attempt.quizTitle,
          subject: "Online Quiz & Descriptive Assessment",
          date: attempt.submittedAt.slice(0, 10),
          marksObtained: attempt.totalAwardedMarks,
          maxMarks: attempt.totalMaxMarks,
          status: "EVALUATED" as const,
          teacherRemark: `${input.teacherFeedback.trim()} (Evaluated by ${input.actorName})`,
        };
        if (scoreIdx >= 0) {
          student.assessmentScores[scoreIdx] = updatedScoreEntry;
        } else {
          student.assessmentScores.unshift(updatedScoreEntry);
        }
        await db.systemSetting.update({
          where: { key: stuKey },
          data: { value: student as any, updatedBy: input.actorName },
        });
      }
    }

    await this.logAudit({
      action: "QUIZ_DESCRIPTIVE_GRADED",
      actor: input.actorName,
      target: attempt.attemptId,
      details: `Awarded ${attempt.totalAwardedMarks}/${attempt.totalMaxMarks} (${input.teacherFeedback})`,
    });

    return attempt;
  }

  /**
   * Verified Parent Communication Preferences Update (Requires server-side family PIN verification)
   */
  static async updateParentCommunicationPreferences(input: {
    enrollmentCode: string;
    parentPhone: string;
    accessPin: string;
    whatsappAlerts: boolean;
    emailReports: boolean;
    smsAttendanceAlerts: boolean;
    preferredLanguage: "ENGLISH" | "HINDI_ENGLISH";
  }) {
    const key = `SV_STU_${input.enrollmentCode.trim().toUpperCase()}`;
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row) {
      throw new Error("No student enrollment found with that Enrollment Code.");
    }

    const student = row.value as unknown as SkillverseStudentProfileRecord;
    const normalizedInputPhone = input.parentPhone.replace(/\D/g, "").slice(-10);
    const normalizedRecordPhone = student.parentPhone.replace(/\D/g, "").slice(-10);

    if (
      normalizedInputPhone !== normalizedRecordPhone ||
      hashPin(input.accessPin.trim()) !== student.parentAccessPinHash
    ) {
      throw new Error(
        "Parent authorization failed. Cannot modify communication preferences for another family."
      );
    }

    student.communicationPreferences = {
      whatsappAlerts: input.whatsappAlerts,
      emailReports: input.emailReports,
      smsAttendanceAlerts: input.smsAttendanceAlerts,
      preferredLanguage: input.preferredLanguage,
      updatedAt: new Date().toISOString(),
    };

    await db.systemSetting.update({
      where: { key },
      data: { value: student as any },
    });

    return student.communicationPreferences;
  }

  /**
   * LMS Multi-Type Quiz Evaluation Engine (MCQ, MSQ, and Descriptive)
   */
  static evaluateQuizSubmissionPure(params: {
    questions: {
      id: string;
      type: "MCQ" | "MSQ" | "DESCRIPTIVE";
      prompt: string;
      marks: number;
      correctOptionIndex?: number;
      correctOptionIndices?: number[];
    }[];
    responses: {
      questionId: string;
      selectedOptionIndex?: number;
      selectedOptionIndices?: number[];
      descriptiveAnswer?: string;
    }[];
  }) {
    let autoAwardedMarks = 0;
    let totalMaxMarks = 0;
    let hasDescriptivePending = false;

    const itemResults = params.questions.map((q) => {
      totalMaxMarks += q.marks;
      const resp = params.responses.find((r) => r.questionId === q.id);

      if (q.type === "MCQ") {
        const isCorrect =
          resp?.selectedOptionIndex !== undefined &&
          resp.selectedOptionIndex === q.correctOptionIndex;
        const awarded = isCorrect ? q.marks : 0;
        autoAwardedMarks += awarded;
        return {
          questionId: q.id,
          type: q.type,
          awardedMarks: awarded,
          maxMarks: q.marks,
          status: "AUTO_EVALUATED" as const,
        };
      }

      if (q.type === "MSQ") {
        const expected = [...(q.correctOptionIndices || [])].sort().join(",");
        const actual = [...(resp?.selectedOptionIndices || [])].sort().join(",");
        const isCorrect = expected.length > 0 && expected === actual;
        const awarded = isCorrect ? q.marks : 0;
        autoAwardedMarks += awarded;
        return {
          questionId: q.id,
          type: q.type,
          awardedMarks: awarded,
          maxMarks: q.marks,
          status: "AUTO_EVALUATED" as const,
        };
      }

      // DESCRIPTIVE question requires teacher evaluation
      hasDescriptivePending = true;
      return {
        questionId: q.id,
        type: q.type,
        awardedMarks: 0,
        maxMarks: q.marks,
        descriptiveAnswer: resp?.descriptiveAnswer || "",
        status: "PENDING_TEACHER_EVALUATION" as const,
      };
    });

    return {
      autoAwardedMarks,
      totalMaxMarks,
      hasDescriptivePending,
      overallStatus: hasDescriptivePending
        ? ("PENDING_TEACHER_REVIEW" as const)
        : ("COMPLETED" as const),
      itemResults,
    };
  }

  static async recordAnalyticsEvent(event: {
    eventType:
      | "COURSE_PAGE_VIEW"
      | "FEE_PAGE_VIEW"
      | "DEMO_FORM_COMPLETED"
      | "ADMISSION_ENQUIRY_SUBMITTED"
      | "CHECKOUT_STARTED"
      | "PAYMENT_CONFIRMED";
    courseSlug?: string;
    gradeBand?: string;
    source?: string;
  }) {
    try {
      await db.systemSetting.create({
        data: {
          key: `SV_EVT_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: CATEGORIES.ANALYTICS,
          value: {
            ...event,
            timestamp: new Date().toISOString(),
          } as any,
          isSecret: false,
        },
      });
    } catch {
      // Non-blocking telemetry
    }
  }

  static async logNotification(entry: {
    type: string;
    recipientRole: string;
    recipientMasked: string;
    channel: "EMAIL" | "WHATSAPP";
    referenceNumber: string;
    status: string;
  }) {
    try {
      await db.systemSetting.create({
        data: {
          key: `SV_NOTIF_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: CATEGORIES.NOTIFICATION,
          value: {
            ...entry,
            timestamp: new Date().toISOString(),
          } as any,
          isSecret: false,
        },
      });
    } catch {
      // Non-blocking notification audit
    }
  }

  static async logAudit(entry: {
    action: string;
    actor: string;
    target: string;
    details: string;
  }) {
    try {
      await db.systemSetting.create({
        data: {
          key: `SV_AUD_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: CATEGORIES.AUDIT,
          value: {
            ...entry,
            timestamp: new Date().toISOString(),
          } as any,
          isSecret: false,
        },
      });
    } catch {
      // Non-blocking audit log
    }
  }
}
