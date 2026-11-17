import { db } from "@/server/db/client";
import { EmailService } from "./email.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";
import { UserRoleCode } from "@prisma/client";

const OFFICIAL_INFO_WHATSAPP = "919196596875"; // 9196596875

export class PaymentReceiptNotificationService {
  /**
   * Idempotently dispatches:
   * 1) Student Fee Receipt via Email + WhatsApp
   * 2) Payment Success Notification from Sales Counselor -> Manager -> Admin -> Super Admin
   *    via Email, WhatsApp (9196596875 for official info + dedicated staff numbers), and CRM/ERP Notification
   */
  static async dispatchForPayment(paymentId: string): Promise<{
    alreadyDispatched?: boolean;
    studentEmailSent: boolean;
    studentWhatsappSent: boolean;
    staffNotifiedCount: number;
    officialWhatsappSent: boolean;
  }> {
    // Idempotency guard against repeated Razorpay webhook / verify calls
    const existingLog = await db.auditLog.findFirst({
      where: {
        action: "PAYMENT_RECEIPT_OMNICHANNEL_DISPATCHED",
        resourceType: "PaymentTransaction",
        resourceId: paymentId,
      },
      select: { id: true },
    });
    if (existingLog) {
      return {
        alreadyDispatched: true,
        studentEmailSent: false,
        studentWhatsappSent: false,
        staffNotifiedCount: 0,
        officialWhatsappSent: false,
      };
    }

    const payment = await db.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { user: true } },
        admission: {
          include: {
            course: true,
            counselor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                whatsappNumber: true,
                callingNumber: true,
                roleCode: true,
              },
            },
            lead: {
              select: {
                id: true,
                assignedToId: true,
                assignedCounselorId: true,
              },
            },
          },
        },
        feeStructure: { include: { course: true } },
        enrollment: { include: { course: true } },
      },
    });

    if (!payment) {
      return {
        studentEmailSent: false,
        studentWhatsappSent: false,
        staffNotifiedCount: 0,
        officialWhatsappSent: false,
      };
    }

    const studentName =
      (payment.student?.user
        ? `${payment.student.user.firstName} ${payment.student.user.lastName}`.trim()
        : payment.admission?.applicantName) || "Student";
    const studentEmail = payment.student?.user?.email || payment.admission?.applicantEmail || "";
    const studentPhone = payment.student?.user?.phone || payment.admission?.applicantPhone || "";
    const courseTitle =
      payment.enrollment?.course?.title ||
      payment.feeStructure?.course?.title ||
      payment.admission?.course?.title ||
      "SoftLab Global Program";
    const receiptNo = payment.receiptNumber || payment.transactionReference || payment.id;
    const paidAmountInr = Math.round((payment.amount || 0) / 100);
    const pendingAmountInr = payment.feeStructure ? Math.max(0, Math.round((payment.feeStructure.pendingAmount || 0) / 100)) : 0;
    const receiptUrl = `https://lms.softlabglobal.com/admin/finance/receipt?ref=${encodeURIComponent(receiptNo)}`;
    const studentPortalUrl = "https://lms.softlabglobal.com/student/payments";
    const paidAtStr = (payment.paidAt || new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // 1. Send Receipt to Student (Email + WhatsApp)
    let studentEmailSent = false;
    let studentWhatsappSent = false;

    if (studentEmail && !studentEmail.endsWith("@pending.softlabglobal.com")) {
      const emailRes = await EmailService.sendEmail({
        to: studentEmail,
        subject: `Fee Payment Receipt ${receiptNo} – SoftLab Global`,
        html: `<div style="font-family:sans-serif;max-width:620px;line-height:1.6;color:#0f172a">
          <h2 style="color:#059669">Fee Payment Receipt – SoftLab Global</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Thank you! Your fee payment has been received successfully.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px;border:1px solid #e2e8f0"><strong>Receipt Number</strong></td><td style="padding:6px;border:1px solid #e2e8f0">${receiptNo}</td></tr>
            <tr><td style="padding:6px;border:1px solid #e2e8f0"><strong>Course</strong></td><td style="padding:6px;border:1px solid #e2e8f0">${courseTitle}</td></tr>
            <tr><td style="padding:6px;border:1px solid #e2e8f0"><strong>Paid Amount</strong></td><td style="padding:6px;border:1px solid #e2e8f0">₹${paidAmountInr.toLocaleString("en-IN")}</td></tr>
            <tr><td style="padding:6px;border:1px solid #e2e8f0"><strong>Pending Balance</strong></td><td style="padding:6px;border:1px solid #e2e8f0">₹${pendingAmountInr.toLocaleString("en-IN")}</td></tr>
            <tr><td style="padding:6px;border:1px solid #e2e8f0"><strong>Payment Date</strong></td><td style="padding:6px;border:1px solid #e2e8f0">${paidAtStr}</td></tr>
          </table>
          <p><a href="${studentPortalUrl}" style="background:#059669;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">View Receipt in Student Portal</a></p>
        </div>`,
        text: `Fee Payment Receipt ${receiptNo} | Student: ${studentName} | Course: ${courseTitle} | Paid: Rs.${paidAmountInr} | Pending: Rs.${pendingAmountInr} | Date: ${paidAtStr} | Portal: ${studentPortalUrl}`,
      }).catch(() => ({ success: false }));
      studentEmailSent = Boolean((emailRes as any)?.success);
    }

    if (studentPhone) {
      const waMsg =
        `*Fee Payment Receipt – SoftLab Global*\n\n` +
        `Dear ${studentName},\n` +
        `Your payment of *₹${paidAmountInr.toLocaleString("en-IN")}* has been received.\n\n` +
        `• Receipt No: ${receiptNo}\n` +
        `• Course: ${courseTitle}\n` +
        `• Pending Balance: ₹${pendingAmountInr.toLocaleString("en-IN")}\n` +
        `• Date: ${paidAtStr}\n\n` +
        `View Receipt: ${studentPortalUrl}`;
      const waRes = await WhatsAppBusinessService.sendMessage({
        toPhone: studentPhone,
        text: waMsg,
        leadId: payment.admission?.leadId || undefined,
      }).catch(() => ({ success: false }));
      studentWhatsappSent = Boolean((waRes as any)?.success);
    }

    // 2. Resolve Counselor (Sales Owner) + Management Hierarchy (Manager -> Admin -> Director -> Super Admin)
    const ownerCounselorId =
      payment.admission?.counselorId ||
      payment.admission?.lead?.assignedCounselorId ||
      payment.admission?.lead?.assignedToId ||
      null;

    const hierarchyUsers = await db.user.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          ...(ownerCounselorId ? [{ id: ownerCounselorId }] : []),
          { roleCode: { in: [UserRoleCode.SUPER_ADMIN, UserRoleCode.DIRECTOR, UserRoleCode.ADMIN, UserRoleCode.MANAGER] } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        whatsappNumber: true,
        callingNumber: true,
        roleCode: true,
      },
    });

    const counselorName = payment.admission?.counselor
      ? `${payment.admission.counselor.firstName} ${payment.admission.counselor.lastName}`.trim()
      : "Assigned Counselor";

    const staffText =
      `Payment Success Alert – SoftLab Global\n\n` +
      `Student: ${studentName}\n` +
      `Course: ${courseTitle}\n` +
      `Paid Amount: ₹${paidAmountInr.toLocaleString("en-IN")}\n` +
      `Pending Balance: ₹${pendingAmountInr.toLocaleString("en-IN")}\n` +
      `Receipt No: ${receiptNo}\n` +
      `Counselor: ${counselorName}\n` +
      `Receipt URL: ${receiptUrl}`;

    let staffNotifiedCount = 0;
    const sentPhones = new Set<string>();

    for (const staff of hierarchyUsers) {
      await db.notification.create({
        data: {
          userId: staff.id,
          title: `Payment Received: ₹${paidAmountInr.toLocaleString("en-IN")} (${studentName})`,
          message: `${studentName} paid ₹${paidAmountInr.toLocaleString("en-IN")} for ${courseTitle} (Receipt: ${receiptNo}). Counselor: ${counselorName}.`,
          type: "FEE_PAYMENT",
        },
      }).catch(() => {});
      staffNotifiedCount++;

      if (staff.email) {
        await EmailService.sendEmail({
          to: staff.email,
          subject: `Payment Success Alert: ₹${paidAmountInr.toLocaleString("en-IN")} – ${studentName} (${receiptNo})`,
          html: `<div style="font-family:sans-serif;max-width:600px;line-height:1.5">
            <h3 style="color:#0f766e">Payment Success Notification</h3>
            <p>${staffText.replace(/\n/g, "<br/>")}</p>
            <p><a href="${receiptUrl}">Open Official Receipt in ERP</a></p>
          </div>`,
          text: staffText,
        }).catch(() => {});
      }

      const dedicatedPhone = staff.whatsappNumber || staff.callingNumber || staff.phone;
      if (dedicatedPhone) {
        const normalized = WhatsAppBusinessService.normalizePhone(dedicatedPhone);
        if (normalized && !sentPhones.has(normalized)) {
          sentPhones.add(normalized);
          await WhatsAppBusinessService.sendMessage({
            toPhone: dedicatedPhone,
            text: staffText,
          }).catch(() => {});
        }
      }
    }

    // 3. Official Information WhatsApp Number (9196596875)
    let officialWhatsappSent = false;
    if (!sentPhones.has(OFFICIAL_INFO_WHATSAPP)) {
      const offRes = await WhatsAppBusinessService.sendMessage({
        toPhone: OFFICIAL_INFO_WHATSAPP,
        text: `[OFFICIAL INFO] ${staffText}`,
      }).catch(() => ({ success: false }));
      officialWhatsappSent = Boolean((offRes as any)?.success);
    } else {
      officialWhatsappSent = true;
    }

    // 4. Record CustomerTimelineEvent if Lead exists
    if (payment.admission?.leadId) {
      await db.customerTimelineEvent.create({
        data: {
          leadId: payment.admission.leadId,
          eventType: "PAYMENT_RECEIPT_SENT",
          source: "FINANCE",
          title: `Fee Receipt Sent (${receiptNo})`,
          summary: `Paid ₹${paidAmountInr.toLocaleString("en-IN")} | Email: ${studentEmailSent ? "SENT" : "SKIPPED"} | WhatsApp: ${studentWhatsappSent ? "SENT" : "SKIPPED"}`,
          metadata: { paymentId, receiptNo, paidAmountInr, pendingAmountInr },
        },
      }).catch(() => {});
    }

    await db.auditLog.create({
      data: {
        action: "PAYMENT_RECEIPT_OMNICHANNEL_DISPATCHED",
        resourceType: "PaymentTransaction",
        resourceId: paymentId,
        newData: {
          receiptNo,
          studentEmailSent,
          studentWhatsappSent,
          staffNotifiedCount,
          officialWhatsappSent,
        },
      },
    });

    return {
      studentEmailSent,
      studentWhatsappSent,
      staffNotifiedCount,
      officialWhatsappSent,
    };
  }
}
