import { CallingOutcome } from "@prisma/client";
import { SoftLabKnowledgeService } from "./softlab-knowledge.service";

export interface ConversationTurn {
  role: "agent" | "lead";
  text: string;
  timestamp: string;
}

export interface CallSimulationInput {
  leadName?: string;
  phone: string;
  courseTitle?: string;
  language?: string;
  remarks?: string;
  openingScript?: string;
  systemPrompt?: string;
  simulatedScenario?: "INTERESTED_STUDENT" | "WORKING_PRO_WEEKEND" | "CALL_BACK_TOMORROW" | "HUMAN_HANDOFF" | "NOT_INTERESTED" | "PRICE_QUERY";
}

export interface ExtractedCallResult {
  callOutcome: CallingOutcome;
  interestLevel: "HOT" | "WARM" | "COLD" | "NONE";
  education?: string;
  experience?: string;
  careerGoal?: string;
  budget?: string;
  learningMode?: string;
  preferredBatch?: string;
  callbackTime?: Date;
  callbackTimeText?: string;
  humanHandoffRequired: boolean;
  handoffReason?: string;
  conversationSummary: string;
  recommendedAction: string;
  transcript: ConversationTurn[];
  durationSeconds: number;
}

export class AiCallingAgentService {
  /**
   * Generates opening AI introduction for a lead
   */
  public static async generateOpeningScript(
    leadName?: string,
    courseTitle?: string,
    language = "Hindi",
    customTemplate?: string
  ): Promise<string> {
    const name = leadName && leadName !== "Prospective Learner" ? leadName : "Ji";
    const course = courseTitle || "humare professional technology training programs";

    if (customTemplate && customTemplate.trim()) {
      return customTemplate
        .replace(/\{name\}/gi, name)
        .replace(/\{course\}/gi, course)
        .replace(/\{institute\}/gi, "SoftLab Global");
    }

    if (language.toLowerCase().includes("en")) {
      return `Hello ${name}, I am the AI Assistant calling from SoftLab Global, Center for Excellence, Noida. You recently showed interest in our ${course}. I'm calling to understand your learning requirements and share how our program can help your career goals. Do you have a couple of minutes?`;
    }

    // Default Hindi / Hinglish opening
    return `Namaste ${name}, main SoftLab Global, Noida ki official AI assistant baat kar rahi hoon. Aapne humare ${course} ke regarding interest dikhaya tha. Main aapki requirement samajhne aur program ki details share karne ke liye call kar rahi hoon. Kya abhi 2 minute baat karne ka sahi waqt hai?`;
  }

