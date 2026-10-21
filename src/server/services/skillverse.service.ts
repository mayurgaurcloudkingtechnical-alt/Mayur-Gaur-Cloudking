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
