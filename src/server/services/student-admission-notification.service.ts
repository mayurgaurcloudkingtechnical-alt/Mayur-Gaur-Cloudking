import { db } from "@/server/db/client";
import { EmailService } from "./email.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { AuditService } from "./audit.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

export type PostcardChannel = "EMAIL" | "WHATSAPP" | "BOTH";
export type CredentialMode = "KEEP_EXISTING" | "GENERATE_TEMPORARY";

export interface StudentAdmissionNotificationInput {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  studentId: string;
  admissionNumber: string;
  courseTitle: string;
  specialization?: string | null;
  providerName?: string | null;
  temporaryPassword?: string | null;
  loginEmail?: string;
  counselorName?: string | null;
  counselorPhone?: string | null;
  leadId?: string | null;
}

export interface StudentDispatchStatusResult {
  applicationId?: string;
  applicationNumber?: string;
  studentProfileId?: string;
  studentId?: string;
  userId?: string;
  studentName: string;
  rawEmail: string;
  maskedEmail: string;
  rawPhone: string;
  maskedPhone: string;
  courseTitle: string;
  specialization?: string | null;
  providerName?: string | null;
  counselorName?: string | null;
  counselorPhone?: string | null;
  hasActiveUserAccount: boolean;
  hasPasswordSet: boolean;
  accountStatus: "ACCOUNT_NOT_CREATED" | "ACCOUNT_CREATED_NOT_SENT" | "WELCOME_SENT" | "RESEND_AVAILABLE";
  lastDispatchedAt?: Date | string | null;
  lastChannel?: string | null;
  dispatchHistory: Array<{
    id: string;
    title: string;
    summary?: string | null;
    createdAt: Date | string;
    metadata?: any;
  }>;
}

export interface WelcomePostcardPreviewResult {
  studentName: string;
  studentId: string;
  admissionNumber: string;
  courseTitle: string;
  specialization?: string | null;
  providerName?: string | null;
  loginEmail: string;
  maskedEmail: string;
  maskedPhone: string;
  portalUrl: string;
  counselorName?: string | null;
  counselorPhone?: string | null;
  credentialMode: CredentialMode;
  previewTemporaryPassword?: string | null;
  emailSubject: string;
  postcardHtml: string;
  whatsappMessageText: string;
}

