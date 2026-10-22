import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import {
  SkillverseService,
  type SkillverseAdmissionStage,
  type SkillverseStudentProfileRecord,
  type SkillverseInvoiceRecord,
  type SkillverseCertificateRecord,
} from "@/server/services/skillverse.service";
import { db } from "@/server/db/client";

export const HIGHER_AUTHORITY_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
];

const ADMIN_FINANCE_ROLES = [
  ...HIGHER_AUTHORITY_ROLES,
  "ACCOUNTANT",
];

const ADMISSIONS_ROLES = [
  ...ADMIN_FINANCE_ROLES,
  "COUNSELOR",
  "TELECALLER",
];

const ACADEMIC_ROLES = [
  ...ADMIN_FINANCE_ROLES,
  "TRAINER",
];

function requireRoles(ctx: any, allowed: string[]) {
  const role = ctx.user?.roleCode || ctx.session?.user?.roleCode;
  if (!role || !allowed.includes(role)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this Skillverse administrative action.",
    });
  }
  return {
    role,
    name: ctx.user?.name || ctx.session?.user?.name || role,
  };
}

export const skillverseRouter = router({
  getPublicCatalog: publicProcedure.query(async () => {
    return SkillverseService.getPublicCatalogAndConfig();
  }),

  getCurrentStaffSession: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const isHigherAuthority = HIGHER_AUTHORITY_ROLES.includes(ctx.user.roleCode as any);
    let provisionedCred: any = null;
    if (!isHigherAuthority && ctx.user.email) {
      const authCheck = await SkillverseService.verifyStaffAccessAuthority({
        email: ctx.user.email,
        roleCode: ctx.user.roleCode,
      });
      provisionedCred = authCheck.authorized ? (authCheck as any).credential : null;
    }

    return {
      id: ctx.user.id,
      name: ctx.user.name,
      firstName: ctx.user.firstName,
      lastName: ctx.user.lastName,
      email: ctx.user.email,
      roleCode: ctx.user.roleCode,
      isHigherAuthority,
      isProvisionedStaff: Boolean(provisionedCred),
      provisionedRole: provisionedCred?.role || (isHigherAuthority ? ctx.user.roleCode : null),
      canAccessSkillverse: isHigherAuthority || Boolean(provisionedCred),
    };
  }),

  calculateFeeBreakdown: publicProcedure
    .input(
      z.object({
        packageId: z.string().optional(),
        addonId: z.string().optional(),
        standaloneCourseSlug: z.string().optional(),
        includeOneTimeAdmissionFees: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const config = await SkillverseService.getCatalogAndConfig();
      return SkillverseService.calculateTransparentFeeBreakdown({
        ...input,
        packages: config.packages,
        addons: config.addons,
        courses: config.courses,
        feeRules: config.feeRules,
      });
    }),

  submitAdmissionEnquiry: publicProcedure
    .input(
      z.object({
        studentName: z.string().min(2).max(100),
        parentName: z.string().min(2).max(100),
        phone: z.string().min(10).max(20),
        email: z.string().email(),
        currentClass: z.string(),
        board: z.string(),
        schoolName: z.string().optional(),
        preferredCourseSlug: z.string(),
        preferredPackageId: z.string().optional(),
        competitiveAddonId: z.string().optional(),
        preferredBatchTiming: z.string().default("Evening (4:00 PM – 6:00 PM)"),
        deliveryMode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).default("HYBRID"),
        city: z.string().min(2),
        locality: z.string().min(2),
        enquirySource: z.string().optional(),
        campaign: z.string().optional(),
        parentConsentAccepted: z.boolean(),
        initialStage: z
          .enum([
            "ENQUIRY",
            "FOLLOW_UP",
            "DEMO_BOOKING",
            "ASSESSMENT",
            "COUNSELING",
            "APPLICATION",
            "PARENT_CONSENT",
            "FEE_PAYMENT",
            "ENROLLMENT",
            "BATCH_ALLOCATION",
            "ACTIVE_STUDENT",
          ])
          .optional(),
        demoScheduledAt: z.string().optional(),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (input.honeypot) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Spam submission rejected." });
      }
      return SkillverseService.submitAdmissionEnquiry(input);
    }),

  submitDiagnosticAssessment: publicProcedure
    .input(
      z.object({
        studentName: z.string().min(2),
        parentName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email(),
        currentClass: z.string(),
        board: z.string(),
        answers: z.array(
          z.object({
            questionId: z.string(),
            selectedIndex: z.number(),
          })
        ),
        parentConsentAccepted: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.submitDiagnosticAssessment(input);
    }),

  verifyParentPortalAccess: publicProcedure
    .input(
      z.object({
        enrollmentCode: z.string().min(4),
        parentPhone: z.string().min(10),
        accessPin: z.string().min(4),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.getVerifiedParentPortalData(input);
    }),

  getStudentPortalData: publicProcedure
    .input(
      z.object({
        enrollmentCode: z.string().min(4),
        studentEmail: z.string().email().optional(),
        studentPassword: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.getVerifiedStudentPortalData(input);
    }),

  verifyCertificate: publicProcedure
    .input(z.object({ certificateNumber: z.string().min(5) }))
    .query(async ({ input }) => {
      return SkillverseService.verifyCertificateByNumber(input.certificateNumber);
    }),

  getAdminDashboardData: protectedProcedure.query(async ({ ctx }) => {
    requireRoles(ctx, [...ADMISSIONS_ROLES, "TRAINER"]);
    return SkillverseService.getAdminDashboardData();
  }),

  updateEnquiryStage: protectedProcedure
    .input(
      z.object({
        referenceNumber: z.string(),
        stage: z.enum([
          "ENQUIRY",
          "FOLLOW_UP",
          "DEMO_BOOKING",
          "ASSESSMENT",
          "COUNSELING",
          "APPLICATION",
          "PARENT_CONSENT",
          "FEE_PAYMENT",
          "ENROLLMENT",
          "BATCH_ALLOCATION",
          "ACTIVE_STUDENT",
        ]),
        assignedCounselor: z.string().optional(),
        followUpDate: z.string().optional(),
        followUpNotes: z.string().optional(),
        demoScheduledAt: z.string().optional(),
        allocatedBatchCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMISSIONS_ROLES);
      return SkillverseService.updateEnquiryStage({
        ...input,
        stage: input.stage as SkillverseAdmissionStage,
        actorName: actor.name,
      });
    }),

  deleteEnquiry: protectedProcedure
    .input(z.object({ referenceNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMISSIONS_ROLES);
      return SkillverseService.deleteEnquiry(input.referenceNumber, actor.name);
    }),

  addFollowUpNote: protectedProcedure
    .input(
      z.object({
        referenceNumber: z.string(),
        note: z.string().min(1),
        nextFollowUpDate: z.string().optional(),
        stage: z
          .enum([
            "ENQUIRY",
            "FOLLOW_UP",
            "DEMO_BOOKING",
            "ASSESSMENT",
            "COUNSELING",
            "APPLICATION",
            "PARENT_CONSENT",
            "FEE_PAYMENT",
            "ENROLLMENT",
            "BATCH_ALLOCATION",
            "ACTIVE_STUDENT",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMISSIONS_ROLES);
      return SkillverseService.addFollowUpNote({
        ...input,
        stage: input.stage as SkillverseAdmissionStage | undefined,
        actorName: actor.name,
      });
    }),

  createDirectLead: protectedProcedure
    .input(
      z.object({
        studentName: z.string().min(2),
        parentName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().email(),
        currentClass: z.string(),
        board: z.string().default("CBSE"),
        schoolName: z.string().optional(),
        preferredCourseSlug: z.string(),
        preferredPackageId: z.string().optional(),
        competitiveAddonId: z.string().optional(),
        deliveryMode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).default("HYBRID"),
        city: z.string().default("Prayagraj"),
        locality: z.string().default("Civil Lines"),
        stage: z.string().default("ENQUIRY"),
        notes: z.string().optional(),
        followUpDate: z.string().optional(),
        demoScheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMISSIONS_ROLES);
      return SkillverseService.createDirectLead({
        ...input,
        actorName: actor.name,
      });
    }),

  markStudentAttendance: protectedProcedure
    .input(
      z.object({
        enrollmentCode: z.string(),
        date: z.string(),
        subject: z.string(),
        status: z.enum(["PRESENT", "ABSENT", "LATE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      const key = `SV_STU_${input.enrollmentCode.trim().toUpperCase()}`;
      const row = await db.systemSetting.findUnique({ where: { key } });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student record not found." });
      }
      const student = row.value as unknown as SkillverseStudentProfileRecord;
      student.attendanceRecords.unshift({
        date: input.date,
        subject: input.subject,
        status: input.status,
        markedBy: actor.name,
      });
      const presentCount = student.attendanceRecords.filter((r) => r.status !== "ABSENT").length;
      student.attendancePercent = Math.round(
        (presentCount / Math.max(1, student.attendanceRecords.length)) * 100
      );

      await db.systemSetting.update({
        where: { key },
        data: { value: student as any },
      });

      return student;
    }),

  saveCmsSettings: protectedProcedure
    .input(
      z.object({
        heroHeadline: z.string().min(5),
        heroSubheadline: z.string().min(10),
        announcementBanner: z.string(),
        contactAddress: z.string(),
        contactPhone: z.string(),
        contactWhatsapp: z.string(),
        contactEmail: z.string().email(),
        supportHours: z.string(),
        seoTitle: z.string(),
        seoDescription: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMIN_FINANCE_ROLES);
      await db.systemSetting.upsert({
        where: { key: "SKILLVERSE_CMS_SETTINGS_V1" },
        update: { value: input as any, updatedBy: actor.name },
        create: {
          key: "SKILLVERSE_CMS_SETTINGS_V1",
          category: "SKILLVERSE_CONFIG",
          value: input as any,
          isSecret: false,
          updatedBy: actor.name,
        },
      });
      await SkillverseService.logAudit({
        action: "CMS_SETTINGS_UPDATED",
        actor: actor.name,
        target: "SKILLVERSE_CMS_SETTINGS_V1",
        details: "Updated Skillverse homepage CMS, SEO, and contact settings.",
      });
      return input;
    }),

  updateFeeRules: protectedProcedure
    .input(
      z.object({
        admissionAndRegistrationFeeInr: z.number().min(0),
        studentIdAndLearningKitFeeInr: z.number().min(0),
        initialAcademicAssessmentFeeInr: z.number().min(0),
        demoClassFeeInr: z.number().min(0),
        gstPercentOnApplicableItems: z.number().min(0).max(28),
        additionalMaterialsDisclosure: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMIN_FINANCE_ROLES);
      await db.systemSetting.upsert({
        where: { key: "SKILLVERSE_FEE_RULES_V1" },
        update: { value: input as any, updatedBy: actor.name },
        create: {
          key: "SKILLVERSE_FEE_RULES_V1",
          category: "SKILLVERSE_CONFIG",
          value: input as any,
          isSecret: false,
          updatedBy: actor.name,
        },
      });
      await SkillverseService.logAudit({
        action: "FEE_RULES_UPDATED",
        actor: actor.name,
        target: "SKILLVERSE_FEE_RULES_V1",
        details: `Updated admission fee (₹${input.admissionAndRegistrationFeeInr}) and kit fee (₹${input.studentIdAndLearningKitFeeInr}).`,
      });
      return input;
    }),

  issueCertificate: protectedProcedure
    .input(
      z.object({
        studentId: z.string(),
        studentName: z.string(),
        classGrade: z.string(),
        courseTitle: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMIN_FINANCE_ROLES);
      return SkillverseService.issueCertificate({
        ...input,
        actorName: actor.name,
      });
    }),

  revokeCertificate: protectedProcedure
    .input(
      z.object({
        certificateNumber: z.string(),
        reason: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMIN_FINANCE_ROLES);
      const key = `SV_CERT_${input.certificateNumber.trim().toUpperCase()}`;
      const row = await db.systemSetting.findUnique({ where: { key } });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Certificate not found." });
      }
      const cert = row.value as unknown as SkillverseCertificateRecord;
      cert.status = "REVOKED";
      cert.revocationReason = input.reason;

      await db.systemSetting.update({
        where: { key },
        data: { value: cert as any, updatedBy: actor.name },
      });

      await SkillverseService.logAudit({
        action: "CERTIFICATE_REVOKED",
        actor: actor.name,
        target: input.certificateNumber,
        details: `Revoked certificate: ${input.reason}`,
      });

      return cert;
    }),

  upsertCourse: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(3),
        title: z.string().min(3),
        priceInr: z.number().min(0).optional(),
        monthlyFeeInr: z.number().min(0).optional(),
        oneTimeFeeInr: z.number().min(0).nullable().optional(),
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        shortSummary: z.string().optional(),
        batchTiming: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.upsertCourse({
        course: input,
        actorName: actor.name,
      });
    }),

  upsertPackage: protectedProcedure
    .input(
      z.object({
        id: z.string().min(2),
        monthlyPriceInr: z.number().min(0).optional(),
        monthlyFeeInr: z.number().min(0).optional(),
        name: z.string().optional(),
        subjectsSummary: z.string().optional(),
        status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ADMIN_FINANCE_ROLES);
      return SkillverseService.upsertPackage({
        pkg: input,
        actorName: actor.name,
      });
    }),

  upsertBatch: protectedProcedure
    .input(
      z.object({
        batchCode: z.string().min(3),
        title: z.string().min(3),
        gradeBand: z.string().optional(),
        courseSlug: z.string().optional(),
        teacherName: z.string().optional(),
        schedule: z.string().optional(),
        deliveryMode: z.enum(["ONLINE", "OFFLINE", "HYBRID"]).optional(),
        capacity: z.number().min(1).max(200).optional(),
        status: z.enum(["OPEN", "ONGOING", "COMPLETED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.upsertBatch({
        batch: input,
        actorName: actor.name,
      });
    }),

  evaluateQuizAttempt: publicProcedure
    .input(
      z.object({
        enrollmentCode: z.string().optional(),
        quizTitle: z.string(),
        questions: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["MCQ", "MSQ", "DESCRIPTIVE"]),
            prompt: z.string(),
            marks: z.number(),
            correctOptionIndex: z.number().optional(),
            correctOptionIndices: z.array(z.number()).optional(),
          })
        ),
        responses: z.array(
          z.object({
            questionId: z.string(),
            selectedOptionIndex: z.number().optional(),
            selectedOptionIndices: z.array(z.number()).optional(),
            descriptiveAnswer: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.submitAndPersistQuizAttempt(input);
    }),

  gradeDescriptiveQuizAttempt: protectedProcedure
    .input(
      z.object({
        attemptId: z.string().min(4),
        descriptiveMarksAwarded: z.number().min(0),
        teacherFeedback: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.gradeDescriptiveQuizAttempt({
        ...input,
        actorName: actor.name,
      });
    }),

  updateParentCommunicationPreferences: publicProcedure
    .input(
      z.object({
        enrollmentCode: z.string().min(4),
        parentPhone: z.string().min(10),
        accessPin: z.string().min(4),
        whatsappAlerts: z.boolean(),
        emailReports: z.boolean(),
        smsAttendanceAlerts: z.boolean(),
        preferredLanguage: z.enum(["ENGLISH", "HINDI_ENGLISH"]),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.updateParentCommunicationPreferences(input);
    }),

  // =========================================================================
  // HIGHER AUTHORITY STAFF CREDENTIALS DESK
  // =========================================================================

  verifyStaffAccessAuthority: publicProcedure
    .input(
      z.object({
        email: z.string().optional(),
        roleCode: z.string().optional(),
        accessKey: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return SkillverseService.verifyStaffAccessAuthority(input);
    }),

  listStaffCredentials: protectedProcedure.query(async ({ ctx }) => {
    requireRoles(ctx, ADMIN_FINANCE_ROLES);
    return SkillverseService.listStaffCredentials();
  }),

  provisionStaffCredential: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        fullName: z.string().min(2),
        role: z.enum([
          "SUPER_ADMIN",
          "DIRECTOR",
          "SKILLVERSE_ADMIN",
          "FACULTY",
          "COUNSELOR",
          "ACADEMIC_COORDINATOR",
        ]),
        department: z.string().min(2),
        accessKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, HIGHER_AUTHORITY_ROLES);
      return SkillverseService.provisionStaffCredential({
        ...input,
        actorName: actor.name,
        actorRole: actor.role,
      });
    }),

  revokeStaffCredential: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        status: z.enum(["SUSPENDED", "REVOKED", "ACTIVE"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, HIGHER_AUTHORITY_ROLES);
      return SkillverseService.revokeStaffCredential({
        ...input,
        actorName: actor.name,
        actorRole: actor.role,
      });
    }),

  // =========================================================================
  // LIVE CLASSROOM & YOUTUBE PIPELINE PROCEDURES
  // =========================================================================

  listLiveClassSessions: publicProcedure
    .input(z.object({ batchCode: z.string().optional() }).optional())
    .query(async ({ input }) => {
      return SkillverseService.listLiveClassSessions(input?.batchCode);
    }),

  createOrScheduleLiveClass: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3),
        subject: z.string().min(2),
        grade: z.string().min(2),
        moduleName: z.string().min(2),
        topic: z.string().min(2),
        batchCode: z.string().min(2),
        teacherName: z.string().min(2),
        scheduledStartTime: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.createOrScheduleLiveClass({
        ...input,
        actorName: actor.name,
      });
    }),

  startLiveClassSession: protectedProcedure
    .input(z.object({ sessionCode: z.string().min(3) }))
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.startLiveClassSession({
        sessionCode: input.sessionCode,
        actorName: actor.name,
      });
    }),

  joinLiveClassSession: publicProcedure
    .input(
      z.object({
        sessionCode: z.string().min(3),
        enrollmentCode: z.string().min(4),
        studentName: z.string().min(2),
      })
    )
    .mutation(async ({ input }) => {
      return SkillverseService.joinLiveClassSession(input);
    }),

  endLiveClassAndPublishToYouTube: protectedProcedure
    .input(
      z.object({
        sessionCode: z.string().min(3),
        whiteboardNotesUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actor = requireRoles(ctx, ACADEMIC_ROLES);
      return SkillverseService.endLiveClassAndPublishToYouTube({
        sessionCode: input.sessionCode,
        whiteboardNotesUrl: input.whiteboardNotesUrl,
        actorName: actor.name,
      });
    }),
});
