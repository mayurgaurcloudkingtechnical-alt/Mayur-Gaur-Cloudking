import { db } from "@/server/db/client";
import { SoftLabKnowledgeService } from "./softlab-knowledge.service";

export interface AiCounselorResponse {
  replyText: string;
  leadScore: number;
  temperature: "HOT" | "WARM" | "COLD";
  intent: string;
  confidence: number;
  escalationRequired: boolean;
  escalationReason?: string;
  suggestedAction?: "SEND_BROCHURE" | "SCHEDULE_CALL" | "SEND_PAYMENT_LINK" | "COUNSELOR_TAKEOVER";
}

export class AiCounselorService {
  /**
   * Search dynamic AI Knowledge base for relevant context
   */
  public static async queryKnowledgeBase(query: string, category?: string): Promise<string> {
    const qLower = query.toLowerCase();

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    const docs = await db.aiKnowledgeDoc.findMany({
      where,
      orderBy: { priority: "desc" },
      take: 10,
    });

    const matches = docs.filter((doc) => {
      const matchTitle = doc.title.toLowerCase().includes(qLower);
      const matchContent = doc.content.toLowerCase().includes(qLower);
      const matchTags = doc.tags?.some((t) => qLower.includes(t.toLowerCase()));
      const matchKeywords = doc.keywords?.some((k) => qLower.includes(k.toLowerCase()));
      return matchTitle || matchContent || matchTags || matchKeywords;
    });

    if (matches.length > 0) {
      return matches.map((m) => `[${m.category} - ${m.title}]: ${m.content}`).join("\n\n");
    }

    return "";
  }