export interface ResendWelcomePostcardParams {
  applicationId?: string;
  studentProfileId?: string;
  channel: PostcardChannel;
  resetPassword?: boolean;
  actor: AuthenticatedUser;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class StudentAdmissionNotificationService {
  /**
   * Dispatches Admission Confirmation + Course Details + Student LMS Credentials
   * directly to the Student's Email (with BCC to softlabglobal9@gmail.com) and Student's WhatsApp.
   */
  public static async sendStudentAdmissionAndCredentialsNotification(
    input: StudentAdmissionNotificationInput
  ): Promise<{
    emailSent: boolean;
    whatsappSent: boolean;
    managementBcc: string;
  }> {
    const loginEmail = input.loginEmail || input.studentEmail;
    const tempPassword =
      input.temporaryPassword === undefined
        ? `SoftLab@2026!${input.studentId.replace(/\D/g, "").slice(-4) || "8888"}`
        : input.temporaryPassword;
    const cleanPhone = WhatsAppBusinessService.normalizePhone(input.studentPhone);

    let emailSent = false;
    let whatsappSent = false;

    // 1. Send Consolidated Email to Student + BCC to softlabglobal9@gmail.com
    try {
      const emailResult = await EmailService.sendConsolidatedAdmissionWelcomeEmail({
        to: input.studentEmail,
        studentName: input.studentName,
        studentId: input.studentId,
        admissionNumber: input.admissionNumber,
        courseName: input.courseTitle,
        specialization: input.specialization,
        providerName: input.providerName,
        loginEmail,
        temporaryPassword: tempPassword,
        counselorName: input.counselorName,
        counselorPhone: input.counselorPhone,
      });
      emailSent = emailResult.sent;
    } catch (err: any) {
      console.error(`[StudentAdmissionNotificationService] Email error for ${input.studentEmail}:`, err.message);
    }

    // 2. Send Official Admission & Credentials Message to Student's WhatsApp
    try {
      const waMessage = [
        `🎓 *OFFICIAL ADMISSION CONFIRMED — SOFTLAB GLOBAL* 🚀`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${input.studentName}*, congratulations on your admission!`,
        ``,
        `📚 *COURSE & PROGRAM DETAILS*:`,
        `• Enrolled Program: *${input.courseTitle}*`,
        ...(input.specialization ? [`• Specialization: *${input.specialization}*`] : []),
        `• Academic Provider: ${input.providerName || "SOFTLAB GLOBAL Main Campus"}`,
        `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
        ``,
        `📋 *OFFICIAL ADMISSION RECORD*:`,
        `• Student ID: *${input.studentId}*`,
        `• Admission No: *${input.admissionNumber}*`,
        ``,
        `🔑 *STUDENT LMS PORTAL LOGIN CREDENTIALS*:`,
        `• Portal Link: https://softlabglobal.com/login`,
        `• Login Username / Email: *${loginEmail}*`,
        ...(tempPassword
          ? [
              `• Temporary Password: *${tempPassword}*`,
              `_(Please sign in and change your password upon first login)_`,
            ]
          : [
              `• Account Password: *Use your registered account password*`,
              `_(If forgotten, use the 'Forgot Password / Reset' option on the portal)_`,
            ]),
        ``,
        `📞 *DEDICATED ADMISSIONS HELPLINE*:`,
        `• Dedicated Calling Line: +91 9196596979`,
        `• Official WhatsApp Helpline: +91 9196596975`,
        ...(input.counselorName ? [`• Enrolling Counselor: *${input.counselorName}*`] : []),
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `✨ We wish you an exceptional learning journey at SoftLab Global! 🌟`,
      ].join("\n");

      const waResult = await WhatsAppBusinessService.sendMessage({
        toPhone: cleanPhone,
        text: waMessage,
        leadId: input.leadId || undefined,
      });

      whatsappSent = waResult.success;
    } catch (err: any) {
      console.error(`[StudentAdmissionNotificationService] WhatsApp error for ${cleanPhone}:`, err.message);
    }

    // 3. Record timeline event
    if (input.leadId) {
      try {
        await db.customerTimelineEvent.create({
          data: {
            leadId: input.leadId,
            eventType: "ADMISSION_CREDENTIALS_DISPATCHED",
            source: "LMS",
            title: "Admission Confirmation & LMS Credentials Delivered to Student",
            summary: `Credentials sent to ${input.studentEmail} (BCC: softlabglobal9@gmail.com) and WhatsApp +91 ${cleanPhone.slice(-10)}.`,
            metadata: {
              studentId: input.studentId,
              admissionNumber: input.admissionNumber,
              emailSent,
              whatsappSent,
              managementEmail: EmailService.DEFAULT_MANAGEMENT_EMAIL,
            },
          },
        });
      } catch (logErr) {
        // non-blocking
      }
    }

    return {
      emailSent,
      whatsappSent,
      managementBcc: EmailService.DEFAULT_MANAGEMENT_EMAIL,
    };
  }

  /**
   * Batch sends Admission Confirmation + Course Details + LMS Credentials to ALL previously admitted students
   * in the database, copying softlabglobal9@gmail.com on every dispatch.
   * By default, preserves existing student passwords (resetPasswords = false).
   */
  public static async batchSendToExistingAdmittedStudents(options?: {
    resetPasswords?: boolean;
    actor?: AuthenticatedUser;
  }): Promise<{
    totalFound: number;
    processed: number;
    successful: number;
    failed: number;
    results: Array<{
      studentId: string;
      admissionNumber: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      emailSent: boolean;
      whatsappSent: boolean;
    }>;
  }> {
    const shouldReset = Boolean(options?.resetPasswords);
    const applications = await db.admissionApplication.findMany({
      include: {
        course: true,
        convertedStudentProfile: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const results: Array<{
      studentId: string;
      admissionNumber: string;
      studentName: string;
      studentEmail: string;
      studentPhone: string;
      emailSent: boolean;
      whatsappSent: boolean;
    }> = [];

    const year = new Date().getFullYear();

    for (const app of applications) {
      const studentProfile = app.convertedStudentProfile;
      const user = studentProfile?.user;
      const studentEmail = app.applicantEmail || user?.email;
      const studentPhone = app.applicantPhone || user?.phone;

      if (!studentEmail || !studentPhone) continue;

      const studentId = studentProfile?.studentId || `SLG-${year}-${app.applicationNumber.slice(-4)}`;
      const admissionNumber = app.applicationNumber;
      const studentName = app.applicantName || `${user?.firstName || "Student"} ${user?.lastName || ""}`.trim();
      const courseTitle = app.course?.title || "Professional Technology Training Program";
      const specialization = app.course?.specialization || app.universitySpecialization || null;
      const providerName = app.providerName || (app.providerType === "UNIVERSITY" ? "Dr. Preeti Global University" : "SOFTLAB GLOBAL Main Campus");

      let tempPassword: string | null = null;
      if (shouldReset && user) {
        tempPassword = `SoftLab@${year}!${studentId.replace(/\D/g, "").slice(-4) || "2026"}`;
        const passwordHash = await bcrypt.hash(tempPassword, 10);
        await db.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });
      }

      const dispatchResult = await this.sendStudentAdmissionAndCredentialsNotification({
        studentName,
        studentEmail,
        studentPhone,
        studentId,
        admissionNumber,
        courseTitle,
        specialization,
        providerName,
        temporaryPassword: tempPassword,
        loginEmail: studentEmail,
        counselorName: "SOFTLAB GLOBAL Admissions Directorate",
        counselorPhone: "9196596979",
        leadId: app.leadId,
      });

      results.push({
        studentId,
        admissionNumber,
        studentName,
        studentEmail,
        studentPhone,
        emailSent: dispatchResult.emailSent,
        whatsappSent: dispatchResult.whatsappSent,
      });
    }

    const successful = results.filter((r) => r.emailSent || r.whatsappSent).length;
    const failed = results.length - successful;

    return {
      totalFound: applications.length,
      processed: results.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Masks email for privacy and security. E.g. dubeytushar599@gmail.com -> d***9@gmail.com
   */
  public static maskEmail(email?: string | null): string {
    if (!email || !email.includes("@")) return "N/A";
    const [user, domain] = email.split("@");
    if (!user) return `***@${domain}`;
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  /**
   * Masks phone number for privacy and security. E.g. 9335946733 -> +91 93359*****
   */
  public static maskPhone(phone?: string | null): string {
    if (!phone) return "N/A";
    const clean = phone.replace(/\D/g, "");
    const last10 = clean.slice(-10);
    if (last10.length === 10) {
      return `+91 ${last10.slice(0, 5)}*****`;
    }
    return `+91 ${last10}`;
  }

  /**
   * Generates a cryptographically strong temporary password.
   */
  public static generateSecureTemporaryPassword(studentId?: string): string {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const idDigits = (studentId || "").replace(/\D/g, "").slice(-4) || "2026";
    return `SoftLab#${randomHex}!${idDigits}`;
  }

  /**
   * Strict RBAC permission verification.
   * Super Admins, Directors, Admins, and Managers have system-wide access.
   * Counselors have access only to students assigned to them.
   * Trainers, Telecallers, and other roles are prohibited.
   */
  public static checkDispatchPermission(
    actor: AuthenticatedUser,
    counselorId?: string | null,
    assignedCounselorId?: string | null
  ): boolean {
    const elevatedRoles: UserRoleCode[] = [
      UserRoleCode.SUPER_ADMIN,
      UserRoleCode.DIRECTOR,
      UserRoleCode.ADMIN,
      UserRoleCode.MANAGER,
    ];

    if (elevatedRoles.includes(actor.roleCode)) {
      return true;
    }

    if (actor.roleCode === UserRoleCode.COUNSELOR) {
      const isOwner =
        (counselorId && counselorId === actor.id) ||
        (assignedCounselorId && assignedCounselorId === actor.id);
      if (!isOwner) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are only permitted to preview or resend welcome materials for your own assigned students.",
        });
      }
      return true;
    }

    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your role is not authorized to view or resend student credentials.",
    });
  }

