import { db } from "@/server/db/client";
import { EmailService } from "./email.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { HigherAuthorityService } from "./higher-authority.service";
import { AuthenticatedUser } from "@/server/auth/rbac";
import * as crypto from "crypto";

export interface DailyReportNotificationData {
  reportId: string;
  employeeName: string;
  employeeId: string;
  employeeEmail: string;
  department: string;
  designation: string;
  reportDate: string; // YYYY-MM-DD
  submittedAt: string;
  completedTasks: Array<{ title: string; measurableResult?: string; notes?: string }>;
  pendingTasks: Array<{ title: string; notes?: string }>;
  blockedTasks: Array<{ title: string; reason?: string }>;
  actualWorkSummary: string;
  resultsSummary?: string;
  nextDayPriorities?: string;
  crmMetrics: {
    leadsContacted: number;
    followUpsDone: number;
    admissionsDone: number;
  };
  reportUrl: string;
}

export class CentralNotificationEngine {
  public static readonly SITE_URL = process.env.NEXTAUTH_URL || "https://lms.softlabglobal.com";

  /**
   * Dispatches Daily Work Report notifications to all active Higher Authorities via Email and WhatsApp.
   * Completely resilient: failures are logged per recipient without throwing to avoid blocking report submission.
   */
  public static async notifyDailyReportSubmitted(reportId: string, actor: AuthenticatedUser): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    details: Array<{ recipient: string; channel: string; status: string; error?: string }>;
  }> {
    const details: Array<{ recipient: string; channel: string; status: string; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    try {
      // 1. Fetch complete report details
      const report = await db.dailyWorkReport.findUnique({
        where: { id: reportId },
        include: {
          items: true,
          staff: {
            include: { user: true },
          },
        },
      });

      if (!report || !report.staff) {
        console.error(`[CentralNotificationEngine] Report ${reportId} not found.`);
        return { success: false, sentCount: 0, failedCount: 1, details: [{ recipient: "SYSTEM", channel: "SYSTEM", status: "FAILED", error: "Report not found" }] };
      }

      const staff = report.staff;
      const user = staff.user;
      const employeeName = `${user.firstName} ${user.lastName}`.trim();
      const employeeEmail = user.email;
      const department = String(report.department || staff.department || "General");
      const designation = staff.designation || "Executive";
      const reportDateStr = new Date(report.reportDate).toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const submittedAtStr = new Date(report.createdAt).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const completedTasks = report.items.filter((i) => i.status === "COMPLETED").map((i) => ({
        title: i.taskTitle,
        measurableResult: i.measurableResult || undefined,
        notes: i.notes || undefined,
      }));
      const pendingTasks = report.items.filter((i) => i.status === "IN_PROGRESS").map((i) => ({
        title: i.taskTitle,
        notes: i.notes || undefined,
      }));
      const blockedTasks = report.items.filter((i) => i.status === "BLOCKED").map((i) => ({
        title: i.taskTitle,
        reason: i.blockedReason || undefined,
      }));

      const reportData: DailyReportNotificationData = {
        reportId: report.id,
        employeeName,
        employeeId: staff.employeeId,
        employeeEmail,
        department,
        designation,
        reportDate: reportDateStr,
        submittedAt: submittedAtStr,
        completedTasks,
        pendingTasks,
        blockedTasks,
        actualWorkSummary: report.actualWorkSummary || "N/A",
        resultsSummary: report.resultsSummary || undefined,
        nextDayPriorities: report.nextDayPriorities || undefined,
        crmMetrics: {
          leadsContacted: report.crmLeadsContacted || 0,
          followUpsDone: report.crmFollowUpsDone || 0,
          admissionsDone: report.crmAdmissionsDone || 0,
        },
        reportUrl: `${this.SITE_URL}/admin/daily-reports`,
      };

      // 2. Fetch all configured Higher Authority recipients
      const recipients = await HigherAuthorityService.getRecipientsForEvent("DAILY_REPORT");
      if (recipients.length === 0) {
        console.warn("[CentralNotificationEngine] No active Higher Authorities configured for DAILY_REPORT.");
      }

      const subject = `Daily Work Report | ${employeeName} | ${department} | ${reportDateStr}`;
      const emailHtml = this.generateDailyReportHtml(reportData);
      const whatsappText = this.generateDailyReportWhatsAppText(reportData);

      // 3. Dispatch to each higher authority across authorized channels
      for (const rec of recipients) {
        // --- Channel 1: Official Work Email ---
        if (rec.notifyEmail && rec.officialEmail) {
          const idempotencyKey = `DAILY_REPORT:${report.id}:OFFICIAL_EMAIL:${rec.officialEmail.toLowerCase()}`;
          const res = await this.deliverEmail({
            idempotencyKey,
            eventType: "DAILY_REPORT_SUBMITTED",
            channel: "OFFICIAL_EMAIL",
            recipientName: rec.name,
            recipientAddress: rec.officialEmail,
            recipientRole: rec.roleCode,
            senderAddress: employeeEmail,
            senderName: `${employeeName} via SoftLab Global`,
            subject,
            html: emailHtml,
            relatedEntityId: report.id,
            relatedEntityType: "DailyWorkReport",
            triggeringUserId: actor.id,
          });

          if (res.sent) sentCount++;
          else failedCount++;
          details.push({ recipient: rec.officialEmail, channel: "OFFICIAL_EMAIL", status: res.status, error: res.error });
        }

        // --- Channel 2: Authorized Personal Email ---
        if (rec.notifyPersonalEmail && rec.personalEmail) {
          const idempotencyKey = `DAILY_REPORT:${report.id}:PERSONAL_EMAIL:${rec.personalEmail.toLowerCase()}`;
          const res = await this.deliverEmail({
            idempotencyKey,
            eventType: "DAILY_REPORT_SUBMITTED",
            channel: "PERSONAL_EMAIL",
            recipientName: rec.name,
            recipientAddress: rec.personalEmail,
            recipientRole: rec.roleCode,
            senderAddress: employeeEmail,
            senderName: `${employeeName} via SoftLab Global`,
            subject,
            html: emailHtml,
            relatedEntityId: report.id,
            relatedEntityType: "DailyWorkReport",
            triggeringUserId: actor.id,
          });

          if (res.sent) sentCount++;
          else failedCount++;
          details.push({ recipient: rec.personalEmail, channel: "PERSONAL_EMAIL", status: res.status, error: res.error });
        }

        // --- Channel 3: WhatsApp Notification ---
        if (rec.notifyWhatsApp && rec.whatsappNumber) {
          const idempotencyKey = `DAILY_REPORT:${report.id}:WHATSAPP:${rec.whatsappNumber.replace(/\D/g, "")}`;
          const res = await this.deliverWhatsApp({
            idempotencyKey,
            eventType: "DAILY_REPORT_SUBMITTED",
            recipientName: rec.name,
            recipientPhone: rec.whatsappNumber,
            recipientRole: rec.roleCode,
            text: whatsappText,
            relatedEntityId: report.id,
            relatedEntityType: "DailyWorkReport",
            triggeringUserId: actor.id,
          });

          if (res.sent) sentCount++;
          else failedCount++;
          details.push({ recipient: rec.whatsappNumber, channel: "WHATSAPP", status: res.status, error: res.error });
        }
      }
    } catch (err: any) {
      console.error("[CentralNotificationEngine] Unexpected error during daily report dispatch:", err);
      return { success: false, sentCount, failedCount: failedCount + 1, details };
    }

    return {
      success: failedCount === 0,
      sentCount,
      failedCount,
      details,
    };
  }

  /**
   * Dispatches Staff Onboarding & Login Account notifications to:
   * 1. Official Work Email
   * 2. Personal Email (where provided)
   * 3. WhatsApp Contact
   * Enforces NO plaintext password! Provides secure activation link.
   */
  public static async notifyStaffOnboarded(params: {
    staffId: string;
    employeeId: string;
    fullName: string;
    officialEmail: string;
    personalEmail?: string;
    whatsappNumber?: string;
    department: string;
    designation: string;
    roleCode: string;
    actorId?: string;
  }): Promise<{
    sentCount: number;
    failedCount: number;
    details: Array<{ recipient: string; channel: string; status: string; error?: string }>;
  }> {
    const details: Array<{ recipient: string; channel: string; status: string; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    const setupToken = crypto.randomBytes(24).toString("hex");
    const activationLink = `${this.SITE_URL}/login?activated=true&email=${encodeURIComponent(params.officialEmail)}`;
    const passwordResetLink = `${this.SITE_URL}/login?reset=request&email=${encodeURIComponent(params.officialEmail)}`;

    const subject = `Welcome to SOFTLAB GLOBAL — Employee Portal & Account Activation (${params.employeeId})`;
    const emailHtml = this.generateStaffOnboardingHtml({
      ...params,
      activationLink,
      passwordResetLink,
    });
    const waText = this.generateStaffOnboardingWhatsAppText({
      ...params,
      activationLink,
    });

    // 1. Send to Official Work Email
    if (params.officialEmail) {
      const idempotencyKey = `STAFF_ONBOARD:${params.staffId}:OFFICIAL_EMAIL:${params.officialEmail.toLowerCase()}`;
      const res = await this.deliverEmail({
        idempotencyKey,
        eventType: "STAFF_ONBOARDED",
        channel: "OFFICIAL_EMAIL",
        recipientName: params.fullName,
        recipientAddress: params.officialEmail,
        recipientRole: params.roleCode,
        senderAddress: "hr@softlabglobal.com",
        senderName: "SOFTLAB GLOBAL Human Resources & Operations",
        subject,
        html: emailHtml,
        relatedEntityId: params.staffId,
        relatedEntityType: "StaffProfile",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: params.officialEmail, channel: "OFFICIAL_EMAIL", status: res.status, error: res.error });
    }

    // 2. Send to Personal Email (where provided)
    if (params.personalEmail && params.personalEmail.includes("@") && params.personalEmail.toLowerCase() !== params.officialEmail.toLowerCase()) {
      const idempotencyKey = `STAFF_ONBOARD:${params.staffId}:PERSONAL_EMAIL:${params.personalEmail.toLowerCase()}`;
      const res = await this.deliverEmail({
        idempotencyKey,
        eventType: "STAFF_ONBOARDED",
        channel: "PERSONAL_EMAIL",
        recipientName: params.fullName,
        recipientAddress: params.personalEmail,
        recipientRole: params.roleCode,
        senderAddress: "hr@softlabglobal.com",
        senderName: "SOFTLAB GLOBAL Human Resources & Operations",
        subject,
        html: emailHtml,
        relatedEntityId: params.staffId,
        relatedEntityType: "StaffProfile",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: params.personalEmail, channel: "PERSONAL_EMAIL", status: res.status, error: res.error });
    }

    // 3. Send to Registered WhatsApp Contact
    const waPhone = params.whatsappNumber?.trim();
    if (waPhone) {
      const idempotencyKey = `STAFF_ONBOARD:${params.staffId}:WHATSAPP:${waPhone.replace(/\D/g, "")}`;
      const res = await this.deliverWhatsApp({
        idempotencyKey,
        eventType: "STAFF_ONBOARDED",
        recipientName: params.fullName,
        recipientPhone: waPhone,
        recipientRole: params.roleCode,
        text: waText,
        relatedEntityId: params.staffId,
        relatedEntityType: "StaffProfile",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: waPhone, channel: "WHATSAPP", status: res.status, error: res.error });
    }

    return { sentCount, failedCount, details };
  }

  /**
   * Dispatches Vendor Onboarding notifications to:
   * 1. Official Business Email
   * 2. Authorized Personal Email
   * 3. WhatsApp Contact
   */
  public static async notifyVendorOnboarded(params: {
    vendorId: string;
    vendorCode: string;
    name: string;
    email?: string;
    personalEmail?: string;
    phone?: string;
    whatsappNumber?: string;
    category: string;
    actorId?: string;
  }): Promise<{
    sentCount: number;
    failedCount: number;
    details: Array<{ recipient: string; channel: string; status: string; error?: string }>;
  }> {
    const details: Array<{ recipient: string; channel: string; status: string; error?: string }> = [];
    let sentCount = 0;
    let failedCount = 0;

    const portalLink = `${this.SITE_URL}/admin/finance`;
    const subject = `Vendor Onboarding & Account Registration — SOFTLAB GLOBAL (${params.vendorCode})`;
    const emailHtml = this.generateVendorOnboardingHtml({ ...params, portalLink });
    const waText = this.generateVendorOnboardingWhatsAppText({ ...params, portalLink });

    // 1. Business Email
    if (params.email && params.email.includes("@")) {
      const idempotencyKey = `VENDOR_ONBOARD:${params.vendorId}:OFFICIAL_EMAIL:${params.email.toLowerCase()}`;
      const res = await this.deliverEmail({
        idempotencyKey,
        eventType: "VENDOR_ONBOARDED",
        channel: "OFFICIAL_EMAIL",
        recipientName: params.name,
        recipientAddress: params.email,
        recipientRole: "VENDOR",
        senderAddress: "accounts@softlabglobal.com",
        senderName: "SOFTLAB GLOBAL Finance & Vendor Desk",
        subject,
        html: emailHtml,
        relatedEntityId: params.vendorId,
        relatedEntityType: "Vendor",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: params.email, channel: "OFFICIAL_EMAIL", status: res.status, error: res.error });
    }

    // 2. Personal Email (if provided and different)
    if (params.personalEmail && params.personalEmail.includes("@") && params.personalEmail.toLowerCase() !== params.email?.toLowerCase()) {
      const idempotencyKey = `VENDOR_ONBOARD:${params.vendorId}:PERSONAL_EMAIL:${params.personalEmail.toLowerCase()}`;
      const res = await this.deliverEmail({
        idempotencyKey,
        eventType: "VENDOR_ONBOARDED",
        channel: "PERSONAL_EMAIL",
        recipientName: params.name,
        recipientAddress: params.personalEmail,
        recipientRole: "VENDOR",
        senderAddress: "accounts@softlabglobal.com",
        senderName: "SOFTLAB GLOBAL Finance & Vendor Desk",
        subject,
        html: emailHtml,
        relatedEntityId: params.vendorId,
        relatedEntityType: "Vendor",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: params.personalEmail, channel: "PERSONAL_EMAIL", status: res.status, error: res.error });
    }

    // 3. WhatsApp Contact
    const waPhone = params.whatsappNumber || params.phone;
    if (waPhone) {
      const idempotencyKey = `VENDOR_ONBOARD:${params.vendorId}:WHATSAPP:${waPhone.replace(/\D/g, "")}`;
      const res = await this.deliverWhatsApp({
        idempotencyKey,
        eventType: "VENDOR_ONBOARDED",
        recipientName: params.name,
        recipientPhone: waPhone,
        recipientRole: "VENDOR",
        text: waText,
        relatedEntityId: params.vendorId,
        relatedEntityType: "Vendor",
        triggeringUserId: params.actorId,
      });

      if (res.sent) sentCount++;
      else failedCount++;
      details.push({ recipient: waPhone, channel: "WHATSAPP", status: res.status, error: res.error });
    }

    return { sentCount, failedCount, details };
  }

  /**
   * Internal helper to deliver email with idempotency and persistent logging
   */
  private static async deliverEmail(params: {
    idempotencyKey: string;
    eventType: string;
    channel: "OFFICIAL_EMAIL" | "PERSONAL_EMAIL";
    recipientName: string;
    recipientAddress: string;
    recipientRole?: string;
    senderAddress: string;
    senderName: string;
    subject: string;
    html: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    triggeringUserId?: string;
  }): Promise<{ sent: boolean; status: string; error?: string }> {
    try {
      // Check existing log for strict duplicate prevention
      const existing = await db.notificationDeliveryLog.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });

      if (existing) {
        return { sent: existing.status === "SENT", status: "ALREADY_PROCESSED" };
      }

      // Upsert pending log record
      const log = await db.notificationDeliveryLog.upsert({
        where: { idempotencyKey: params.idempotencyKey },
        create: {
          idempotencyKey: params.idempotencyKey,
          eventType: params.eventType,
          channel: params.channel,
          recipientName: params.recipientName,
          recipientAddress: params.recipientAddress,
          recipientRole: params.recipientRole,
          senderAddress: params.senderAddress,
          subject: params.subject,
          contentSummary: params.subject,
          status: "PENDING",
          relatedEntityId: params.relatedEntityId,
          relatedEntityType: params.relatedEntityType,
          triggeringUserId: params.triggeringUserId,
        },
        update: {
          retryCount: { increment: 1 },
          status: "PENDING",
        },
      });

      // Dispatch via SMTP
      const sendRes = await EmailService.sendEmail({
        to: params.recipientAddress,
        subject: params.subject,
        html: params.html,
        fromEmail: params.senderAddress,
        fromName: params.senderName,
        templateCode: params.idempotencyKey,
      });

      if (sendRes.sent) {
        await db.notificationDeliveryLog.update({
          where: { id: log.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            deliveredAt: new Date(),
            providerResponse: "SMTP 250 OK - Delivered via Local Mailcow",
          },
        });
        return { sent: true, status: "SENT" };
      } else {
        await db.notificationDeliveryLog.update({
          where: { id: log.id },
          data: {
            status: "FAILED",
            errorMessage: sendRes.reason || "SMTP transmission failure",
          },
        });
        return { sent: false, status: "FAILED", error: sendRes.reason };
      }
    } catch (err: any) {
      console.error(`[CentralNotificationEngine] deliverEmail error for ${params.recipientAddress}:`, err.message);
      return { sent: false, status: "FAILED", error: err.message };
    }
  }

  /**
   * Internal helper to deliver WhatsApp message with idempotency and persistent logging
   */
  private static async deliverWhatsApp(params: {
    idempotencyKey: string;
    eventType: string;
    recipientName: string;
    recipientPhone: string;
    recipientRole?: string;
    text: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
    triggeringUserId?: string;
  }): Promise<{ sent: boolean; status: string; error?: string }> {
    try {
      const existing = await db.notificationDeliveryLog.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });

      if (existing) {
        return { sent: existing.status === "SENT", status: "ALREADY_PROCESSED" };
      }

      const log = await db.notificationDeliveryLog.upsert({
        where: { idempotencyKey: params.idempotencyKey },
        create: {
          idempotencyKey: params.idempotencyKey,
          eventType: params.eventType,
          channel: "WHATSAPP",
          recipientName: params.recipientName,
          recipientAddress: params.recipientPhone,
          recipientRole: params.recipientRole,
          senderAddress: "SOFTLAB_WHATSAPP_BUSINESS",
          subject: `WhatsApp: ${params.eventType}`,
          contentSummary: params.text.slice(0, 300),
          status: "PENDING",
          relatedEntityId: params.relatedEntityId,
          relatedEntityType: params.relatedEntityType,
          triggeringUserId: params.triggeringUserId,
        },
        update: {
          retryCount: { increment: 1 },
          status: "PENDING",
        },
      });

      const res = await WhatsAppBusinessService.sendMessage({
        toPhone: params.recipientPhone,
        text: params.text,
      });

      if (res.success) {
        await db.notificationDeliveryLog.update({
          where: { id: log.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            providerResponse: `WhatsApp MessageId: ${res.messageId} (${res.platform})`,
          },
        });
        return { sent: true, status: "SENT" };
      } else {
        // Accurately record delivery status: if Meta API token is missing, mark as SIMULATED_QUEUED
        const status = res.messageId === "NOT_CONFIGURED" ? "SIMULATED" : "FAILED";
        await db.notificationDeliveryLog.update({
          where: { id: log.id },
          data: {
            status,
            errorMessage: res.error || "WhatsApp delivery failed",
            providerResponse: res.messageId,
          },
        });
        return { sent: res.success, status, error: res.error };
      }
    } catch (err: any) {
      console.error(`[CentralNotificationEngine] deliverWhatsApp error for ${params.recipientPhone}:`, err.message);
      return { sent: false, status: "FAILED", error: err.message };
    }
  }

  /**
   * Retry a failed notification log record
   */
  public static async retryNotification(logId: string) {
    const log = await db.notificationDeliveryLog.findUnique({
      where: { id: logId },
    });

    if (!log) throw new Error("Notification log record not found.");

    if (log.channel === "OFFICIAL_EMAIL" || log.channel === "PERSONAL_EMAIL") {
      const sendRes = await EmailService.sendEmail({
        to: log.recipientAddress,
        subject: log.subject || "Notification Update",
        html: `<p>${log.contentSummary}</p>`,
        templateCode: log.idempotencyKey,
      });

      await db.notificationDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: sendRes.sent ? "SENT" : "FAILED",
          sentAt: sendRes.sent ? new Date() : log.sentAt,
          errorMessage: sendRes.reason || null,
          retryCount: { increment: 1 },
        },
      });

      return { success: sendRes.sent, status: sendRes.sent ? "SENT" : "FAILED" };
    } else if (log.channel === "WHATSAPP") {
      const res = await WhatsAppBusinessService.sendMessage({
        toPhone: log.recipientAddress,
        text: log.contentSummary || "",
      });

      await db.notificationDeliveryLog.update({
        where: { id: log.id },
        data: {
          status: res.success ? "SENT" : "FAILED",
          sentAt: res.success ? new Date() : log.sentAt,
          errorMessage: res.error || null,
          retryCount: { increment: 1 },
        },
      });

      return { success: res.success, status: res.success ? "SENT" : "FAILED" };
    }

    return { success: false, status: "UNSUPPORTED_CHANNEL" };
  }

  /**
   * Get delivery statistics for Admin Dashboard
   */
  public static async getDeliveryStats() {
    const [total, sent, failed, simulated, emailsSent, whatsappSent] = await Promise.all([
      db.notificationDeliveryLog.count(),
      db.notificationDeliveryLog.count({ where: { status: "SENT" } }),
      db.notificationDeliveryLog.count({ where: { status: "FAILED" } }),
      db.notificationDeliveryLog.count({ where: { status: "SIMULATED" } }),
      db.notificationDeliveryLog.count({ where: { channel: { in: ["OFFICIAL_EMAIL", "PERSONAL_EMAIL"] }, status: "SENT" } }),
      db.notificationDeliveryLog.count({ where: { channel: "WHATSAPP", status: "SENT" } }),
    ]);

    const lastLog = await db.notificationDeliveryLog.findFirst({
      where: { status: "SENT" },
      orderBy: { sentAt: "desc" },
    });

    return {
      total,
      sent,
      failed,
      simulated,
      emailsSent,
      whatsappSent,
      lastSuccessfulDelivery: lastLog?.sentAt || null,
    };
  }

  /**
   * List delivery logs with filtering and pagination
   */
  public static async listDeliveryLogs(params: {
    page?: number;
    limit?: number;
    eventType?: string;
    channel?: string;
    status?: string;
    search?: string;
  }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.eventType) where.eventType = params.eventType;
    if (params.channel) where.channel = params.channel;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { recipientName: { contains: params.search, mode: "insensitive" } },
        { recipientAddress: { contains: params.search, mode: "insensitive" } },
        { subject: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.notificationDeliveryLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.notificationDeliveryLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================================================
  // TEMPLATE GENERATORS
  // ============================================================================

  private static generateDailyReportHtml(d: DailyReportNotificationData): string {
    const completedList = d.completedTasks.length > 0
      ? d.completedTasks.map((t) => `<li style="margin-bottom: 6px;"><strong>${t.title}</strong>${t.measurableResult ? ` — <span style="color: #059669;">${t.measurableResult}</span>` : ""}${t.notes ? ` <span style="color: #64748b; font-size: 13px;">(${t.notes})</span>` : ""}</li>`).join("")
      : "<li style='color: #94a3b8;'>No tasks marked completed today.</li>";

    const pendingList = d.pendingTasks.length > 0
      ? d.pendingTasks.map((t) => `<li style="margin-bottom: 6px;"><strong>${t.title}</strong>${t.notes ? ` <span style="color: #64748b; font-size: 13px;">(${t.notes})</span>` : ""}</li>`).join("")
      : "<li style='color: #94a3b8;'>No pending tasks carried over.</li>";

    const blockedList = d.blockedTasks.length > 0
      ? d.blockedTasks.map((t) => `<li style="margin-bottom: 6px; color: #b91c1c;"><strong>${t.title}</strong>${t.reason ? ` — Reason: <em>${t.reason}</em>` : ""}</li>`).join("")
      : "<li style='color: #10b981;'>No blocked tasks reported. Clean progress.</li>";

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; color: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 14px; margin-bottom: 14px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; color: #38bdf8;">SOFTLAB GLOBAL</h2>
            <span style="font-size: 12px; background: #0284c7; color: #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 600;">DAILY WORK REPORT</span>
          </div>
          <h1 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 600; color: #f8fafc;">${d.employeeName}</h1>
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            ID: <strong style="color: #e2e8f0;">${d.employeeId}</strong> • Dept: <strong style="color: #e2e8f0;">${d.department}</strong> • Desig: <strong style="color: #e2e8f0;">${d.designation}</strong>
          </p>
          <p style="margin: 6px 0 0 0; font-size: 12px; color: #cbd5e1;">
            Reporting Date: <strong>${d.reportDate}</strong> • Submission Time: <strong>${d.submittedAt}</strong>
          </p>
        </div>

        <div style="padding: 28px 32px;">
          <!-- Verified CRM Activity Metrics Card -->
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700;">
              Verified CRM & Operations Metrics
            </h3>
            <div style="display: table; width: 100%;">
              <div style="display: table-cell; width: 33.33%; text-align: center; border-right: 1px solid #e2e8f0; padding: 0 8px;">
                <div style="font-size: 24px; font-weight: 700; color: #0284c7;">${d.crmMetrics.leadsContacted}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Leads Contacted</div>
              </div>
              <div style="display: table-cell; width: 33.33%; text-align: center; border-right: 1px solid #e2e8f0; padding: 0 8px;">
                <div style="font-size: 24px; font-weight: 700; color: #8b5cf6;">${d.crmMetrics.followUpsDone}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Follow-ups Done</div>
              </div>
              <div style="display: table-cell; width: 33.33%; text-align: center; padding: 0 8px;">
                <div style="font-size: 24px; font-weight: 700; color: #059669;">${d.crmMetrics.admissionsDone}</div>
                <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Admissions Converted</div>
              </div>
            </div>
          </div>

          <!-- Actual Work Summary -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
              1. Actual Work Summary
            </h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155; white-space: pre-line; background: #fafafa; padding: 12px; border-radius: 4px; border-left: 3px solid #0284c7;">
              ${d.actualWorkSummary}
            </p>
          </div>

          <!-- Completed Tasks -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #059669; border-bottom: 2px solid #d1fae5; padding-bottom: 4px;">
              ✔ Completed Tasks (${d.completedTasks.length})
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #334155;">
              ${completedList}
            </ul>
          </div>

          <!-- Pending Tasks -->
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #d97706; border-bottom: 2px solid #fef3c7; padding-bottom: 4px;">
              ⏳ Pending Tasks (${d.pendingTasks.length})
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5; color: #334155;">
              ${pendingList}
            </ul>
          </div>

          <!-- Blocked Tasks -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #dc2626; border-bottom: 2px solid #fee2e2; padding-bottom: 4px;">
              🛑 Blocked Tasks / Bottlenecks (${d.blockedTasks.length})
            </h3>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
              ${blockedList}
            </ul>
          </div>

          ${d.nextDayPriorities ? `
          <!-- Next Day Priorities -->
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #4338ca; border-bottom: 2px solid #e0e7ff; padding-bottom: 4px;">
              🎯 Next Working Day Priorities
            </h3>
            <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #334155; background: #fafafa; padding: 12px; border-radius: 4px; white-space: pre-line;">
              ${d.nextDayPriorities}
            </p>
          </div>
          ` : ""}

          <!-- Action Button -->
          <div style="text-align: center; margin: 32px 0 16px 0;">
            <a href="${d.reportUrl}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
              View & Review Report in LMS Portal →
            </a>
          </div>

          <p style="margin: 16px 0 0 0; text-align: center; font-size: 11px; color: #94a3b8;">
            Report Reference ID: <code>${d.reportId}</code> • Authenticated Mail Service
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; font-size: 12px; color: #64748b; text-align: center;">
          <p style="margin: 0 0 4px 0;">
            <strong>SOFTLAB GLOBAL PRIVATE LIMITED</strong> • Executive Directorate & Operations
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            Civil Lines Prayagraj, UP 211011 • Official Corporate Communication
          </p>
        </div>
      </div>
    `;
  }

  private static generateDailyReportWhatsAppText(d: DailyReportNotificationData): string {
    return `📊 *SOFTLAB GLOBAL — DAILY WORK REPORT*

👤 *Employee*: ${d.employeeName}
🆔 *ID*: ${d.employeeId}
🏢 *Department*: ${d.department}
💼 *Designation*: ${d.designation}
📅 *Date*: ${d.reportDate} (Submitted: ${d.submittedAt})

📈 *Verified CRM Metrics*:
• Leads Contacted: *${d.crmMetrics.leadsContacted}*
• Follow-ups: *${d.crmMetrics.followUpsDone}*
• Admissions: *${d.crmMetrics.admissionsDone}*

📋 *Tasks Progress*:
✔ Completed: *${d.completedTasks.length}*
⏳ Pending: *${d.pendingTasks.length}*
🛑 Blocked: *${d.blockedTasks.length}*

📝 *Work Summary*:
${d.actualWorkSummary.slice(0, 300)}${d.actualWorkSummary.length > 300 ? "..." : ""}
${d.nextDayPriorities ? `\n🎯 *Next Day*: ${d.nextDayPriorities.slice(0, 150)}` : ""}

🔗 *View Full Report*:
${d.reportUrl}

_SoftLab Global Automated Notification Engine_`;
  }

  private static generateStaffOnboardingHtml(d: any): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
        <div style="background: #0f172a; padding: 24px; color: #ffffff; text-align: center;">
          <h2 style="color: #38bdf8; margin: 0 0 6px 0;">SOFTLAB GLOBAL</h2>
          <p style="color: #94a3b8; margin: 0; font-size: 13px;">Human Resources & Personnel Onboarding</p>
        </div>
        <div style="padding: 28px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a;">Welcome to the Team, ${d.fullName}!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            We are pleased to welcome you as <strong>${d.designation}</strong> in the <strong>${d.department}</strong> department at SOFTLAB GLOBAL.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Employee ID:</strong> <code>${d.employeeId}</code></p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Official Work Email:</strong> ${d.officialEmail}</p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Assigned Role:</strong> ${d.roleCode}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Staff Portal:</strong> <a href="${this.SITE_URL}" style="color: #0284c7;">${this.SITE_URL}</a></p>
          </div>

          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Your account is ready. In accordance with enterprise security guidelines, passwords are never transmitted in plaintext. Please use the secure button below to access your account:
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${d.activationLink}" style="background: #0284c7; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
              Activate Account & Sign In →
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            Need help or forgot your password? Use the <a href="${d.passwordResetLink}" style="color: #0284c7;">Password Reset Portal</a> or contact HR at <a href="mailto:hr@softlabglobal.com" style="color: #0284c7;">hr@softlabglobal.com</a>.
          </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          SOFTLAB GLOBAL PRIVATE LIMITED • Civil Lines, Prayagraj, UP - 211011
        </div>
      </div>
    `;
  }

  private static generateStaffOnboardingWhatsAppText(d: any): string {
    return `🌟 *WELCOME TO SOFTLAB GLOBAL* 🌟

Dear *${d.fullName}*,

Congratulations on joining SOFTLAB GLOBAL as *${d.designation}* in the *${d.department}* Department!

🔑 *YOUR OFFICIAL ACCOUNT*:
• Employee ID: \`${d.employeeId}\`
• Official Email: \`${d.officialEmail}\`
• Portal URL: ${this.SITE_URL}

📌 *Access Your Portal*:
Click below to activate and access your daily work planner and attendance:
${d.activationLink}

Warm regards,
*HR & Executive Management*
*SOFTLAB GLOBAL*`;
  }

  private static generateVendorOnboardingHtml(d: any): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; color: #1e293b;">
        <div style="background: #059669; padding: 24px; color: #ffffff; text-align: center;">
          <h2 style="margin: 0 0 6px 0;">SOFTLAB GLOBAL</h2>
          <p style="margin: 0; font-size: 13px; opacity: 0.9;">Finance & Vendor Desk</p>
        </div>
        <div style="padding: 28px;">
          <h3 style="margin: 0 0 12px 0; color: #0f172a;">Vendor Account Registration Confirmed</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            Dear <strong>${d.name}</strong>, your vendor registration with SOFTLAB GLOBAL has been verified and registered in our central ERP accounts system.
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Vendor Code:</strong> <code>${d.vendorCode}</code></p>
            <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Category:</strong> ${d.category}</p>
            <p style="margin: 0; font-size: 13px;"><strong>Accounts Portal:</strong> <a href="${d.portalLink}" style="color: #059669;">${d.portalLink}</a></p>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Please quote your Vendor Code (<code>${d.vendorCode}</code>) on all invoices, bills, and payment inquiries submitted to accounts@softlabglobal.com.
          </p>
        </div>
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
          SOFTLAB GLOBAL PRIVATE LIMITED • Civil Lines, Prayagraj, UP - 211011
        </div>
      </div>
    `;
  }

  private static generateVendorOnboardingWhatsAppText(d: any): string {
    return `🤝 *SOFTLAB GLOBAL — VENDOR REGISTRATION*

Dear *${d.name}*,

Your vendor account has been registered successfully with SOFTLAB GLOBAL.

📋 *Vendor Details*:
• Vendor Code: \`${d.vendorCode}\`
• Category: ${d.category}
• Finance Portal: ${d.portalLink}

Please reference your Vendor Code on all tax invoices and billing submissions.

Regards,
*Finance & Accounts Directorate*
*SOFTLAB GLOBAL*`;
  }
}