  /**
   * Conducts an AI simulation scenario or processes real dialogue
   */
  public static async simulateRealisticCall(input: CallSimulationInput): Promise<ExtractedCallResult> {
    const leadName = input.leadName || "Prospective Learner";
    const course = input.courseTitle || "AI & Machine Learning";
    const lang = input.language || "Hindi";
    const opening = await this.generateOpeningScript(leadName, course, lang, input.openingScript);

    const scenario = input.simulatedScenario || "INTERESTED_STUDENT";
    const turns: ConversationTurn[] = [];
    const baseTime = Date.now();

    const addTurn = (role: "agent" | "lead", text: string, offsetSec: number) => {
      turns.push({
        role,
        text,
        timestamp: new Date(baseTime + offsetSec * 1000).toLocaleTimeString("en-IN"),
      });
    };

    addTurn("agent", opening, 0);

    let outcome: CallingOutcome = CallingOutcome.INTERESTED;
    let interestLevel: "HOT" | "WARM" | "COLD" | "NONE" = "WARM";
    let education: string | undefined;
    let experience: string | undefined;
    let careerGoal: string | undefined;
    let budget: string | undefined;
    let learningMode = "Hybrid / Classroom";
    let preferredBatch = "Weekend Cohort";
    let callbackTime: Date | undefined;
    let callbackTimeText: string | undefined;
    let humanHandoffRequired = false;
    let handoffReason: string | undefined;
    let summary = "";
    let recommendedAction = "";
    let durationSeconds = 120;

    switch (scenario) {
      case "INTERESTED_STUDENT":
        addTurn("lead", "Haanji, bilkul baat kar sakte hain. Main BCA final year mein hoon aur AI/ML mein career banana chahta hoon.", 5);
        addTurn("agent", "Bahut badhiya! BCA students ke liye humara AI & Machine Learning Masterclass perfect hai jisme Python, Data Analysis, Deep Learning aur Generative AI ke real-time hands-on projects cover hote hain. Kya aap classroom offline chahte hain ya live online?", 14);
        addTurn("lead", "Noida campus paas hai mere, to main offline classroom prefer karunga. Placement assistance rehta hai?", 25);
        addTurn("agent", "Ji bilkul, SoftLab Global mein 100% Placement Assistance milta hai 300+ hiring partners ke sath, jisme mock interviews aur portfolio building included hai. Humare weekend aur weekday dono batches open hain. Kya aap weekend batch chahenge?", 36);
        addTurn("lead", "Weekend batch mere college schedule ke sath fit rahega. Fees kitni hai aur EMI ka kya scene hai?", 47);
        addTurn("agent", "Course fees ₹45,000 hai jisme zero-cost EMI option available hai lagbhag ₹4,500/month se shuru. Sath hi merit scholarship bhi milti hai. Main aapka demo class slot schedule kar doon Saturday ke liye?", 58);
        addTurn("lead", "Haanji, Saturday ko 11 baje demo class attend karunga. Details WhatsApp par bhej dijiye.", 70);
        addTurn("agent", "Main confirmation aur syllabus details aapke registered WhatsApp number par bhej rahi hoon. Saturday 11 AM par aapka session scheduled hai. Dhanyawad!", 79);

        outcome = CallingOutcome.INTERESTED;
        interestLevel = "HOT";
        education = "BCA Final Year";
        experience = "Fresher";
        careerGoal = "AI & ML Engineer";
        budget = "₹45,000 with monthly EMI";
        learningMode = "Offline Classroom (Noida)";
        preferredBatch = "Weekend Batch (Saturday 11 AM)";
        durationSeconds = 85;
        summary = `Learner ${leadName} is in BCA final year, highly interested in AI/ML offline classroom batch at Noida campus. Inquired about placement assistance and EMI options. Scheduled for Saturday 11:00 AM demo class.`;
        recommendedAction = "Counselor to follow up before Saturday demo class and share syllabus brochure on WhatsApp.";
        break;

      case "WORKING_PRO_WEEKEND":
        addTurn("lead", "Haan, main currently IT support mein kaam kar raha hoon 2 saal se. Mujhe Full Stack ya Cloud mein switch karna hai.", 6);
        addTurn("agent", "Samajh gayi. Working professionals ke liye transition path bahut practical banaya gaya hai. Kya aap weekend live sessions aur evening lab support attend kar payenge?", 18);
        addTurn("lead", "Haan, weekends Saturday-Sunday hi time mil pata hai. Kya mujhe previous programming knowledge hona zaroori hai?", 28);
        addTurn("agent", "Nahi, batch basics se shuru hoke advanced microservices aur real deployment tak cover karta hai. Mentors working professionals hain jo flexible pacing provide karte hain.", 40);
        addTurn("lead", "Bahut accha. Fees aur EMI details discuss karne ke liye counselor se baat ho sakti hai?", 52);
        addTurn("agent", "Ji zaroor, main humare senior career advisor ko aapka profile handover kar rahi hoon taaki wo customized learning roadmap share karein.", 62);

        outcome = CallingOutcome.CALLBACK_REQUESTED;
        interestLevel = "HOT";
        education = "Graduate";
        experience = "2 Years in IT Support";
        careerGoal = "Career Switch to Cloud/Full Stack";
        learningMode = "Weekend Live Online";
        preferredBatch = "Weekend Evening";
        humanHandoffRequired = true;
        handoffReason = "Requested senior counselor discussion for career roadmap and custom EMI.";
        durationSeconds = 68;
        summary = `Working professional with 2 years IT support experience looking to switch career. Prefers weekend sessions. Requested counselor callback for fee structure and roadmap.`;
        recommendedAction = "Senior counselor to call back with career switch roadmap and installment plan.";
        break;

      case "CALL_BACK_TOMORROW":
        addTurn("lead", "Abhi main driving kar raha hoon, kal dopahar 2 baje call karna please.", 4);
        addTurn("agent", "Zaroor! Main disturb nahi karungi. Kal dopahar 2:00 baje aapko humari team se call aayegi. Safe drive kijiye!", 12);

        outcome = CallingOutcome.FOLLOW_UP_REQUIRED;
        interestLevel = "WARM";
        callbackTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
        callbackTime.setHours(14, 0, 0, 0);
        callbackTimeText = "Tomorrow at 2:00 PM";
        durationSeconds = 18;
        summary = `Lead was driving and requested a callback tomorrow at 2:00 PM sharp.`;
        recommendedAction = "Schedule follow-up call tomorrow at 14:00.";
        break;

      case "HUMAN_HANDOFF":
        addTurn("lead", "Maine pehle bhi form bhara tha aur meri fees ke discount ke regarding baat chal rahi thi. Mujhe kisi human counselor se connect karo abhi.", 6);
        addTurn("agent", "Samajh gayi. Main turant aapki call humare senior admission counselor ko handoff kar rahi hoon. Kripya line par bane rahein, wo aapke existing application ka record check karke assist karenge.", 16);

        outcome = CallingOutcome.HUMAN_HANDOFF;
        interestLevel = "HOT";
        humanHandoffRequired = true;
        handoffReason = "Customer requested human counselor regarding ongoing fee discount discussion.";
        durationSeconds = 25;
        summary = `Lead requested human intervention for an existing discount negotiation inquiry.`;
        recommendedAction = "Immediate telecaller/counselor dispatch to take over communication.";
        break;

      case "PRICE_QUERY":
        addTurn("lead", "Sirf fees bataiye pehle. Agar budget mein hogi tabhi aage baat karunga.", 4);
        addTurn("agent", "Bilkul seedhi baat! Humare professional programs ₹25,000 se ₹45,000 ke beech hain, jisme zero-interest EMI lagbhag ₹3,500/month aati hai. Kya ye aapke budget ke anukul hai?", 16);
        addTurn("lead", "Haan, EMI option theek hai. Course duration kitna rehta hai?", 25);
        addTurn("agent", "Duration 16 se 20 weeks ka hota hai with live project portfolio. Main aapko detailed fee breakdown aur brochure WhatsApp kar doon?", 35);
        addTurn("lead", "Haan, WhatsApp par bhej dijiye, review karke batata hoon.", 45);

        outcome = CallingOutcome.PRICE_QUERY;
        interestLevel = "WARM";
        budget = "Comfortable with ₹3,500/mo EMI";
        learningMode = "Online / Hybrid";
        durationSeconds = 50;
        summary = `Inquired specifically regarding fee structure and EMI affordability. Comfortable with monthly installment plan. Requested WhatsApp brochure.`;
        recommendedAction = "Send fee breakdown PDF and schedule a follow-up in 2 days.";
        break;

      case "NOT_INTERESTED":
      default:
        addTurn("lead", "Nahi mujhe koi course nahi karna hai, number galti se submit ho gaya tha. Call mat kijiye.", 4);
        addTurn("agent", "Koi baat nahi, main aapka number humari calling list se remove kar deti hoon. Aapka din shubh rahe!", 11);

        outcome = CallingOutcome.NOT_INTERESTED;
        interestLevel = "NONE";
        durationSeconds = 15;
        summary = `Lead stated they are not interested and submitted form mistakenly. Explicitly requested not to call.`;
        recommendedAction = "Do not call again. Flag lead as not interested.";
        break;
    }

    return {
      callOutcome: outcome,
      interestLevel,
      education,
      experience,
      careerGoal,
      budget,
      learningMode,
      preferredBatch,
      callbackTime,
      callbackTimeText,
      humanHandoffRequired,
      handoffReason,
      conversationSummary: summary,
      recommendedAction,
      transcript: turns,
      durationSeconds,
    };
  }

