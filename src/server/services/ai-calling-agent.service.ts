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
  simulatedScenario?:
    | "INTERESTED_STUDENT"
    | "WORKING_PRO_WEEKEND"
    | "CALL_BACK_TOMORROW"
    | "HUMAN_HANDOFF"
    | "NOT_INTERESTED"
    | "PRICE_QUERY"
    | "BEGINNER_NON_TECH"
    | "LOCATION_QUERY"
    | "PRACTICAL_TRAINING_QUERY"
    | "PLACEMENT_QUERY";
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
   * Generates opening AI introduction for a lead representing SoftLab Global, Civil Lines, Prayagraj
   */
  public static async generateOpeningScript(
    leadName?: string,
    courseTitle?: string,
    language = "Hindi",
    customTemplate?: string
  ): Promise<string> {
    const name = leadName && leadName !== "Prospective Learner" ? leadName : "Ji";
    const course = courseTitle || "course/program";

    if (customTemplate && customTemplate.trim()) {
      return customTemplate
        .replace(/\{name\}/gi, name)
        .replace(/\{course\}/gi, course)
        .replace(/\{institute\}/gi, "SoftLab Global")
        .replace(/\{location\}/gi, "Civil Lines, Prayagraj");
    }

    if (language.toLowerCase().includes("en")) {
      return `Hello ${name}! I am the AI Assistant calling from SoftLab Global, Civil Lines, Prayagraj. You recently showed interest in our ${course}. I'm calling to understand your learning requirements and share how our practical training and placement track can support your career goals. Do you have 2 minutes to speak?`;
    }

    // Default Hindi / Hinglish opening (Official SoftLab Global, Civil Lines Prayagraj Script)
    return `Namaste! Main SoftLab Global, Civil Lines Prayagraj ki AI assistant hoon. Aapne hamare ${course} ke regarding enquiry ki thi. Main aapki requirement samajhne aur aapko suitable program, practical training aur placement support ke baare mein information dene ke liye call kar rahi hoon. Kya main aapse 2 minute baat kar sakti hoon?`;
  }

  /**
   * Conducts an AI simulation scenario or processes real dialogue
   */
  public static async simulateRealisticCall(input: CallSimulationInput): Promise<ExtractedCallResult> {
    const leadName = input.leadName || "Prospective Learner";
    const course = input.courseTitle || "Artificial Intelligence & Machine Learning";
    const lang = input.language || "Hindi";
    const opening = await this.generateOpeningScript(leadName, course, lang, input.openingScript);

    const knowledge = await SoftLabKnowledgeService.getKnowledge();
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
    let learningMode = "Classroom (Civil Lines, Prayagraj) / Hybrid";
    let preferredBatch = "Weekend Batch";
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
        addTurn("agent", "Bahut badhiya! BCA students ke liye humara AI & Machine Learning program perfect hai jisme Python, Data Analysis, Deep Learning aur Generative AI ke real-time hands-on projects cover hote hain. Kya aap classroom offline chahte hain ya live online?", 14);
        addTurn("lead", "Prayagraj Civil Lines campus mere paas hai, to main offline classroom practical labs prefer karunga. Placement assistance rehta hai?", 25);
        addTurn("agent", `Ji bilkul! SoftLab Global mein 100% Placement Support provide kiya jata hai ${knowledge.recruitingPartnersCount} corporate recruiting partners ke sath, jisme dedicated placement cell, mock technical interviews aur GitHub portfolio projects cover hote hain. Humare Civil Lines campus mein practical labs aur weekend/weekday dono batches open hain. Kya aap weekend batch chahenge?`, 36);
        addTurn("lead", "Weekend batch mere college schedule ke sath fit rahega. Fees kitni hai aur EMI ka kya scene hai?", 47);
        addTurn("agent", "Course fees ₹45,000 hai jisme zero-cost EMI option available hai lagbhag ₹4,500/month se shuru. Sath hi merit scholarship bhi milti hai. Main aapka demo class slot schedule kar doon Saturday ke liye?", 58);
        addTurn("lead", "Haanji, Saturday ko 11 baje Civil Lines campus mein demo class attend karunga. Details WhatsApp par bhej dijiye.", 70);
        addTurn("agent", "Main confirmation aur syllabus details aapke registered WhatsApp number par bhej rahi hoon. Saturday 11 AM par aapka session scheduled hai. Dhanyawad!", 79);

        outcome = CallingOutcome.INTERESTED;
        interestLevel = "HOT";
        education = "BCA Final Year";
        experience = "Fresher";
        careerGoal = "AI & ML Engineer";
        budget = "₹45,000 with monthly EMI";
        learningMode = "Offline Classroom (Civil Lines, Prayagraj)";
        preferredBatch = "Weekend Batch (Saturday 11 AM)";
        durationSeconds = 85;
        summary = `Learner ${leadName} is in BCA final year, highly interested in AI/ML offline classroom practical labs at Civil Lines, Prayagraj campus. Inquired about placement assistance and EMI options. Scheduled for Saturday 11:00 AM demo class.`;
        recommendedAction = "Counselor to follow up before Saturday demo class and share syllabus brochure on WhatsApp.";
        break;

      case "BEGINNER_NON_TECH":
        addTurn("lead", "Main B.Com se hoon aur mujhe IT field mein aana hai, coding bilkul nahi aati.", 6);
        addTurn("agent", "Bilkul! Aapka commerce background hona problem nahi hai. Main aapka current level aur career goal samajhkar aapko suitable program suggest karungi. SoftLab Global mein practical, hands-on training ke saath live industry projects par kaam karaya jata hai basics se. Aap bataiye, aap development, AI/ML, cloud ya kisi specific IT role mein jana chahte hain?", 18);
        addTurn("lead", "Web development ya Python seekhna chahta hoon jo beginner friendly ho.", 28);
        addTurn("agent", "Humara Full Stack Web Development program absolute zero coding background se shuru hota hai. Isme frontend, backend aur database step-by-step practical labs mein seekhte hain. Civil Lines campus mein dedicated lab mentor support rehta hai.", 40);

        outcome = CallingOutcome.COURSE_ENQUIRY;
        interestLevel = "WARM";
        education = "B.Com Graduate";
        experience = "Non-tech Beginner";
        careerGoal = "IT Career Transition (Web Development)";
        learningMode = "Classroom Practical Labs (Civil Lines, Prayagraj)";
        durationSeconds = 60;
        summary = `Non-tech B.Com graduate looking to transition into IT. Recommended beginner-friendly Full Stack development with dedicated lab mentor support at Civil Lines, Prayagraj.`;
        recommendedAction = "Counselor to share beginner learning path and invite to campus demo session.";
        break;

      case "WORKING_PRO_WEEKEND":
        addTurn("lead", "Haan, main already job kar raha hoon IT support mein 2 saal se. Mujhe Cloud ya DevOps mein switch karna hai.", 6);
        addTurn("agent", "Perfect! Working professionals ke liye transition path practical banaya gaya hai. Aapke liye weekend batch ya live-online mode zyada convenient ho sakta hai. Main aapki current technology aur experience ke basis par relevant course aur batch option check kar sakti hoon. Aap kis technology mein currently kaam kar rahe hain?", 18);
        addTurn("lead", "Windows server aur basic networking handle karta hoon. Weekend online sessions possible hain?", 30);
        addTurn("agent", "Ji bilkul, Saturday-Sunday evening batches conduct hote hain with live cloud lab access aur production deployment projects. Senior industry mentors guide karte hain.", 42);
        addTurn("lead", "Fees aur EMI schedule discuss karne ke liye counselor se baat karwa sakte hain?", 52);
        addTurn("agent", "Main SoftLab Global ke senior career advisor ko aapka profile assign kar rahi hoon taaki wo customized installment plan aur batch timing confirm karein.", 62);

        outcome = CallingOutcome.CALLBACK_REQUESTED;
        interestLevel = "HOT";
        education = "Graduate";
        experience = "2 Years in IT Support";
        careerGoal = "Career Switch to Cloud DevOps";
        learningMode = "Weekend Live Online / Hybrid";
        preferredBatch = "Weekend Evening";
        humanHandoffRequired = true;
        handoffReason = "Working professional requested senior counselor discussion for career roadmap and custom EMI.";
        durationSeconds = 68;
        summary = `Working professional with 2 years IT support experience looking to switch to Cloud DevOps. Prefers weekend batch. Requested counselor callback for fee structure and roadmap.`;
        recommendedAction = "Senior counselor to call back with career switch roadmap and installment plan.";
        break;

      case "LOCATION_QUERY":
        addTurn("lead", "Aapka institute kahan par hai aur offline classes kahan chalti hain?", 5);
        addTurn("agent", `SoftLab Global ka main campus Civil Lines, Prayagraj, Uttar Pradesh mein sthit hai. Yahan par fully-equipped computer labs, interactive smart classrooms aur placement cell available hai. Sath hi agar aap campus nahi aa sakte to live interactive online training bhi available hai. Kya aap Prayagraj ya nearby location se hain?`, 16);
        addTurn("lead", "Haan, main Prayagraj se hi hoon. Kal aakar visit kar sakta hoon?", 25);
        addTurn("agent", "Ji bilkul! Aap kal subah 10 baje se shaam 6 baje ke beech Civil Lines campus visit kar sakte hain. Main campus address aur location map aapke WhatsApp par share kar rahi hoon.", 35);

        outcome = CallingOutcome.ADMISSION_INTEREST;
        interestLevel = "HOT";
        learningMode = "Classroom (Civil Lines, Prayagraj)";
        durationSeconds = 45;
        summary = `Lead inquired about campus location. Informed about Civil Lines, Prayagraj campus facilities. Lead confirmed offline campus visit tomorrow.`;
        recommendedAction = "Share Google Map location of Civil Lines Prayagraj campus on WhatsApp and notify front desk.";
        break;

      case "PRACTICAL_TRAINING_QUERY":
        addTurn("lead", "Aap log practical training kaise karate hain? Sirf theory to nahi hoti?", 5);
        addTurn("agent", `Bilkul nahi! SoftLab Global mein 100% practical & hands-on labs follow kiye jate hain. Yahan students production-oriented live industry projects par kaam karte hain, aur har student ka code Git/GitHub repositories par deploy hota hai. Senior industry mentors real-world code reviews provide karte hain.`, 18);
        addTurn("lead", "Yeh badhiya hai. Projects interview mein dikha sakte hain?", 26);
        addTurn("agent", "Haanji, wahi live portfolio aapke technical interviews mein shortlisting ka main reason banta hai. Main aapko project list share karwa deti hoon.", 36);

        outcome = CallingOutcome.COURSE_ENQUIRY;
        interestLevel = "HOT";
        durationSeconds = 48;
        summary = `Lead specifically asked about practical learning methodology. Explained live industry projects, GitHub repo portfolios, and 100% practical lab training.`;
        recommendedAction = "Send capstone project portfolio brochure and curriculum outline.";
        break;

      case "PLACEMENT_QUERY":
        addTurn("lead", "Mujhe mainly job chahiye. Placement guarantee ka kya terms hai?", 5);
        addTurn("agent", `Samajh gayi. Aapke liye sirf theoretical course ke bajay practical, job-oriented training important hogi. SoftLab Global 100% placement support aur placement track provide karta hai as described in its official program information. Humare ${knowledge.recruitingPartnersCount} corporate recruiting partners hain, dedicated placement cell mock interviews aur resume building arrange karta hai. Main aapki current qualification aur target job role samajhkar suitable program suggest kar sakti hoon.`, 18);
        addTurn("lead", "Main B.Tech passout hoon, 6 months se job search kar raha hoon.", 27);
        addTurn("agent", "B.Tech graduates ke liye humara placement acceleration track best hai jisme practical portfolio building ke baad direct interview drives conduct hote hain. Counselor aapse connect karke eligible drives share karenge.", 38);

        outcome = CallingOutcome.INTERESTED;
        interestLevel = "HOT";
        education = "B.Tech Graduate";
        careerGoal = "Job Placement in Tech";
        durationSeconds = 55;
        summary = `B.Tech graduate seeking placement. Explained 100% placement support track, ${knowledge.recruitingPartnersCount} recruiting partners, and dedicated placement cell interview scheduling.`;
        recommendedAction = "Counselor to prioritize for placement accelerator track counseling.";
        break;

      case "CALL_BACK_TOMORROW":
        addTurn("lead", "Abhi main driving kar raha hoon, kal dopahar 2 baje call karna please.", 4);
        addTurn("agent", "Zaroor! Main disturb nahi karungi. Kal dopahar 2:00 baje SoftLab Global Civil Lines office se aapko call aayegi. Safe drive kijiye!", 12);

        outcome = CallingOutcome.FOLLOW_UP_REQUIRED;
        interestLevel = "WARM";
        callbackTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        callbackTime.setHours(14, 0, 0, 0);
        callbackTimeText = "Tomorrow at 2:00 PM";
        durationSeconds = 18;
        summary = `Lead was driving and requested a callback tomorrow at 2:00 PM sharp.`;
        recommendedAction = "Schedule follow-up call tomorrow at 14:00.";
        break;

      case "HUMAN_HANDOFF":
        addTurn("lead", "Maine pehle bhi form bhara tha aur meri counselor se baat chal rahi thi. Mujhe counselor se baat karni hai.", 6);
        addTurn("agent", "Bilkul. Main aapki request note kar leti hoon aur SoftLab Global ke counselor ko follow-up ke liye assign kar deti hoon. Kripya line par bane rahein, wo aapka record check karke assist karenge.", 16);

        outcome = CallingOutcome.HUMAN_HANDOFF;
        interestLevel = "HOT";
        humanHandoffRequired = true;
        handoffReason = "Customer requested human counselor regarding ongoing admission and discount discussion.";
        durationSeconds = 25;
        summary = `Lead requested human counselor intervention for ongoing admission discussion.`;
        recommendedAction = "Immediate telecaller/counselor dispatch to take over communication.";
        break;

      case "PRICE_QUERY":
        addTurn("lead", "Sirf fees bataiye pehle. Agar budget mein hogi tabhi aage baat karunga.", 4);
        addTurn("agent", "Bilkul seedhi baat! Humare professional programs ₹25,000 se ₹45,000 ke beech hain, jisme zero-interest EMI lagbhag ₹3,500/month aati hai. Kya ye aapke budget ke anukul hai?", 16);
        addTurn("lead", "Haan, EMI option theek hai. Course duration kitna rehta hai?", 25);
        addTurn("agent", "Duration 16 se 24 weeks ka hota hai with live practical projects at Civil Lines campus or live online. Main aapko detailed fee breakdown aur brochure WhatsApp kar doon?", 35);
        addTurn("lead", "Haan, WhatsApp par bhej dijiye, review karke batata hoon.", 45);

        outcome = CallingOutcome.PRICE_QUERY;
        interestLevel = "WARM";
        budget = "Comfortable with ₹3,500/mo EMI";
        learningMode = "Online / Classroom";
        durationSeconds = 50;
        summary = `Inquired specifically regarding fee structure and EMI affordability. Comfortable with monthly installment plan. Requested WhatsApp brochure.`;
        recommendedAction = "Send fee breakdown PDF and schedule a follow-up in 2 days.";
        break;

      case "NOT_INTERESTED":
      default:
        addTurn("lead", "Nahi mujhe koi course nahi karna hai, number galti se submit ho gaya tha. Call mat kijiye.", 4);
        addTurn("agent", "Koi baat nahi, main aapka number SoftLab Global ki calling list se remove kar deti hoon. Aapka din shubh rahe!", 11);

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
