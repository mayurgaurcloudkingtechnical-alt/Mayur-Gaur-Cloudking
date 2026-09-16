import { db } from "@/server/db/client";

export interface BotWebhookMessage {
  fromPhone: string;
  messageBody: string;
  messageId?: string;
  timestamp?: Date;
}

export class AiChatbotService {
  /**
   * Generates the personalized welcome message sent within 15 seconds of lead capture.
   */
  static generateWelcomeMessage(studentName: string, courseName?: string | null): string {
    const targetCourse = courseName ? courseName : "our IT Certification & Job-Oriented programs";
    return (
      `Namaste ${studentName}! 🙏\n\n` +
      `Welcome to *SOFTLAB GLOBAL* (https://www.softlabglobal.com).\n\n` +
      `We noticed your inquiry regarding *${targetCourse}*.\n\n` +
      `To help our training team provide you with the exact syllabus, upcoming batch schedule, and scholarship details, could you please let us know:\n` +
      `1️⃣ Are you looking for *Classroom Training (Offline)* or *Live Online*?\n` +
      `2️⃣ Are you currently a *College Student* or *Working Professional*?\n\n` +
      `_Our academic team is standing by to guide your career path!_`
    );
  }

  /**
   * Dispatches instant auto-reply for newly captured lead.
   * If Meta WhatsApp Cloud API credentials are configured in .env, sends via HTTP.
   * Also logs the activity into LeadActivity.
   */
  static async triggerInstantWelcome(leadId: string) {
    const lead = await db.lead.findUnique({
      where: { id: leadId },
      include: {
        course: true,
        assignedCounselor: true,
        assignedTelecaller: true,
      },
    });

    if (!lead) return;

    const messageText = this.generateWelcomeMessage(lead.fullName, lead.course?.title);

    // Meta WhatsApp Cloud API integration check
    const whatsappToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    let dispatchStatus = "QUEUED_LOCAL";

    if (whatsappToken && whatsappPhoneId) {
      try {
        const payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: lead.phone.startsWith("91") ? lead.phone : `91${lead.phone}`,
          type: "text",
          text: { preview_url: true, body: messageText },
        };

        const res = await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          dispatchStatus = "SENT_LIVE";
        } else {
          dispatchStatus = "API_ERROR";
        }
      } catch {
        dispatchStatus = "SEND_FAILED";
      }
    }

    // Log the automated bot activity
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        activityType: "AI_WHATSAPP_WELCOME_SENT",
        disposition: dispatchStatus,
        notes: `AI Welcome Message: "${messageText.substring(0, 120)}..." (Status: ${dispatchStatus})`,
      },
    });

    return { success: true, dispatchStatus, messageText };
  }

  /**
   * Processes incoming student reply to qualify the lead and enrich context.
   */
  static async processStudentReply(input: BotWebhookMessage) {
    const cleanPhone = input.fromPhone.replace(/\D/g, "");
    const normalized = cleanPhone.length === 12 && cleanPhone.startsWith("91") ? cleanPhone.slice(2) : cleanPhone;

    const lead = await db.lead.findFirst({
      where: { phone: normalized },
      include: {
        assignedCounselor: true,
        assignedTelecaller: true,
      },
    });

    if (!lead) {
      return { handled: false, error: "Lead not found for incoming number" };
    }

    const replyLower = input.messageBody.toLowerCase();

    let extractedMode = "Unspecified";
    if (replyLower.includes("offline") || replyLower.includes("classroom") || replyLower.includes("center")) {
      extractedMode = "Offline (Classroom)";
    } else if (replyLower.includes("online") || replyLower.includes("remote") || replyLower.includes("zoom")) {
      extractedMode = "Online (Live)";
    }

    let extractedProfile = "Student";
    if (replyLower.includes("job") || replyLower.includes("working") || replyLower.includes("professional") || replyLower.includes("experience")) {
      extractedProfile = "Working Professional";
    }

    const qualificationSummary = `Mode: ${extractedMode} | Background: ${extractedProfile} | Student said: "${input.messageBody.slice(0, 100)}"`;

    // Update Lead with AI qualification
    const isHot = extractedMode !== "Unspecified" || replyLower.includes("fee") || replyLower.includes("admission") || replyLower.includes("join");

    await db.lead.update({
      where: { id: lead.id },
      data: {
        botQualified: true,
        botSummary: qualificationSummary,
        qualityScore: isHot ? "HOT" : lead.qualityScore,
        lastChatTranscript: `${lead.lastChatTranscript ? lead.lastChatTranscript + "\n\n" : ""}Student (${new Date().toLocaleTimeString()}): ${input.messageBody}`,
      },
    });

    // Record activity
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        activityType: "STUDENT_CHATBOT_REPLY",
        disposition: isHot ? "HOT_QUALIFIED" : "ENGAGED",
        notes: qualificationSummary,
      },
    });

    return {
      handled: true,
      leadId: lead.id,
      assignedStaff: lead.assignedCounselor || lead.assignedTelecaller,
      qualificationSummary,
      isHot,
    };
  }
}