  /**
   * Resolves common dispatch target data from either applicationId or studentProfileId
   */
  public static async resolveDispatchTarget(params: {
    applicationId?: string;
    studentProfileId?: string;
    actor: AuthenticatedUser;
  }) {
    if (!params.applicationId && !params.studentProfileId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Either applicationId or studentProfileId must be provided.",
      });
    }

    let app: any = null;
    let studentProfile: any = null;

    if (params.applicationId) {
      app = await db.admissionApplication.findUnique({
        where: { id: params.applicationId },
        include: {
          course: true,
          convertedStudentProfile: {
            include: { user: true, enrollments: { include: { course: true, batch: true } } },
          },
          lead: {
            include: { assignedCounselor: true },
          },
        },
      });

      if (!app) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Admission application not found." });
      }

      studentProfile = app.convertedStudentProfile;
    } else if (params.studentProfileId) {
      studentProfile = await db.studentProfile.findUnique({
        where: { id: params.studentProfileId },
        include: {
          user: true,
          convertedApplication: {
            include: {
              course: true,
              lead: { include: { assignedCounselor: true } },
            },
          },
          enrollments: {
            include: { course: true, batch: true },
          },
        },
      });

      if (!studentProfile) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Student profile not found." });
      }

      app = studentProfile.convertedApplication;
    }

    const counselorId = app?.counselorId || app?.lead?.assignedCounselorId || null;
    const assignedCounselorId = app?.lead?.assignedCounselorId || null;

    // RBAC check
    this.checkDispatchPermission(params.actor, counselorId, assignedCounselorId);

    const user = studentProfile?.user || null;
    const studentName = (
      app?.applicantName ||
      (user ? `${user.firstName} ${user.lastName}` : "Admitted Student")
    ).trim();

    const rawEmail = (app?.applicantEmail || user?.email || "").trim();
    const rawPhone = (app?.applicantPhone || user?.phone || studentProfile?.whatsappNumber || "").trim();

    const courseTitle =
      app?.course?.title ||
      studentProfile?.enrollments?.[0]?.course?.title ||
      "Professional Technology Training Program";

    const specialization = app?.course?.specialization || app?.universitySpecialization || null;
    const providerName =
      app?.providerName ||
      (app?.providerType === "UNIVERSITY"
        ? "Dr. Preeti Global University"
        : "SOFTLAB GLOBAL Main Campus");

    const counselorName =
      app?.lead?.assignedCounselor?.firstName
        ? `${app.lead.assignedCounselor.firstName} ${app.lead.assignedCounselor.lastName || ""}`.trim()
        : "SOFTLAB GLOBAL Admissions Directorate";

    const counselorPhone =
      app?.lead?.assignedCounselor?.phone || "9196596979";

    const studentId =
      studentProfile?.studentId ||
      (app?.applicationNumber ? `SLG-2026-${app.applicationNumber.slice(-4)}` : "SG-2026-PENDING");
    const admissionNumber = app?.applicationNumber || studentId;

    return {
      app,
      studentProfile,
      user,
      leadId: app?.leadId || null,
      applicationId: app?.id || undefined,
      applicationNumber: admissionNumber,
      studentProfileId: studentProfile?.id || undefined,
      studentId,
      studentName,
      rawEmail,
      rawPhone,
      courseTitle,
      specialization,
      providerName,
      counselorName,
      counselorPhone,
      hasActiveUserAccount: Boolean(user?.id),
      hasPasswordSet: Boolean(user?.passwordHash),
    };
  }

  /**
   * Returns comprehensive dispatch history, current account status, and delivery metadata
   */
  public static async getStudentDispatchStatus(params: {
    applicationId?: string;
    studentProfileId?: string;
    actor: AuthenticatedUser;
  }): Promise<StudentDispatchStatusResult> {
    const target = await this.resolveDispatchTarget(params);

    // Retrieve timeline events for this lead
    const timelineEvents = target.leadId
      ? await db.customerTimelineEvent.findMany({
          where: {
            leadId: target.leadId,
            eventType: "ADMISSION_CREDENTIALS_DISPATCHED",
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

    const lastEvent = timelineEvents[0];
    let accountStatus: StudentDispatchStatusResult["accountStatus"] = "ACCOUNT_NOT_CREATED";

    if (target.hasActiveUserAccount) {
      if (timelineEvents.length > 0) {
        accountStatus = "WELCOME_SENT";
      } else {
        accountStatus = "ACCOUNT_CREATED_NOT_SENT";
      }
    }

    const lastMeta: any = lastEvent?.metadata || {};
    let lastChannel: string | null = null;
    if (lastMeta?.emailSent && lastMeta?.whatsappSent) {
      lastChannel = "EMAIL & WHATSAPP";
    } else if (lastMeta?.emailSent) {
      lastChannel = "EMAIL";
    } else if (lastMeta?.whatsappSent) {
      lastChannel = "WHATSAPP";
    }

    return {
      applicationId: target.applicationId,
      applicationNumber: target.applicationNumber,
      studentProfileId: target.studentProfileId,
      studentId: target.studentId,
      userId: target.user?.id,
      studentName: target.studentName,
      rawEmail: target.rawEmail,
      maskedEmail: this.maskEmail(target.rawEmail),
      rawPhone: target.rawPhone,
      maskedPhone: this.maskPhone(target.rawPhone),
      courseTitle: target.courseTitle,
      specialization: target.specialization,
      providerName: target.providerName,
      counselorName: target.counselorName,
      counselorPhone: target.counselorPhone,
      hasActiveUserAccount: target.hasActiveUserAccount,
      hasPasswordSet: target.hasPasswordSet,
      accountStatus,
      lastDispatchedAt: lastEvent?.createdAt || null,
      lastChannel,
      dispatchHistory: timelineEvents.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary,
        createdAt: e.createdAt,
        metadata: e.metadata,
      })),
    };
  }

  /**
   * Previews the rendered HTML postcard and WhatsApp text before dispatching
   */
  public static async previewWelcomePostcard(params: {
    applicationId?: string;
    studentProfileId?: string;
    credentialMode: CredentialMode;
    actor: AuthenticatedUser;
  }): Promise<WelcomePostcardPreviewResult> {
    const target = await this.resolveDispatchTarget(params);

    const isTemporaryMode = params.credentialMode === "GENERATE_TEMPORARY";
    const previewPassword = isTemporaryMode ? "SoftLab#PREVIEW!2026" : null;
    const portalUrl = "https://softlabglobal.com/login";

    const postcardHtml = EmailService.generateConsolidatedAdmissionWelcomeHtml({
      studentName: target.studentName,
      studentId: target.studentId,
      admissionNumber: target.applicationNumber,
      courseName: target.courseTitle,
      specialization: target.specialization,
      providerName: target.providerName,
      loginEmail: target.rawEmail,
      temporaryPassword: previewPassword,
      counselorName: target.counselorName,
      counselorPhone: target.counselorPhone,
    });

    const waLines = [
      `🎓 *OFFICIAL ADMISSION CONFIRMED — SOFTLAB GLOBAL* 🚀`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `Dear *${target.studentName}*, congratulations on your admission!`,
      ``,
      `📚 *COURSE & PROGRAM DETAILS*:`,
      `• Enrolled Program: *${target.courseTitle}*`,
      ...(target.specialization ? [`• Specialization: *${target.specialization}*`] : []),
      `• Academic Provider: ${target.providerName || "SOFTLAB GLOBAL Main Campus"}`,
      `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
      ``,
      `📋 *OFFICIAL ADMISSION RECORD*:`,
      `• Student ID: *${target.studentId}*`,
      `• Admission No: *${target.applicationNumber}*`,
      ``,
      `🔑 *STUDENT LMS PORTAL LOGIN CREDENTIALS*:`,
      `• Portal Link: ${portalUrl}`,
      `• Login Username / Email: *${target.rawEmail}*`,
      ...(previewPassword
        ? [
            `• Temporary Password: *${previewPassword}*`,
            `_(Please sign in and change your password upon first login)_`,
          ]
        : [
            `• Account Password: *Use your registered account password*`,
            `_(If forgotten, use the 'Forgot Password / Reset' option on the portal)_`,
          ]),
      ``,
      `📞 *DEDICATED ADMISSIONS HELPLINE*:`,
      `• Dedicated Calling Line: +91 9196596979`,
      `• Official WhatsApp Helpline: +91 9196596975`,
      ...(target.counselorName ? [`• Enrolling Counselor: *${target.counselorName}*`] : []),
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `✨ We wish you an exceptional learning journey at SoftLab Global! 🌟`,
    ];

    return {
      studentName: target.studentName,
      studentId: target.studentId,
      admissionNumber: target.applicationNumber,
      courseTitle: target.courseTitle,
      specialization: target.specialization,
      providerName: target.providerName,
      loginEmail: target.rawEmail,
      maskedEmail: this.maskEmail(target.rawEmail),
      maskedPhone: this.maskPhone(target.rawPhone),
      portalUrl,
      counselorName: target.counselorName,
      counselorPhone: target.counselorPhone,
      credentialMode: params.credentialMode,
      previewTemporaryPassword: previewPassword,
      emailSubject: `Official Admission Confirmation & LMS Credentials — SOFTLAB GLOBAL (${target.studentId})`,
      postcardHtml,
      whatsappMessageText: waLines.join("\n"),
    };
  }

  /**
   * Permanently dispatches official welcome postcard & login instructions via Email, WhatsApp, or Both.
   * Safe credential handling:
   * - By default (resetPassword = false): preserves current password, sends access guide & login portal link.
   * - With explicit confirmation (resetPassword = true): generates secure temp password, bcrypt-hashes it, updates DB, and dispatches.
   */
  public static async resendStudentWelcomePostcard(params: ResendWelcomePostcardParams): Promise<{
    success: boolean;
    emailSent: boolean;
    whatsappSent: boolean;
    resetPasswordApplied: boolean;
    channel: PostcardChannel;
    maskedEmail: string;
    maskedPhone: string;
    managementBcc: string;
    dispatchedAt: string;
  }> {
    const target = await this.resolveDispatchTarget(params);

    if (!target.rawEmail && !target.rawPhone) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No email or phone number found for this student record.",
      });
    }

    let temporaryPasswordToSend: string | null = null;
    const shouldResetPassword = Boolean(params.resetPassword);

    if (shouldResetPassword) {
      if (!target.user) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cannot reset password because the student user account has not yet been initialized.",
        });
      }

      temporaryPasswordToSend = this.generateSecureTemporaryPassword(target.studentId);
      const passwordHash = await bcrypt.hash(temporaryPasswordToSend, 10);

      await db.user.update({
        where: { id: target.user.id },
        data: { passwordHash },
      });
    }

    let emailSent = false;
    let whatsappSent = false;

    // 1. Send Email if channel includes EMAIL
    if (params.channel === "EMAIL" || params.channel === "BOTH") {
      if (target.rawEmail && target.rawEmail.includes("@")) {
        try {
          const emailRes = await EmailService.sendConsolidatedAdmissionWelcomeEmail({
            to: target.rawEmail,
            studentName: target.studentName,
            studentId: target.studentId,
            admissionNumber: target.applicationNumber,
            courseName: target.courseTitle,
            specialization: target.specialization,
            providerName: target.providerName,
            loginEmail: target.rawEmail,
            temporaryPassword: temporaryPasswordToSend,
            counselorName: target.counselorName,
            counselorPhone: target.counselorPhone,
          });
          emailSent = emailRes.sent;
        } catch (err: any) {
          console.error(`[StudentAdmissionNotificationService] Resend Email error for ${target.rawEmail}:`, err.message);
        }
      }
    }

    // 2. Send WhatsApp if channel includes WHATSAPP
    if (params.channel === "WHATSAPP" || params.channel === "BOTH") {
      const cleanPhone = WhatsAppBusinessService.normalizePhone(target.rawPhone);
      if (cleanPhone) {
        try {
          const waLines = [
            `🎓 *OFFICIAL ADMISSION CONFIRMED — SOFTLAB GLOBAL* 🚀`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `Dear *${target.studentName}*, congratulations on your admission!`,
            ``,
            `📚 *COURSE & PROGRAM DETAILS*:`,
            `• Enrolled Program: *${target.courseTitle}*`,
            ...(target.specialization ? [`• Specialization: *${target.specialization}*`] : []),
            `• Academic Provider: ${target.providerName || "SOFTLAB GLOBAL Main Campus"}`,
            `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
            ``,
            `📋 *OFFICIAL ADMISSION RECORD*:`,
            `• Student ID: *${target.studentId}*`,
            `• Admission No: *${target.applicationNumber}*`,
            ``,
            `🔑 *STUDENT LMS PORTAL LOGIN CREDENTIALS*:`,
            `• Portal Link: https://softlabglobal.com/login`,
            `• Login Username / Email: *${target.rawEmail}*`,
            ...(temporaryPasswordToSend
              ? [
                  `• Temporary Password: *${temporaryPasswordToSend}*`,
                  `_(Please sign in and change your password upon first login)_`,
                ]
              : [
                  `• Account Password: *Use your registered account password*`,
                  `_(If forgotten, use the 'Forgot Password / Reset' option on the portal)_`,
                ]),
            ``,
            `📞 *DEDICATED ADMISSIONS HELPLINE*:`,
            `• Dedicated Calling Line: +91 9196596979`,
            `• Official WhatsApp Helpline: +91 9196596975`,
            ...(target.counselorName ? [`• Enrolling Counselor: *${target.counselorName}*`] : []),
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `✨ We wish you an exceptional learning journey at SoftLab Global! 🌟`,
          ];

          const waRes = await WhatsAppBusinessService.sendMessage({
            toPhone: cleanPhone,
            text: waLines.join("\n"),
            leadId: target.leadId || undefined,
          });
          whatsappSent = waRes.success;
        } catch (err: any) {
          console.error(`[StudentAdmissionNotificationService] Resend WhatsApp error for ${cleanPhone}:`, err.message);
        }
      }
    }

    const dispatchedAt = new Date().toISOString();

    // 3. Log to CustomerTimelineEvent
    if (target.leadId) {
      try {
        await db.customerTimelineEvent.create({
          data: {
            leadId: target.leadId,
            eventType: "ADMISSION_CREDENTIALS_DISPATCHED",
            source: "LMS",
            title: shouldResetPassword
              ? "Welcome Postcard & New Temporary Password Dispatched"
              : "Official Welcome Postcard & LMS Instructions Resent",
            summary: `Dispatched via ${params.channel} to ${this.maskEmail(target.rawEmail)} and ${this.maskPhone(target.rawPhone)}. Staff: ${params.actor.firstName} ${params.actor.lastName} (${params.actor.roleCode}). Outcome: Email ${emailSent ? "Sent" : "Skipped/Failed"}, WhatsApp ${whatsappSent ? "Sent" : "Skipped/Failed"}.`,
            metadata: {
              channel: params.channel,
              emailSent,
              whatsappSent,
              resetPasswordApplied: shouldResetPassword,
              actorId: params.actor.id,
              actorName: `${params.actor.firstName} ${params.actor.lastName}`,
              actorRole: params.actor.roleCode,
              dispatchedAt,
              managementEmail: EmailService.DEFAULT_MANAGEMENT_EMAIL,
            },
          },
        });
      } catch (logErr) {
        console.error("[StudentAdmissionNotificationService] Timeline logging error:", logErr);
      }
    }

    // 4. Record Immutable Security Audit Log
    try {
      await AuditService.log({
        actorId: params.actor.id,
        action: shouldResetPassword
          ? "STUDENT_WELCOME_POSTCARD_RESET_AND_DISPATCH"
          : "STUDENT_WELCOME_POSTCARD_RESENT",
        resourceType: "STUDENT_ADMISSION",
        resourceId: target.applicationId || target.studentProfileId || target.studentId,
        previousData: {
          studentId: target.studentId,
          maskedEmail: this.maskEmail(target.rawEmail),
          maskedPhone: this.maskPhone(target.rawPhone),
        },
        newData: {
          channel: params.channel,
          resetPasswordApplied: shouldResetPassword,
          emailSent,
          whatsappSent,
          dispatchedBy: `${params.actor.firstName} ${params.actor.lastName} (${params.actor.roleCode})`,
          dispatchedAt,
        },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (auditErr) {
      console.error("[StudentAdmissionNotificationService] AuditLog error:", auditErr);
    }

    return {
      success: emailSent || whatsappSent,
      emailSent,
      whatsappSent,
      resetPasswordApplied: shouldResetPassword,
      channel: params.channel,
      maskedEmail: this.maskEmail(target.rawEmail),
      maskedPhone: this.maskPhone(target.rawPhone),
      managementBcc: EmailService.DEFAULT_MANAGEMENT_EMAIL,
      dispatchedAt,
    };
  }

  /**
   * Connect with an individual student via LMS WhatsApp integration according to credentials
   */
  public static async sendStudentLmsWhatsAppMessage(params: {
    studentProfileId: string;
    messageType: "CREDENTIALS" | "CLASS_ALERT" | "ATTENDANCE_WARNING" | "CUSTOM";
    customText?: string;
    batchTitle?: string;
    sessionTime?: string;
    attendancePercentage?: number;
    senderName?: string;
    senderPhone?: string;
  }): Promise<{
    success: boolean;
    phone: string;
    whatsappUrl: string;
    message: string;
    messageId?: string;
  }> {
    const student = await db.studentProfile.findUnique({
      where: { id: params.studentProfileId },
      include: {
        user: true,
        enrollments: {
          include: {
            course: true,
            batch: true,
          },
          take: 1,
        },
      },
    });

    if (!student || !student.user) {
      throw new Error("Student profile record not found.");
    }

    const studentName = `${student.user.firstName} ${student.user.lastName}`.trim();
    const rawPhone = student.user.phone || (student as any).whatsappNumber || "";
    const cleanPhone = WhatsAppBusinessService.normalizePhone(rawPhone);
    const primaryEnrollment = student.enrollments[0];
    const courseTitle = primaryEnrollment?.course?.title || "Enrolled IT Program";
    const batchName = params.batchTitle || primaryEnrollment?.batch?.name || "Regular Batch";
    const senderName = params.senderName || "SoftLab Global Student Directorate";
    const senderPhone = params.senderPhone || "9196596979";

    let messageText = "";

    if (params.messageType === "CREDENTIALS") {
      messageText = [
        `🎓 *SOFTLAB GLOBAL — STUDENT LMS PORTAL ACCESS*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}*,`,
        `Here are your official LMS login credentials and portal access details:`,
        ``,
        `🌐 *Student Portal*: https://softlabglobal.com/login`,
        `🆔 *Student ID*: *${student.studentId}*`,
        `📧 *Username / Email*: *${student.user.email}*`,
        `📚 *Program*: *${courseTitle}*`,
        `🏛️ *Cohort*: *${batchName}*`,
        ``,
        `🔑 *How to Access*:`,
        `1. Visit https://softlabglobal.com/login`,
        `2. Log in using your email and password`,
        `3. Access live lectures, lecture notes, assessments, and digital ID card`,
        ``,
        `📞 *Academic Helpline*: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `📍 *Main Campus*: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else if (params.messageType === "CLASS_ALERT") {
      messageText = [
        `📢 *CLASS SCHEDULE UPDATE — SOFTLAB GLOBAL LMS*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        `Your upcoming session for *${courseTitle}* (${batchName}) is scheduled as follows:`,
        `🕒 *Timing / Schedule*: ${params.sessionTime || "Today as per batch timetable"}`,
        `🏛️ *Campus / Lab*: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`,
        `💻 *Online Access*: https://softlabglobal.com/login`,
        ``,
        `Please ensure punctual attendance and bring your practical assignments.`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else if (params.messageType === "ATTENDANCE_WARNING") {
      const pct = params.attendancePercentage !== undefined ? `${params.attendancePercentage}%` : "below required threshold";
      messageText = [
        `⚠️ *ATTENDANCE COMPLIANCE ALERT — SOFTLAB GLOBAL*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        `Your current attendance for *${courseTitle}* is recorded at *${pct}*.`,
        `Institutional policy requires a minimum of *75% attendance* for corporate placement eligibility and certificate issuance.`,
        ``,
        `Please meet your academic mentor or counselor immediately:`,
        `• Coordinator: *${senderName}*`,
        `• Helpline: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `• Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj - 211011`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    } else {
      messageText = [
        `📌 *SOFTLAB GLOBAL ACADEMIC UPDATE*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Dear *${studentName}* (${student.studentId}),`,
        ``,
        params.customText || `We have an important academic update regarding your enrollment in ${courseTitle}.`,
        ``,
        `Portal: https://softlabglobal.com/login`,
        `Helpline: +91 ${senderPhone.replace(/\D/g, "").slice(-10)}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ].join("\n");
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    let waResult: any = { success: false };
    if (cleanPhone) {
      try {
        waResult = await WhatsAppBusinessService.sendMessage({
          toPhone: cleanPhone,
          text: messageText,
        });
      } catch (err: any) {
        console.error(`[StudentAdmissionNotificationService] Direct student WhatsApp error:`, err.message);
      }
    }

    return {
      success: waResult.success || false,
      phone: cleanPhone,
      whatsappUrl,
      message: messageText,
      messageId: waResult.messageId,
    };
  }

  /**
   * Broadcast WhatsApp notice to all active students in a cohort/batch
   */
  public static async broadcastWhatsAppToBatchStudents(params: {
    batchId: string;
    messageType: "CLASS_ALERT" | "ATTENDANCE_WARNING" | "CUSTOM";
    customText?: string;
    sessionTime?: string;
    senderName?: string;
    senderPhone?: string;
  }): Promise<{
    batchName: string;
    totalStudents: number;
    sentCount: number;
    failedCount: number;
  }> {
    const batch = await db.batch.findUnique({
      where: { id: params.batchId },
      include: {
        course: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Cohort / Batch not found.");
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const enr of batch.enrollments) {
      try {
        const res = await this.sendStudentLmsWhatsAppMessage({
          studentProfileId: enr.student.id,
          messageType: params.messageType,
          customText: params.customText,
          batchTitle: batch.name,
          sessionTime: params.sessionTime,
          senderName: params.senderName,
          senderPhone: params.senderPhone,
        });

        if (res.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    return {
      batchName: batch.name,
      totalStudents: batch.enrollments.length,
      sentCount,
      failedCount,
    };
  }
}