  /**
   * Process incoming inquiry through grounded AI Counselor reasoning
   */
  public static async counsel(params: {
    leadId: string;
    leadName: string;
    leadPhone: string;
    courseName?: string;
    userMessage: string;
    channel: "WHATSAPP" | "WEB_CHAT" | "VOICE_CALL";
  }): Promise<AiCounselorResponse> {
    const { leadId, leadName, courseName, userMessage } = params;
    const msg = userMessage.toLowerCase().trim();

    // 1. Fetch grounded verified institutional knowledge
    const instituteFacts = await SoftLabKnowledgeService.getKnowledge();
    const dynamicKb = await this.queryKnowledgeBase(userMessage);

    // 2. Identify Intent & Sentiment
    const isFeeQuery = msg.includes("fee") || msg.includes("cost") || msg.includes("price") || msg.includes("charges") || msg.includes("emi");
    const isDiscountQuery = msg.includes("discount") || msg.includes("offer") || msg.includes("concession") || msg.includes("scholarship");
    const isPlacementQuery = msg.includes("placement") || msg.includes("job") || msg.includes("salary") || msg.includes("package") || msg.includes("hiring");
    const isSyllabusQuery = msg.includes("syllabus") || msg.includes("curriculum") || msg.includes("topics") || msg.includes("modules") || msg.includes("brochure");
    const isLocationQuery = msg.includes("where") || msg.includes("location") || msg.includes("address") || msg.includes("center") || msg.includes("campus") || msg.includes("prayagraj");
    const isAdmissionQuery = msg.includes("admission") || msg.includes("join") || msg.includes("enroll") || msg.includes("register") || msg.includes("seat") || msg.includes("batch");
    const isComplaintQuery = msg.includes("complaint") || msg.includes("fraud") || msg.includes("fake") || msg.includes("cheated") || msg.includes("bad") || msg.includes("worst") || msg.includes("legal");
    const isStopQuery = msg === "stop" || msg.includes("unsubscribe") || msg === "optout" || msg === "dnc";

    // 3. Handle Privacy / STOP
    if (isStopQuery) {
      return {
        replyText: `You have been successfully unsubscribed from automated messages. You will not receive any further automated outreach from SoftLab Global. To resume, reply START anytime.`,
        leadScore: 0,
        temperature: "COLD",
        intent: "OPTOUT",
        confidence: 1.0,
        escalationRequired: false,
      };
    }

    // 4. Handle Complaints or Legal/Sensitive words -> Immediate High Severity Escalation
    if (isComplaintQuery) {
      await db.escalationTask.create({
        data: {
          leadId,
          reason: "COMPLAINT",
          severity: "CRITICAL",
          status: "OPEN",
          description: `Lead sent potential grievance/complaint: "${userMessage}"`,
        },
      });

      return {
        replyText: `Dear ${leadName}, we treat your feedback with the utmost priority. A Senior Academic Director from SoftLab Global has been alerted and will personally contact you shortly to address this.`,
        leadScore: 40,
        temperature: "COLD",
        intent: "COMPLAINT",
        confidence: 0.95,
        escalationRequired: true,
        escalationReason: "Customer grievance or critical sentiment detected.",
        suggestedAction: "COUNSELOR_TAKEOVER",
      };
    }

    // 5. Handle Discount Request -> Escalation to Counselor (AI never gives unauthorized discounts)
    if (isDiscountQuery) {
      await db.escalationTask.create({
        data: {
          leadId,
          reason: "DISCOUNT_REQUEST",
          severity: "MEDIUM",
          status: "OPEN",
          description: `Lead requested scholarship/discount evaluation: "${userMessage}"`,
        },
      });

      const matchedCourse = instituteFacts.courses.find((c) =>
        courseName ? c.title.toLowerCase().includes(courseName.toLowerCase()) : false
      );

      const feePaise = matchedCourse ? matchedCourse.feeInRupees : 45000;

      return {
        replyText: `Dear ${leadName}, our standard fee for the comprehensive industry program is ₹${feePaise.toLocaleString("en-IN")}. Merit scholarships and flexible 0% interest EMI options are evaluated individually by our Admissions Board based on academic and test credentials. I have forwarded your profile to our Senior Admissions Counselor, who will discuss eligible scholarship concessions with you today.`,
        leadScore: 85,
        temperature: "HOT",
        intent: "DISCOUNT_REQUEST",
        confidence: 0.92,
        escalationRequired: true,
        escalationReason: "Lead requested scholarship/discount qualification.",
        suggestedAction: "COUNSELOR_TAKEOVER",
      };
    }

    // 6. Handle Fee Inquiry
    if (isFeeQuery) {
      const matchedCourse = instituteFacts.courses.find((c) =>
        courseName ? c.title.toLowerCase().includes(courseName.toLowerCase()) : false
      ) || instituteFacts.courses[0];

      const fee = matchedCourse?.feeInRupees || 45000;
      return {
        replyText: `The fee for *${matchedCourse?.title || "Full Stack & AI Development"}* is ₹${fee.toLocaleString("en-IN")} (inclusive of curriculum, live projects, placement cell access, and certifications). We also provide flexible 0% interest monthly installment (EMI) options.\n\nWould you like me to send you the detailed syllabus brochure or connect you with our admissions counselor for batch timings?`,
        leadScore: 75,
        temperature: "WARM",
        intent: "FEE_INQUIRY",
        confidence: 0.95,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
      };
    }

    // 7. Handle Placement Inquiry
    if (isPlacementQuery) {
      return {
        replyText: `SoftLab Global provides *${instituteFacts.placementClaim}* with over *${instituteFacts.corporateRecruitingPartnersCount}* corporate recruiting partners across India. Students work directly on live industry projects and capstone portfolios to ensure interview readiness.\n\nWould you like to see recent placement statistics and hiring companies?`,
        leadScore: 80,
        temperature: "HOT",
        intent: "PLACEMENT_INQUIRY",
        confidence: 0.96,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
      };
    }

    // 8. Handle Syllabus / Brochure
    if (isSyllabusQuery) {
      return {
        replyText: `Certainly, ${leadName}! I have attached the latest syllabus and course curriculum for *${courseName || "our flagship professional programs"}*. It includes hands-on modules, live capstone projects, and industry tools.\n\nLet me know if you would like to attend a free live classroom demo session this week!`,
        leadScore: 70,
        temperature: "WARM",
        intent: "SYLLABUS_REQUEST",
        confidence: 0.94,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
      };
    }

    // 9. Handle Location / Campus Inquiry
    if (isLocationQuery) {
      return {
        replyText: `SoftLab Global's primary campus and tech center is located at *${instituteFacts.campusLocation}*.\n\nWe offer both interactive classroom training at our Prayagraj campus and live online interactive batches with mentor support. Which mode do you prefer?`,
        leadScore: 65,
        temperature: "WARM",
        intent: "LOCATION_INQUIRY",
        confidence: 0.98,
        escalationRequired: false,
      };
    }

    // 10. Handle Direct Admission / Enrolment Inquiry
    if (isAdmissionQuery) {
      return {
        replyText: `That's great, ${leadName}! Admissions for the upcoming batch are currently open. I can generate your provisional admission seat link or arrange a direct 1-on-1 counseling call with our Admissions Head right away. Shall I proceed?`,
        leadScore: 90,
        temperature: "HOT",
        intent: "ADMISSION_READY",
        confidence: 0.93,
        escalationRequired: false,
        suggestedAction: "SCHEDULE_CALL",
      };
    }

    // 11. General grounded fallback
    return {
      replyText: `Hello ${leadName}! Thank you for reaching out to SoftLab Global. We offer premium IT, AI, and Software Engineering training with 100% placement support and live industry projects at Civil Lines, Prayagraj.\n\nHow can I help you today? Feel free to ask about courses, batch timings, fee structures, or career placements!`,
      leadScore: 55,
      temperature: "WARM",
      intent: "GENERAL_INQUIRY",
      confidence: 0.85,
      escalationRequired: false,
    };
  }
}