  /**
   * Analyzes an arbitrary raw text transcript or conversational turns to extract structured intent
   */
  public static extractStructuredInsights(transcript: ConversationTurn[]): Partial<ExtractedCallResult> {
    const textCombined = transcript.map((t) => t.text.toLowerCase()).join(" ");

    let outcome: CallingOutcome = CallingOutcome.COURSE_ENQUIRY;
    let interestLevel: "HOT" | "WARM" | "COLD" | "NONE" = "WARM";
    let humanHandoffRequired = false;

    if (textCombined.includes("not interested") || textCombined.includes("nahi karna") || textCombined.includes("galti se")) {
      outcome = CallingOutcome.NOT_INTERESTED;
      interestLevel = "NONE";
    } else if (textCombined.includes("human") || textCombined.includes("counselor") || textCombined.includes("manager") || textCombined.includes("complaint")) {
      outcome = CallingOutcome.HUMAN_HANDOFF;
      humanHandoffRequired = true;
      interestLevel = "HOT";
    } else if (textCombined.includes("kal call") || textCombined.includes("call back") || textCombined.includes("baad mein call") || textCombined.includes("driving")) {
      outcome = CallingOutcome.FOLLOW_UP_REQUIRED;
      interestLevel = "WARM";
    } else if (textCombined.includes("admission") || textCombined.includes("join karna") || textCombined.includes("register")) {
      outcome = CallingOutcome.ADMISSION_INTEREST;
      interestLevel = "HOT";
    } else if (textCombined.includes("demo") || textCombined.includes("saturday") || textCombined.includes("sunday")) {
      outcome = CallingOutcome.DEMO_REQUESTED;
      interestLevel = "HOT";
    } else if (textCombined.includes("fees") || textCombined.includes("emi") || textCombined.includes("price") || textCombined.includes("discount")) {
      outcome = CallingOutcome.PRICE_QUERY;
      interestLevel = "WARM";
    }

    return {
      callOutcome: outcome,
      interestLevel,
      humanHandoffRequired,
    };
  }
}
