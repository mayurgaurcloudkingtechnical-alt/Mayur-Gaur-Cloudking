import { db } from "@/server/db/client";
import { EmailService } from "./email.service";
import { UserRoleCode } from "@prisma/client";

export interface DispatchNotificationEventInput {
  eventType: string; // e.g. "NEW_STUDENT_ADMISSION", "NEW_STAFF_ONBOARDING", "VENDOR_BILL_REGISTERED", "EXPENSE_CLAIM_SUBMITTED"
  entityId: string;
  primaryRecipientEmail?: string;
  primaryRecipientName?: string;
  payload: Record<string, any>;
  counselorId?: string | null;
  department?: string | null;
  amountPaise?: number | null;
}

export class IntelligentNotificationEngine {
  /**
   * Dispatches an event-driven notification according to the rule matrix in notification_matrix_rules
   */
  public static async dispatchEvent(input: DispatchNotificationEventInput): Promise<{
    success: boolean;
    dispatchedCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let dispatchedCount = 0;

    try {
      // 1. Fetch configured routing rule for this event
      const rule = await db.notificationMatrixRule.findUnique({
        where: { eventType: input.eventType },
      });

      if (!rule || !rule.isActive) {
        return { success: true, dispatchedCount: 0, errors: ["No active rule found for event"] };
      }

      // 2. Idempotency Check: Prevent duplicate email dispatch for same entity + event
      const idempotencyKey = `NOTIF:${input.eventType}:${input.entityId}`;
      const alreadySent = await db.emailLog.findFirst({
        where: { templateCode: idempotencyKey, status: "SENT" },
      });

      if (alreadySent) {
        return { success: true, dispatchedCount: 0, errors: ["Event already dispatched (Idempotency check passed)"] };
      }

      // 3. Dispatch to Primary Recipient (in `To`) if applicable
      if (input.primaryRecipientEmail && input.primaryRecipientEmail.includes("@")) {
        const subject = this.generateSubject(input.eventType, input.payload);
        const html = this.generatePrimaryHtml(input.eventType, input.payload, rule.senderName);

        const res = await EmailService.sendEmail({
          to: input.primaryRecipientEmail,
          subject,
          html,
          fromEmail: rule.senderEmail,
          fromName: rule.senderName,
          templateCode: idempotencyKey,
          metadata: { eventType: input.eventType, entityId: input.entityId },
        });

        if (res.sent) dispatchedCount++;
        else if (res.reason) errors.push(res.reason);
      }

      // 4. Role-based Operational Recipients (Separate tailored emails, NOT mass BCC)
      // A. Converting Counselor (if admission/lead and configured)
      if (rule.notifyConvertingCounselor && input.counselorId) {
        const counselor = await db.user.findUnique({
          where: { id: input.counselorId },
          select: { email: true, firstName: true },
        });

        if (counselor?.email && counselor.email.includes("@")) {
          const counselorSubject = `Internal Notice: Lead Converted / Action on ${input.payload.studentName || "Student"}`;
          const counselorHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
              <h3 style="color: #0284c7;">SOFTLAB GLOBAL — Internal Operational Notice</h3>
              <p>Hello <strong>${counselor.firstName}</strong>,</p>
              <p>Your candidate <strong>${input.payload.studentName || "Candidate"}</strong> (${input.payload.studentId || "ID"}) has completed the admission process.</p>
              <p>Course: <strong>${input.payload.courseTitle || "Enrolled Course"}</strong></p>
              <p style="font-size: 12px; color: #64748b; margin-top: 20px;">Admissions Directorate • SoftLab Global</p>
            </div>
          `;

          await EmailService.sendEmail({
            to: counselor.email,
            subject: counselorSubject,
            html: counselorHtml,
            fromEmail: rule.senderEmail,
            fromName: rule.senderName,
            templateCode: `${idempotencyKey}:COUNSELOR`,
          });
          dispatchedCount++;
        }
      }

      // B. Finance Desk (for bills, expenses, payments)
      if (rule.notifyFinance) {
        const financeUsers = await db.user.findMany({
          where: {
            status: "ACTIVE",
            roleCode: { in: [UserRoleCode.ACCOUNTANT, UserRoleCode.ADMIN] },
          },
          select: { email: true, firstName: true },
          take: 3,
        });

        for (const fu of financeUsers) {
          if (!fu.email) continue;
          const finSubject = `[Finance Action Required] ${input.eventType.replace(/_/g, " ")}: ${input.payload.reference || input.entityId}`;
          const finHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
              <h3 style="color: #059669;">Accounts & Finance Desk Notification</h3>
              <p>Hello <strong>${fu.firstName}</strong>,</p>
              <p>A new financial record requires review/reconciliation in the LMS Accounts module:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
                <tr><td style="padding: 6px; color: #64748b;">Event:</td><td style="padding: 6px; font-weight: bold;">${input.eventType}</td></tr>
                <tr><td style="padding: 6px; color: #64748b;">Reference:</td><td style="padding: 6px; font-weight: bold;">${input.payload.reference || input.entityId}</td></tr>
                ${input.amountPaise ? `<tr><td style="padding: 6px; color: #64748b;">Amount:</td><td style="padding: 6px; font-weight: bold;">₹${(input.amountPaise / 100).toLocaleString("en-IN")}</td></tr>` : ""}
              </table>
              <p><a href="https://lms.softlabglobal.com/admin/finance" style="background: #059669; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Review in Accounts Portal</a></p>
            </div>
          `;

          await EmailService.sendEmail({
            to: fu.email,
            subject: finSubject,
            html: finHtml,
            fromEmail: rule.senderEmail,
            fromName: rule.senderName,
            templateCode: `${idempotencyKey}:FINANCE:${fu.email}`,
          });
          dispatchedCount++;
        }
      }

      // C. Escalation to Higher Management (if threshold breached or configured)
      const shouldEscalate =
        rule.notifyHigherManagement ||
        (rule.escalationThresholdPaise &&
          input.amountPaise &&
          input.amountPaise >= rule.escalationThresholdPaise);

      if (shouldEscalate) {
        const mgmtUsers = await db.user.findMany({
          where: {
            status: "ACTIVE",
            roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR] },
          },
          select: { email: true, firstName: true },
        });

        for (const mu of mgmtUsers) {
          if (!mu.email) continue;
          const mgmtSubject = `[Executive Escalation] ${input.eventType.replace(/_/g, " ")} (${input.payload.reference || input.entityId})`;
          const mgmtHtml = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; border-left: 4px solid #b91c1c;">
              <h3 style="color: #b91c1c;">SOFTLAB GLOBAL — Executive Alert</h3>
              <p>Dear <strong>${mu.firstName}</strong>,</p>
              <p>A transaction exceeding threshold authorization has been registered in the ERP:</p>
              <p>Type: <strong>${input.eventType}</strong> | Value: <strong>₹${input.amountPaise ? (input.amountPaise / 100).toLocaleString("en-IN") : "N/A"}</strong></p>
              <p><a href="https://lms.softlabglobal.com/admin/finance" style="color: #b91c1c; font-weight: bold;">View Details on Management Dashboard →</a></p>
            </div>
          `;

          await EmailService.sendEmail({
            to: mu.email,
            subject: mgmtSubject,
            html: mgmtHtml,
            fromEmail: rule.senderEmail,
            fromName: rule.senderName,
            templateCode: `${idempotencyKey}:MGMT:${mu.email}`,
          });
          dispatchedCount++;
        }
      }
    } catch (err: any) {
      console.error("[IntelligentNotificationEngine] Error:", err);
      errors.push(err.message || String(err));
    }

    return {
      success: errors.length === 0,
      dispatchedCount,
      errors,
    };
  }

  private static generateSubject(eventType: string, payload: Record<string, any>): string {
    switch (eventType) {
      case "NEW_STUDENT_ADMISSION":
        return `Official Admission Confirmation & LMS Credentials — SOFTLAB GLOBAL (${payload.studentId || ""})`;
      case "NEW_STAFF_ONBOARDING":
        return `Welcome to SOFTLAB GLOBAL — Employee Portal & ERP Access (${payload.employeeId || ""})`;
      case "VENDOR_BILL_REGISTERED":
        return `Purchase Bill Acknowledgment — ${payload.billNumber || ""}`;
      case "EXPENSE_CLAIM_SUBMITTED":
        return `Reimbursement Claim Received — ${payload.expenseNumber || ""}`;
      default:
        return `Official Notification from SOFTLAB GLOBAL`;
    }
  }

  private static generatePrimaryHtml(
    eventType: string,
    payload: Record<string, any>,
    senderName: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #0284c7; margin: 0;">SOFTLAB GLOBAL</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">${senderName}</p>
        </div>
        <p style="font-size: 15px;">Dear <strong>${payload.name || payload.studentName || payload.staffName || "Recipient"}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">${payload.message || "This is an official communication regarding your account and records at SOFTLAB GLOBAL."}</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://lms.softlabglobal.com/login" style="background: #0284c7; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Access LMS Portal</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          SOFTLAB GLOBAL • 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, UP - 211011
        </p>
      </div>
    `;
  }
}
