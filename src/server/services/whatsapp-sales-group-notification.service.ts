import { db } from "@/server/db/client";
import { WhatsAppBusinessConfigService } from "./whatsapp-business-config.service";
import { WhatsAppBusinessService } from "./whatsapp-business.service";

export interface StudentAdmissionNotificationData {
  applicationId?: string;
  studentId: string;
  admissionNumber: string;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  courseTitle: string;
  specialization?: string | null;
  providerType?: "SOFTLAB" | "UNIVERSITY";
  providerName?: string;
  universityName?: string | null;
  universityProgram?: string | null;
  city?: string | null;
  state?: string | null;
  totalCourseFee: number; // in paise
  discountAmount?: number; // in paise
  discountReason?: string | null;
  finalFee: number; // in paise
  paidAmount?: number; // in paise
  paymentMethod?: string | null;
  receiptNumber?: string | null;
  paymentPlan?: "LUMPSUM" | "EMI" | string;
  installmentCount?: number;
  counselorName?: string | null;
  admissionDate?: Date;
  leadId?: string | null;
}

export class WhatsAppSalesGroupNotificationService {
  public static readonly DEFAULT_SALES_GROUP_LINK = "https://chat.whatsapp.com/DpyKh8CNUvJBhly9UVEyEK";

  /**
   * Formats complete, professional student admission dossier for the WhatsApp Sales Group
   */
  public static formatAdmissionAnnouncement(data: StudentAdmissionNotificationData): string {
    const isUniv = data.providerType === "UNIVERSITY" || !!data.universityName;
    const providerLabel = isUniv
      ? (data.universityName || "Dr. Preeti Global University")
      : (data.providerName || "SOFTLAB GLOBAL Main Campus");

    const programLabel = isUniv
      ? `${data.universityProgram || data.courseTitle}${data.specialization ? ` (${data.specialization})` : ""}`
      : `${data.courseTitle}${data.specialization ? ` (${data.specialization})` : ""}`;

    const totalInr = Math.round(data.totalCourseFee / 100).toLocaleString("en-IN");
    const discountInr = data.discountAmount ? Math.round(data.discountAmount / 100).toLocaleString("en-IN") : "0";
    const netInr = Math.round(data.finalFee / 100).toLocaleString("en-IN");
    const paidInr = data.paidAmount ? Math.round(data.paidAmount / 100).toLocaleString("en-IN") : "0";
    const pendingInr = Math.max(0, Math.round((data.finalFee - (data.paidAmount || 0)) / 100)).toLocaleString("en-IN");

    const admDate = data.admissionDate || new Date();
    const formattedDate = admDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const lines = [
      `🎓 *NEW ADMISSION CONFIRMED — SOFTLAB GLOBAL LMS* 🚀`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Student Name*: ${data.applicantName}`,
      `🆔 *Student ID*: ${data.studentId}`,
      `📄 *Admission No*: ${data.admissionNumber}`,
      `📚 *Enrolled Program*: ${programLabel}`,
      `🏛️ *Academic Provider*: ${providerLabel}`,
      `📍 *Location*: ${data.city || "Prayagraj"}${data.state ? `, ${data.state}` : ", UP"}`,
      `📱 *Mobile*: +91 ${data.applicantPhone.replace(/\D/g, "").slice(-10)}`,
      `📧 *Email*: ${data.applicantEmail}`,
      ``,
      `💰 *FEE & PAYMENT BREAKDOWN*:`,
      `• Total Fee: ₹${totalInr}`,
      ...(data.discountAmount && data.discountAmount > 0
        ? [`• Discount: ₹${discountInr}${data.discountReason ? ` (${data.discountReason})` : ""}`]
        : []),
      `• Net Payable Fee: ₹${netInr}`,
      `• Amount Paid Today: ₹${paidInr}${data.paymentMethod ? ` [${data.paymentMethod}]` : ""}`,
      ...(data.receiptNumber ? [`• Receipt Number: ${data.receiptNumber}`] : []),
      `• Balance Pending: ₹${pendingInr}`,
      `• Payment Mode: ${data.paymentPlan === "EMI" ? `EMI (${data.installmentCount || 3} Slots)` : "Lumpsum"}`,
      ``,
      `🎯 *Counselor / Enrolled By*: ${data.counselorName || "Admissions Team"}`,
      `🕒 *Admission Timestamp*: ${formattedDate}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🌐 *LMS Student Portal*: https://softlabglobal.com/login`,
      `✨ *Welcome to SoftLab Global family!* 🌟`,
    ];

    return lines.join("\n");
  }

  /**
   * Generates a direct WhatsApp share URL containing the pre-filled student admission message
   */
  public static generateWhatsAppShareUrl(message: string): string {
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }

  /**
   * Automatically broadcasts the admission notification:
   * 1. Sends to configured sales team phone numbers via WhatsApp Cloud API
   * 2. Calls webhook gateway if configured
   * 3. Records timeline and audit event
   */
  public static async broadcastAdmissionToSales(data: StudentAdmissionNotificationData): Promise<{
    success: boolean;
    shareUrl: string;
    message: string;
    dispatchedToPhones: string[];
    groupLink: string;
  }> {
    const message = this.formatAdmissionAnnouncement(data);
    const shareUrl = this.generateWhatsAppShareUrl(message);

    const config = await WhatsAppBusinessConfigService.getConfig();
    const groupLink = config.salesGroupInviteLink || this.DEFAULT_SALES_GROUP_LINK;

    const dispatchedToPhones: string[] = [];

    // 1. Dispatch via WhatsApp Cloud API to configured sales team phone numbers
    if (config.salesTeamPhoneNumbers && config.salesTeamPhoneNumbers.length > 0) {
      for (const phone of config.salesTeamPhoneNumbers) {
        try {
          const res = await WhatsAppBusinessService.sendMessage({
            toPhone: phone,
            text: message,
            leadId: data.leadId || undefined,
          });
          if (res.success) {
            dispatchedToPhones.push(phone);
          }
        } catch (err: any) {
          console.error(`[WhatsAppSalesGroupNotificationService] Failed sending to ${phone}:`, err.message);
        }
      }
    }

    // 2. Dispatch to custom webhook / gateway if configured
    if (config.salesGroupWebhookUrl) {
      try {
        await fetch(config.salesGroupWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "STUDENT_ADMISSION_CONFIRMED",
            groupId: config.salesGroupId || undefined,
            groupLink,
            message,
            admissionData: data,
          }),
        });
      } catch (err: any) {
        console.error("[WhatsAppSalesGroupNotificationService] Gateway webhook failed:", err.message);
      }
    }

    // 3. Record timeline event if leadId exists
    if (data.leadId) {
      try {
        await db.customerTimelineEvent.create({
          data: {
            leadId: data.leadId,
            eventType: "WHATSAPP_SALES_BROADCAST",
            source: "WHATSAPP",
            title: "Student Admission Dossier Prepared for Sales Group",
            summary: `Complete admission card formatted and ready for WhatsApp Sales Group (${groupLink}).`,
            metadata: {
              studentId: data.studentId,
              admissionNumber: data.admissionNumber,
              receiptNumber: data.receiptNumber,
              dispatchedToPhones,
              groupLink,
            },
          },
        });
      } catch (err: any) {
        console.warn("[WhatsAppSalesGroupNotificationService] Timeline logging error:", err.message);
      }
    }

    return {
      success: true,
      shareUrl,
      message,
      dispatchedToPhones,
      groupLink,
    };
  }
}
