import { db } from "@/server/db/client";
import { SoftLabKnowledgeService } from "./softlab-knowledge.service";
import { LmsCourseMasterService, MasterCourseRecord } from "./lms-course-master.service";
import { LanguageIntelligenceService, SupportedLanguage } from "./language-intelligence.service";

export interface AiCounselorResponse {
  replyText: string;
  leadScore: number;
  temperature: "HOT" | "WARM" | "COLD";
  intent: string;
  confidence: number;
  detectedLanguage: SupportedLanguage;
  matchedCourse?: MasterCourseRecord;
  escalationRequired: boolean;
  escalationReason?: string;
  suggestedAction?: "SEND_BROCHURE" | "SCHEDULE_CALL" | "SEND_PAYMENT_LINK" | "COUNSELOR_TAKEOVER";
  qualificationExtracted?: {
    education?: string;
    learningMode?: string;
    preferredCallbackTime?: string;
    objections?: string[];
  };
}

export class AiCounselorService {
  /**
   * Search dynamic Super Admin AI Knowledge base for institutional policies
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
   * Uses LMS Course Master as the SINGLE SOURCE OF TRUTH for all fees and curricula
   */
  public static async counsel(params: {
    leadId: string;
    leadName: string;
    leadPhone: string;
    courseName?: string;
    userMessage: string;
    channel: "WHATSAPP" | "WEB_CHAT" | "VOICE_CALL";
    conversationLanguage?: SupportedLanguage;
  }): Promise<AiCounselorResponse> {
    const { leadId, leadName, courseName, userMessage, conversationLanguage } = params;
    const msg = userMessage.toLowerCase().trim();

    // 1. Language Detection & Contextual Continuity
    const language = LanguageIntelligenceService.detectLanguage(userMessage, conversationLanguage);

    // 2. Fetch Live Grounded Institutional Facts & Course Master
    const instituteFacts = await SoftLabKnowledgeService.getKnowledge();
    const dynamicKb = await this.queryKnowledgeBase(userMessage);

    // 3. Dynamic Course Identification from LMS Course Master (SINGLE SOURCE OF TRUTH)
    const matchedCourses = await LmsCourseMasterService.findMatchingCourses(courseName || userMessage);
    const activeCourse = matchedCourses.length > 0 ? matchedCourses[0] : null;

    // 4. Intent & Qualification Feature Extraction
    const isFeeQuery =
      msg.includes("fee") || msg.includes("cost") || msg.includes("price") ||
      msg.includes("charges") || msg.includes("emi") || msg.includes("kitna") || msg.includes("kitne");

    const isDiscountQuery =
      msg.includes("discount") || msg.includes("offer") || msg.includes("concession") ||
      msg.includes("scholarship") || msg.includes("kam ho") || msg.includes("kam kare");

    const isPlacementQuery =
      msg.includes("placement") || msg.includes("job") || msg.includes("salary") ||
      msg.includes("package") || msg.includes("hiring") || msg.includes("naukri") || msg.includes("company");

    const isSyllabusQuery =
      msg.includes("syllabus") || msg.includes("curriculum") || msg.includes("topics") ||
      msg.includes("modules") || msg.includes("brochure") || msg.includes("pdf") || msg.includes("content");

    const isLocationQuery =
      msg.includes("where") || msg.includes("location") || msg.includes("address") ||
      msg.includes("center") || msg.includes("campus") || msg.includes("kaha") || msg.includes("kahan") || msg.includes("prayagraj");

    const isAdmissionQuery =
      msg.includes("admission") || msg.includes("join") || msg.includes("enroll") ||
      msg.includes("register") || msg.includes("seat") || msg.includes("batch") || msg.includes("start date") || msg.includes("lena hai");

    const isCallRequestQuery =
      msg.includes("call me") || msg.includes("call karo") || msg.includes("call kar lo") ||
      msg.includes("talk to me") || msg.includes("baat karni") || msg.includes("phone par") ||
      msg.includes("call please") || msg.includes("schedule call");

    const isComplaintQuery =
      msg.includes("complaint") || msg.includes("fraud") || msg.includes("fake") ||
      msg.includes("cheated") || msg.includes("bad service") || msg.includes("worst") || msg.includes("refund");

    const isHumanRequest =
      msg.includes("human") || msg.includes("counselor se") || msg.includes("agent") ||
      msg.includes("person") || msg.includes("real person") || msg.includes("sir se baat");

    const isStopQuery =
      msg === "stop" || msg === "unsubscribe" || msg === "optout" || msg === "dnc";

    // 5. Qualification Extraction (Education & Mode)
    let extractedEducation: string | undefined;
    if (msg.includes("bca")) extractedEducation = "BCA";
    else if (msg.includes("b.tech") || msg.includes("btech")) extractedEducation = "B.Tech";
    else if (msg.includes("mca")) extractedEducation = "MCA";
    else if (msg.includes("diploma")) extractedEducation = "Diploma";
    else if (msg.includes("bsc") || msg.includes("b.sc")) extractedEducation = "B.Sc";
    else if (msg.includes("graduate") || msg.includes("graduation")) extractedEducation = "Graduate";

    let extractedMode: string | undefined;
    if (msg.includes("online")) extractedMode = "ONLINE";
    else if (msg.includes("offline") || msg.includes("classroom") || msg.includes("center") || msg.includes("campus")) {
      extractedMode = "CLASSROOM";
    }

    // 6. Handle STOP / Privacy Opt-out
    if (isStopQuery) {
      return {
        replyText: language === "ENGLISH"
          ? `You have been successfully unsubscribed from automated messages from SoftLab Global. Reply START anytime to resume.`
          : `Aapko SoftLab Global ke automated messages se unsubscribe kar diya gaya hai. Dobara connect karne ke liye kisi bhi samay START likhein.`,
        leadScore: 0,
        temperature: "COLD",
        intent: "OPTOUT",
        confidence: 1.0,
        detectedLanguage: language,
        escalationRequired: false,
      };
    }

    // 7. Handle Grievances / Complaints -> Immediate Critical Escalation
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
        replyText: language === "ENGLISH"
          ? `Dear ${leadName}, we treat your concern with utmost priority. A Senior Academic Director from SoftLab Global has been alerted and will personally contact you shortly to address this.`
          : `Aadarniya ${leadName} ji, aapki baat ko hum bohot gambhirta se lete hain. SoftLab Global ke Senior Academic Director ko alert bhej diya gaya hai, wo aapse jald hi seedhe contact karenge.`,
        leadScore: 40,
        temperature: "COLD",
        intent: "COMPLAINT",
        confidence: 0.98,
        detectedLanguage: language,
        escalationRequired: true,
        escalationReason: "Customer grievance or critical sentiment detected.",
        suggestedAction: "COUNSELOR_TAKEOVER",
      };
    }

    // 8. Handle Direct Request for Human Counselor
    if (isHumanRequest) {
      await db.escalationTask.create({
        data: {
          leadId,
          reason: "HUMAN_HANDOFF",
          severity: "HIGH",
          status: "OPEN",
          description: `Lead requested direct human counselor assistance: "${userMessage}"`,
        },
      });

      return {
        replyText: language === "ENGLISH"
          ? `Certainly, ${leadName}! I have connected you with our Senior Academic Counselor at our Civil Lines, Prayagraj campus. They will take over this chat or give you a quick callback shortly.`
          : `Zaroor ${leadName} ji! Maine aapki request hamare Senior Academic Counselor (Civil Lines, Prayagraj campus) ko forward kar di hai. Wo aapse turant is chat par ya call ke madhyam se baat karenge.`,
        leadScore: 80,
        temperature: "HOT",
        intent: "HUMAN_HANDOFF",
        confidence: 0.95,
        detectedLanguage: language,
        escalationRequired: true,
        escalationReason: "Customer explicitly requested human counselor.",
        suggestedAction: "COUNSELOR_TAKEOVER",
      };
    }

    // 9. Handle Discount / Scholarship Queries -> Institutional Escalation
    if (isDiscountQuery) {
      await db.escalationTask.create({
        data: {
          leadId,
          reason: "DISCOUNT_REQUEST",
          severity: "MEDIUM",
          status: "OPEN",
          description: `Lead requested scholarship or fee discount: "${userMessage}"`,
        },
      });

      const feeText = activeCourse
        ? `₹${activeCourse.fee.toLocaleString("en-IN")}`
        : `₹45,000`;

      return {
        replyText: language === "ENGLISH"
          ? `Dear ${leadName}, our standard fee for ${activeCourse?.courseName || "the flagship professional program"} is ${feeText} (inclusive of curriculum, live projects, lab access, and placement support). Merit scholarships and 0% interest EMI options are evaluated individually by our Admissions Board. I have forwarded your profile to our Senior Admissions Counselor to assess your scholarship eligibility.`
          : `Namaste ${leadName} ji! ${activeCourse?.courseName || "Is program"} ki standard official fee ${feeText} hai, jisme complete practical training, live projects aur placement support shamil hai. Merit scholarship aur 0% interest EMI ki eligibility hamara Admissions Board test/marks ke base par decide karta hai. Maine aapki profile Senior Counselor ko forward kar di hai jo aapse scholarship concession discuss karenge.`,
        leadScore: 85,
        temperature: "HOT",
        intent: "DISCOUNT_REQUEST",
        confidence: 0.92,
        detectedLanguage: language,
        matchedCourse: activeCourse || undefined,
        escalationRequired: true,
        escalationReason: "Lead requested scholarship/discount evaluation.",
        suggestedAction: "COUNSELOR_TAKEOVER",
      };
    }

    // 10. Handle AI Voice Call Request
    if (isCallRequestQuery) {
      return {
        replyText: language === "ENGLISH"
          ? `Sure, ${leadName}! Our AI Voice Admissions Counselor can call you right away on this number (${params.leadPhone}) or at your preferred time. Are you free to take the call now?`
          : `Ji bilkul ${leadName} ji! Hamara AI Voice Admissions Counselor aapke is number (${params.leadPhone}) par abhi call connect kar sakta hai. Kya aap abhi 2 minute baat karne ke liye available hain?`,
        leadScore: 90,
        temperature: "HOT",
        intent: "CALLBACK_REQUEST",
        confidence: 0.96,
        detectedLanguage: language,
        matchedCourse: activeCourse || undefined,
        escalationRequired: false,
        suggestedAction: "SCHEDULE_CALL",
      };
    }

    // 11. Handle Fee & EMI Inquiry (USING LIVE LMS COURSE MASTER DATA)
    if (isFeeQuery) {
      const course = activeCourse || (await LmsCourseMasterService.getAllActiveCourses())[0];
      const feeFormatted = `₹${course.fee.toLocaleString("en-IN")}`;
      const emiFormatted = `₹${course.emiPlans[0]?.monthlyAmountRupees.toLocaleString("en-IN")}/month (for ${course.emiPlans[0]?.tenureMonths} months @ 0% interest)`;

      return {
        replyText: language === "ENGLISH"
          ? `The fee for *${course.courseName}* is *${feeFormatted}*.\n\n✨ Highlights Included:\n• Comprehensive hands-on training (${course.duration})\n• Live Industry Capstone Projects\n• 100% Placement Support & Corporate Drives\n• Flexible EMI option starting at *${emiFormatted}*\n• Campus: Civil Lines, Prayagraj (Classroom & Online available)\n\nWould you like me to send the complete syllabus PDF or arrange a free demo class?`
          : `*${course.courseName}* ki official fee *${feeFormatted}* hai.\n\n✨ Program Highlights:\n• Complete practical training (${course.duration})\n• Live Industry Projects aur Code Reviews\n• 100% Placement Support (1,200+ Hiring Partners)\n• Easy 0% interest EMI: lagbhag *${emiFormatted}*\n• Training Mode: Classroom (Civil Lines, Prayagraj) ya Live Online\n\nKya main aapko iska detailed syllabus PDF brochure bhej doon?`,
        leadScore: 78,
        temperature: "WARM",
        intent: "FEE_INQUIRY",
        confidence: 0.95,
        detectedLanguage: language,
        matchedCourse: course,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
        qualificationExtracted: {
          education: extractedEducation,
          learningMode: extractedMode,
        },
      };
    }

    // 12. Handle Placement Inquiry
    if (isPlacementQuery) {
      return {
        replyText: language === "ENGLISH"
          ? `SoftLab Global provides *${instituteFacts.placementClaim}* with over *${instituteFacts.corporateRecruitingPartnersCount}* corporate recruiting partners across India. Learners undergo resume building, mock technical interviews, and direct placement drives.\n\nWould you like to speak to an admissions counselor about recent placement records?`
          : `SoftLab Global mein *${instituteFacts.placementClaim}* diya jata hai jisme *${instituteFacts.corporateRecruitingPartnersCount}* se jyada hiring partners jude hain. Hamari Prayagraj Center of Excellence team aapko resume building, mock interviews aur direct campus drives ke liye prepare karti hai.\n\nKya aap recent placement records dekhna chahenge?`,
        leadScore: 82,
        temperature: "HOT",
        intent: "PLACEMENT_INQUIRY",
        confidence: 0.96,
        detectedLanguage: language,
        matchedCourse: activeCourse || undefined,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
      };
    }

    // 13. Handle Syllabus & Brochure Inquiry
    if (isSyllabusQuery) {
      const course = activeCourse || (await LmsCourseMasterService.getAllActiveCourses())[0];
      const modulesSummary = course.curriculum.slice(0, 4).map((m) => `• ${m}`).join("\n");

      return {
        replyText: language === "ENGLISH"
          ? `Here is the curriculum outline for *${course.courseName}*:\n\n${modulesSummary || "• Core Fundamentals\n• Advanced Architecture\n• Live Capstone Project\n• Placement Bootcamp"}\n\n📄 Official Syllabus Brochure: ${course.brochureUrl}\n\nWould you like to book a free demo session at our Prayagraj campus or online?`
          : `Yeh raha *${course.courseName}* ka curriculum outline:\n\n${modulesSummary || "• Core Fundamentals\n• Advanced Architecture\n• Live Capstone Project\n• Placement Bootcamp"}\n\n📄 Official Syllabus Brochure: ${course.brochureUrl}\n\nKya aap Prayagraj campus par classroom demo session attend karna chahenge?`,
        leadScore: 75,
        temperature: "WARM",
        intent: "SYLLABUS_REQUEST",
        confidence: 0.95,
        detectedLanguage: language,
        matchedCourse: course,
        escalationRequired: false,
        suggestedAction: "SEND_BROCHURE",
      };
    }

    // 14. Handle Location / Campus Inquiry
    if (isLocationQuery) {
      return {
        replyText: language === "ENGLISH"
          ? `SoftLab Global is located at:\n📍 *${instituteFacts.campusLocation}*.\n\nWe provide both modern air-conditioned classroom labs at Prayagraj and live online interactive batches. Which learning mode suits you better?`
          : `SoftLab Global ka center Prayagraj mein sthit hai:\n📍 *${instituteFacts.campusLocation}*.\n\nYahan hamare pass high-tech computer labs hain. Aap classroom offline mode ya live online mode dono mein se kisi me bhi padh sakte hain. Aap kaun sa mode prefer karenge?`,
        leadScore: 70,
        temperature: "WARM",
        intent: "LOCATION_INQUIRY",
        confidence: 0.97,
        detectedLanguage: language,
        matchedCourse: activeCourse || undefined,
        escalationRequired: false,
      };
    }

    // 15. Handle Direct Admission / Seat Booking Inquiry
    if (isAdmissionQuery) {
      const course = activeCourse || (await LmsCourseMasterService.getAllActiveCourses())[0];
      return {
        replyText: language === "ENGLISH"
          ? `Admissions for the upcoming batch of *${course.courseName}* are currently open at SoftLab Global! 🚀\n\nYou can confirm your provisional seat through our verified admission portal below:\n🔗 ${course.admissionUrl}\n\nOr reply YES and I can arrange an instant counseling call to help you register.`
          : `*${course.courseName}* ke upcoming batch ke admissions abhi open hain! 🚀\n\nAap apna provisional seat registration hamare official admission portal par complete kar sakte hain:\n🔗 ${course.admissionUrl}\n\nYa agar aap chahein toh hum aapse call par baat karke admission process complete kara sakte hain.`,
        leadScore: 92,
        temperature: "HOT",
        intent: "ADMISSION_READY",
        confidence: 0.94,
        detectedLanguage: language,
        matchedCourse: course,
        escalationRequired: false,
        suggestedAction: "SEND_PAYMENT_LINK",
      };
    }

    // 16. Intelligent Admissions Counseling Flow (Qualification / Profile Matching)
    if (extractedEducation) {
      return {
        replyText: language === "ENGLISH"
          ? `Thank you for sharing your background (${extractedEducation})! ${activeCourse ? `*${activeCourse.courseName}* is an excellent choice for ${extractedEducation} graduates to build high-demand job skills.` : "We have industry-aligned programs in Full Stack, AI/ML, Cyber Security, and Cloud Administration."}\n\nAre you looking for classroom training at our Civil Lines, Prayagraj campus, or live online batches?`
          : `Aapka background (${extractedEducation}) bohot badiya hai! ${activeCourse ? `*${activeCourse.courseName}* ${extractedEducation} ke students ke liye top tech careers ke dwar kholta hai.` : "Hamare pass Full Stack, AI/ML, Cyber Security aur Cloud ke job-oriented programs hain."}\n\nAap Civil Lines, Prayagraj campus par classroom training chahte hain ya live online batch?`,
        leadScore: 75,
        temperature: "WARM",
        intent: "QUALIFICATION_SUBMITTED",
        confidence: 0.90,
        detectedLanguage: language,
        matchedCourse: activeCourse || undefined,
        escalationRequired: false,
        qualificationExtracted: {
          education: extractedEducation,
          learningMode: extractedMode,
        },
      };
    }

    // 17. General Grounded Fallback
    const featuredCourse = activeCourse || (await LmsCourseMasterService.getAllActiveCourses())[0];
    return {
      replyText: language === "ENGLISH"
        ? `Hello ${leadName}! Welcome to SoftLab Global (Civil Lines, Prayagraj). 🎓\n\nWe offer job-guaranteed training programs in Full Stack Development, AI & Machine Learning, Cyber Security, Cloud Administration, and University Degree programs with 100% placement support.\n\nWhich career domain or course are you interested in exploring today?`
        : `Namaste ${leadName} ji! SoftLab Global (Civil Lines, Prayagraj) mein aapka swagat hai. 🎓\n\nHum Full Stack Web Development, AI/Machine Learning, Cyber Security, Cloud Administration aur University Programs provide karte hain 100% placement support ke sath.\n\nAap kis course ya career ke bare me jankari lena chahte hain?`,
      leadScore: 60,
      temperature: "WARM",
      intent: "GENERAL_INQUIRY",
      confidence: 0.88,
      detectedLanguage: language,
      matchedCourse: featuredCourse,
      escalationRequired: false,
    };
  }
}
