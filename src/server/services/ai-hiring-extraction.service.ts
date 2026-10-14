import crypto from "crypto";

export interface ExtractedJobData {
  jobTitle: string;
  companyName: string;
  recruiterName?: string;
  recruiterDesignation?: string;
  recruiterEmail?: string;
  recruiterPhone?: string;
  jobDescription: string;
  requiredSkills: string[];
  qualification?: string;
  eligibleBranches: string[];
  experienceRequired?: string;
  isFresher: boolean;
  openingsCount: number;
  salaryPackage?: string;
  minSalary?: number; // in integer Paise
  maxSalary?: number; // in integer Paise
  salaryType?: string;
  currency: string;
  location?: string;
  workMode: "ON_SITE" | "HYBRID" | "REMOTE";
  employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT";
  shift?: string;
  deadline?: Date;
  interviewDate?: Date;
  applicationMethod?: "EMAIL" | "LINK" | "WHATSAPP" | "WALK_IN";
  applicationEmail?: string;
  applicationLink?: string;
  companyWebsite?: string;
  requiredDocuments: string[];
  feesMentioned: boolean;
  feeDetails?: string;
  isSuspicious: boolean;
  suspicionReason?: string;
  confidenceScore: number;
  missingFields: string[];
}

export class AiHiringExtractionService {
  /**
   * Evaluates if text is a genuine hiring/recruitment post or unrelated chatter/spam.
   */
  public static isRecruitmentContent(rawText: string): { isJob: boolean; reason: string; score: number } {
    const text = rawText.toLowerCase();

    // Red flag / chit-chat filters (Good morning, jokes, festival wishes, random banter)
    const casualGreetings = [
      "good morning", "good evening", "good night", "shubh prabhat",
      "happy diwali", "happy holi", "happy new year", "eid mubarak",
      "kya haal hai", "kaise ho", "kya chal raha", "bhai log",
      "gm all", "gn all", "congratulations bro", "party kab hai"
    ];

    for (const g of casualGreetings) {
      if (text.includes(g) && text.length < 80) {
        return { isJob: false, reason: "Casual greeting or festival message", score: 0.05 };
      }
    }

    // Positive recruitment keywords (English + Hinglish + Indian recruitment jargon)
    const positiveKeywords = [
      "hiring", "urgent requirement", "opening", "openings", "vacancy", "vacancies",
      "walk-in", "walk in", "interview", "recruitment", "job opportunity",
      "position", "designation", "role", "developer", "engineer", "executive",
      "fresher", "freshers", "experience", "exp", "ctc", "lpa", "salary",
      "stipend", "qualification", "btech", "b.tech", "bca", "mca", "bba", "mba",
      "resume", "cv", "send your resume", "share cv", "apply here",
      "location", "work from home", "wfh", "wfo", "onsite", "hybrid",
      "noida", "gurgaon", "delhi", "bangalore", "prayagraj", "allahabad", "pune", "mumbai", "hyderabad",
      "chahiye", "zaroorat hai", "apply karein", "bhejo cv", "join karna hai", "koi fees nahi",
      "immediate joiner", "notice period", "skills required"
    ];

    let matchCount = 0;
    for (const kw of positiveKeywords) {
      if (text.includes(kw)) {
        matchCount++;
      }
    }

    if (matchCount >= 2 || (matchCount >= 1 && (text.includes("ctc") || text.includes("lpa") || text.includes("cv") || text.includes("apply")))) {
      const score = Math.min(1.0, 0.4 + matchCount * 0.1);
      return { isJob: true, reason: `Matched ${matchCount} recruitment indicators`, score };
    }

    return { isJob: false, reason: "Insufficient recruitment signals or generic text", score: 0.15 };
  }

  /**
   * Main entry point to extract structured job details from untrusted text.
   * Defends against prompt injection & supports informal Indian/Hinglish posts.
   */
  public static async extractJobDetails(rawText: string): Promise<ExtractedJobData> {
    // 1. Sanitize & guard against prompt injection
    const sanitized = this.sanitizeInput(rawText);

    // 2. Perform deep pattern-matching & semantic heuristic extraction
    const extracted = this.extractWithSemanticEngine(sanitized, rawText);

    // 3. Detect suspicious fee-charging / fraudulent hiring posts
    this.flagSuspiciousIndicators(extracted, rawText);

    // 4. Calculate missing fields and final confidence
    this.computeConfidenceAndCompleteness(extracted);

    return extracted;
  }

  /**
   * Strips malicious instruction attempts (prompt injection defense)
   */
  private static sanitizeInput(text: string): string {
    return text
      .replace(/ignore (all )?previous instructions/gi, "[REDACTED_INSTRUCTION]")
      .replace(/system prompt/gi, "[REDACTED]")
      .replace(/you are now/gi, "[REDACTED]")
      .trim();
  }

  /**
   * Comprehensive Indian Recruitment Pattern & Heuristic Semantic Parser
   */
  private static extractWithSemanticEngine(text: string, originalRaw: string): ExtractedJobData {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // --- A. Company Name ---
    let companyName = "Company Not Specified";

    // 1. Explicit labels: "Company: X", "Organization: X", "Firm: X", "Client: X"
    const explicitCompanyMatch = text.match(/\b(?:company|organization|firm|client)\s*[:\-–]\s*([A-Za-z0-9&.\- ]{2,50})/i);
    if (explicitCompanyMatch && explicitCompanyMatch[1].trim().length > 2) {
      companyName = explicitCompanyMatch[1].trim();
    }

    // 2. Action phrases: "Urgent Opening at X", "Urgnt req in X", "Job at X", "Hiring for X"
    if (companyName === "Company Not Specified") {
      const atInMatch = text.match(/\b(?:urgent\s+opening|opening|urgnt\s+req|urgent\s+requirement|requirement|job|hiring|walk-?in)\s+(?:at|in|for)\s+([A-Za-z0-9&.\- ]{2,50}?(?:pvt\.?\s*ltd\.?|limited|technologies|solutions|infotech|services|corp|inc|llp)?)(?=[\n!,\.]|\s*(?:is hiring|urgently|looking|requires|for|\-))/i);
      if (atInMatch && atInMatch[1] && atInMatch[1].trim().length > 2) {
        const candidate = atInMatch[1].trim().replace(/[!.,]+$/, "");
        if (!["we", "urgently", "immediate", "looking", "hiring", "fresher", "freshers"].includes(candidate.toLowerCase())) {
          companyName = candidate;
        }
      }
    }

    // 3. Subject lines: "CloudNova Technologies is hiring..."
    if (companyName === "Company Not Specified") {
      const isHiringMatch = text.match(/(?:^|\n)\s*([A-Za-z0-9&.\- ]{2,45})\s+(?:is hiring|is looking for|invites applications)/i);
      if (isHiringMatch && isHiringMatch[1] && isHiringMatch[1].trim().length > 2) {
        companyName = isHiringMatch[1].trim();
      }
    }

    // 4. Fallback: Search for lines containing corporate suffixes (Pvt Ltd, Technologies, Solutions, etc.)
    if (companyName === "Company Not Specified") {
      const pvtLine = lines.find((l) => /\b(?:pvt\.?\s*ltd\.?|technologies|solutions|infotech|services|corp|inc|llp)\b/i.test(l) && !/role|designation|position|qualification|salary|experience/i.test(l));
      if (pvtLine && pvtLine.length < 60) {
        const cleaned = pvtLine
          .replace(/^[^a-zA-Z0-9]+/, "")
          .replace(/^(?:urgent\s+opening\s+(?:at|in)?|opening\s+(?:at|in)?|hiring\s+(?:at|in)?|urgnt\s+req\s+(?:at|in)?|urgent\s+req\s+(?:at|in)?|req\s+in)\s+/i, "")
          .replace(/[!.,]+$/, "")
          .trim();
        if (cleaned.length > 2) {
          companyName = cleaned;
        }
      }
    }

    // --- B. Job Title / Designation ---
    let jobTitle = "Software Developer / IT Associate";
    const titlePatterns = [
      /(?:role|designation|job title|position|post|profile|hiring for)\s*[:\-–]?\s*([A-Za-z0-9/.\-+ ]{2,50})/i,
      /(?:looking for|requires|need|urgent hiring for)\s*([A-Za-z0-9/.\-+ ]{2,40}?)(?=(?:\s+with|\s+having|\s+at|\s+in|\s+for|\s+exp|\s+salary|\.|\n|$))/i,
      /\b(full stack developer|frontend developer|backend developer|react developer|node\.?js developer|python developer|java developer|flutter developer|ui\/ux designer|data analyst|business analyst|qa engineer|devops engineer|telecaller|counselor|digital marketing executive|graphic designer|bda|business development associate|sales executive|hr recruiter|hr executive)\b/i,
    ];

    for (const p of titlePatterns) {
      const m = text.match(p);
      if (m && m[1] && m[1].trim().length > 2) {
        const candidate = m[1].trim();
        if (!["freshers", "immediate", "urgent", "good salary"].includes(candidate.toLowerCase())) {
          jobTitle = candidate;
          break;
        }
      }
    }

    // Clean up title
    jobTitle = jobTitle.replace(/^[•\-\*:]+\s*/, "").trim();

    // --- C. Recruiter Contact Details ---
    let recruiterEmail: string | undefined;
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      recruiterEmail = emailMatch[1].toLowerCase();
    }

    let recruiterPhone: string | undefined;
    const phoneMatch = text.match(/(?:\+91[\-\s]?)?[6-9]\d{9}\b/);
    if (phoneMatch) {
      recruiterPhone = phoneMatch[0].replace(/\D/g, "").slice(-10);
    }

    let recruiterName: string | undefined;
    const namePatterns = [
      /(?:contact|reach out to|hr|recruiter|spoc|share cv to)\s*[:\-–]?\s*([A-Za-z. ]{2,30})(?=\s*[\(\-,\n]|\s*(?:at|on|call|whatsapp))/i,
      /(?:regards|thanks & regards|warm regards|hr team)\s*[\n,–\-:]\s*([A-Za-z. ]{2,30})/i,
    ];
    for (const p of namePatterns) {
      const m = text.match(p);
      if (m && m[1]) {
        const cand = m[1].trim();
        if (cand.length > 2 && !/^(call|whatsapp|email|cv|resume|immediate|team)$/i.test(cand)) {
          recruiterName = cand;
          break;
        }
      }
    }

    // --- D. Skills Required ---
    const commonTechSkills = [
      "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Express",
      "Python", "Django", "FastAPI", "Java", "Spring Boot", "C++", "C#", ".NET",
      "PHP", "Laravel", "HTML", "CSS", "Tailwind CSS", "Bootstrap",
      "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis",
      "AWS", "Azure", "Docker", "Kubernetes", "Git", "GitHub",
      "Flutter", "React Native", "Android", "iOS", "Kotlin", "Swift",
      "UI/UX", "Figma", "Canva", "SEO", "Google Ads", "Meta Ads",
      "Excel", "Advanced Excel", "Power BI", "Tableau",
      "Communication Skills", "Cold Calling", "Lead Generation", "Telecalling", "Sales"
    ];

    const detectedSkills: string[] = [];
    for (const skill of commonTechSkills) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(text)) {
        detectedSkills.push(skill);
      }
    }

    // --- E. Experience & Fresher Classification ---
    let experienceRequired = "0-1 Year";
    let isFresher = false;

    if (/\b(fresher|freshers|fresh graduate|batch of 202[3-6]|entry level|no experience required)\b/i.test(text) ||
        /\b(0\s*(?:to|-)\s*[1-2]\s*(?:yrs|years|yr))\b/i.test(text)) {
      isFresher = true;
      experienceRequired = "Fresher (0-1 Year)";
    } else {
      const expMatch = text.match(/(\d+\s*(?:to|-)\s*\d+\s*(?:yrs|years|yr)|\d+\+?\s*(?:yrs|years|yr)\s*exp)/i);
      if (expMatch) {
        experienceRequired = expMatch[1].trim();
      }
    }

    // --- F. Salary / CTC & Monetary Details ---
    let salaryPackage: string | undefined;
    let minSalaryPaise: number | undefined;
    let maxSalaryPaise: number | undefined;
    let salaryType = "ANNUAL_CTC";

    // 1. LPA patterns: "₹5.5 LPA - ₹7.2 LPA" or "3.5 - 5.5 LPA" or "4 LPA"
    const lpaMatch = text.match(/(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|per annum)?\s*(?:to|-)\s*(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lpa|lakhs?|lac|lacs?|per annum)\b/i) ||
      text.match(/(?:inr|rs\.?|₹)?\s*(\d+(?:\.\d+)?)\s*(?:to|-)?\s*(\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?|lac|lacs?|per annum)\b/i);

    if (lpaMatch && (lpaMatch[0].toLowerCase().includes("lpa") || lpaMatch[0].toLowerCase().includes("lakh") || lpaMatch[0].toLowerCase().includes("lac") || lpaMatch[0].toLowerCase().includes("annum"))) {
      const minVal = parseFloat(lpaMatch[1]);
      const maxVal = lpaMatch[2] ? parseFloat(lpaMatch[2]) : minVal;
      minSalaryPaise = Math.round(minVal * 100000 * 100);
      maxSalaryPaise = Math.round(maxVal * 100000 * 100);
      salaryPackage = lpaMatch[2] && lpaMatch[2] !== lpaMatch[1]
        ? `₹${minVal} - ₹${maxVal} LPA`
        : `₹${minVal} LPA`;
      salaryType = "ANNUAL_CTC";
    } else {
      // 2. Monthly patterns: "In hand salary: 25000 per month", "Salary: 15k - 25k pm", "20000 to 30000 per month"
      const monthlyMatch = text.match(/(?:in\s*hand\s+salary|in\s*hand|salary|stipend|pkg|package|ctc)\s*[:\-–]?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:,\d{3})*|\d+k)\s*(?:to|-)?\s*(?:inr|rs\.?|₹)?\s*(\d+(?:,\d{3})*|\d+k)?\s*(?:\/|\s*per\s*)?(?:month|pm|mo|in hand)?\b/i) ||
        text.match(/(?:inr|rs\.?|₹)?\s*(\d+(?:,\d{3})*|\d+k)\s*(?:to|-)\s*(?:inr|rs\.?|₹)?\s*(\d+(?:,\d{3})*|\d+k)?\s*(?:\/|\s*per\s*)?(?:month|pm|mo)\b/i) ||
        text.match(/(?:inr|rs\.?|₹)?\s*(\d+(?:,\d{3})*|\d+k)\s*(?:\/|\s*per\s*)(?:month|pm|mo)\b/i);

      if (monthlyMatch) {
        const parseK = (str: string) => {
          if (!str) return 0;
          if (str.toLowerCase().endsWith("k")) return parseFloat(str) * 1000;
          return parseFloat(str.replace(/,/g, ""));
        };
        const minVal = parseK(monthlyMatch[1]);
        const maxVal = monthlyMatch[2] ? parseK(monthlyMatch[2]) : minVal;
        if (minVal >= 3000 && minVal <= 500000) {
          minSalaryPaise = Math.round(minVal * 12 * 100); // normalized annual paise
          maxSalaryPaise = Math.round(maxVal * 12 * 100);
          salaryPackage = monthlyMatch[2] && monthlyMatch[2] !== monthlyMatch[1]
            ? `₹${minVal.toLocaleString("en-IN")} - ₹${maxVal.toLocaleString("en-IN")}/month`
            : `₹${minVal.toLocaleString("en-IN")}/month`;
          salaryType = "MONTHLY";
        }
      }
    }

    if (!salaryPackage) {
      if (/best in industry|as per company norms|negotiable|competitive|not a constraint/i.test(text)) {
        salaryPackage = "Best in Industry / Commensurate with skills";
      }
    }

    // --- G. Location & Work Mode ---
    let location = "Prayagraj / Delhi NCR";
    const cityList = [
      "Prayagraj", "Allahabad", "Noida", "Greater Noida", "Gurgaon", "Gurugram",
      "Delhi", "Delhi NCR", "Bangalore", "Bengaluru", "Hyderabad", "Pune",
      "Mumbai", "Lucknow", "Kanpur", "Varanasi", "Indore", "Jaipur", "Chandigarh", "Chennai", "Kolkata"
    ];

    for (const city of cityList) {
      const r = new RegExp(`\\b${city}\\b`, "i");
      if (r.test(text)) {
        location = city;
        break;
      }
    }

    let workMode: "ON_SITE" | "HYBRID" | "REMOTE" = "ON_SITE";
    if (/\b(wfh|work from home|remote|fully remote)\b/i.test(text)) {
      workMode = "REMOTE";
    } else if (/\b(hybrid|partially remote|flexible)\b/i.test(text)) {
      workMode = "HYBRID";
    }

    let employmentType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" = "FULL_TIME";
    if (/\b(intern|internship|trainee|stipend)\b/i.test(text)) {
      employmentType = "INTERNSHIP";
    } else if (/\b(contract|contractual|freelance|part time|part-time)\b/i.test(text)) {
      employmentType = "CONTRACT";
    }

    // --- H. Qualifications & Degrees ---
    let qualification = "Graduation in any stream / B.Tech / BCA / MCA";
    const eligibleBranches: string[] = [];

    const degrees = ["B.Tech", "BTech", "BCA", "MCA", "B.Sc", "M.Tech", "Diploma", "BBA", "MBA", "B.Com"];
    for (const d of degrees) {
      const r = new RegExp(`\\b${d.replace(".", "\\.")}\\b`, "i");
      if (r.test(text)) {
        eligibleBranches.push(d);
      }
    }

    if (eligibleBranches.length > 0) {
      qualification = eligibleBranches.join(" / ");
    }

    // --- I. Number of Openings ---
    let openingsCount = 1;
    const openingsMatch = text.match(/(\d+)\s*(?:openings|vacancies|positions|posts|seats|candidates)/i);
    if (openingsMatch) {
      const n = parseInt(openingsMatch[1], 10);
      if (n > 0 && n < 500) {
        openingsCount = n;
      }
    }

    // --- J. Application Method, Link, Documents ---
    let applicationMethod: "EMAIL" | "LINK" | "WHATSAPP" | "WALK_IN" = "EMAIL";
    let applicationLink: string | undefined;

    const linkMatch = text.match(/(https?:\/\/[^\s]+)/);
    if (linkMatch) {
      applicationLink = linkMatch[1];
      applicationMethod = "LINK";
    } else if (/\bwalk-?in\b/i.test(text)) {
      applicationMethod = "WALK_IN";
    } else if (recruiterPhone && /\bwhatsapp\b/i.test(text)) {
      applicationMethod = "WHATSAPP";
    }

    return {
      jobTitle,
      companyName,
      recruiterName,
      recruiterDesignation: "Hiring Manager / HR",
      recruiterEmail,
      recruiterPhone,
      jobDescription: originalRaw.trim(),
      requiredSkills: detectedSkills.length > 0 ? detectedSkills : ["Technical Aptitude", "Problem Solving"],
      qualification,
      eligibleBranches,
      experienceRequired,
      isFresher,
      openingsCount,
      salaryPackage,
      minSalary: minSalaryPaise,
      maxSalary: maxSalaryPaise,
      salaryType,
      currency: "INR",
      location,
      workMode,
      employmentType,
      applicationMethod,
      applicationEmail: recruiterEmail,
      applicationLink,
      companyWebsite: applicationLink && !applicationLink.includes("forms") ? applicationLink : undefined,
      requiredDocuments: ["Updated Resume", "College ID / Govt ID", "Academic Marksheets"],
      feesMentioned: false,
      isSuspicious: false,
      confidenceScore: 0.85,
      missingFields: [],
    };
  }

  /**
   * Identifies fraudulent, suspicious, fee-based recruitment posts.
   */
  private static flagSuspiciousIndicators(job: ExtractedJobData, text: string): void {
    const lower = text.toLowerCase();
    const suspiciousReasons: string[] = [];

    // 1. Fee / Payment demand
    const feeKeywords = [
      "registration fee", "registration charges", "training fee", "security deposit",
      "pay ₹", "pay rs", "fees required", "joining fee", "processing fee",
      "500 rs", "1000 rs", "non refundable", "laptop fee", "uniform charges"
    ];

    // Check if the post explicitly states NO fees (English / Hinglish)
    const isFreePost =
      /(?:no|koi|zero|without|free of|kisi bhi tarah ki)\s*(?:bhi\s*)?(?:registration\s*|joining\s*)?(?:fee|fees|charges)\s*(?:nahi|ni|lagegi|deni|applicable|required|chargeable)?/i.test(lower) ||
      lower.includes("no registration") ||
      lower.includes("free of cost") ||
      lower.includes("zero fees") ||
      lower.includes("koi fees nahi") ||
      lower.includes("koi bhi registration fees");

    if (!isFreePost) {
      for (const f of feeKeywords) {
        if (lower.includes(f)) {
          job.feesMentioned = true;
          job.feeDetails = `Explicit fee/deposit mentioned: "${f}"`;
          suspiciousReasons.push(`Requires candidate payment / fees: "${f}"`);
          break;
        }
      }
    }

    // 2. Unrealistic salary claims for freshers (e.g., 50 LPA for freshers without interview)
    if (job.isFresher && job.maxSalary && job.maxSalary > 300000000) { // > ₹30 LPA
      suspiciousReasons.push("Unusually high salary claim (> ₹30 LPA) for entry-level / fresher position without corporate validation");
    }

    // 3. Suspicious shortened URLs
    if (job.applicationLink && /(bit\.ly|tinyurl\.com|cutt\.ly|is\.gd|t\.me|wa\.me)/i.test(job.applicationLink)) {
      suspiciousReasons.push(`Shortened or direct chat redirection link: ${job.applicationLink}`);
    }

    // 4. Sensitive info requests
    if (/(bank details|atm card|otp|aadhaar card front and back|pan card photo)/i.test(lower)) {
      suspiciousReasons.push("Requests sensitive personal or banking documents directly via messaging");
    }

    // 5. Unknown company without email or phone
    if (job.companyName === "Company Not Specified" && !job.recruiterEmail && !job.recruiterPhone) {
      suspiciousReasons.push("Anonymous hiring post with neither company identity nor verifiable recruiter contact details");
    }

    if (suspiciousReasons.length > 0) {
      job.isSuspicious = true;
      job.suspicionReason = suspiciousReasons.join("; ");
      job.confidenceScore = Math.max(0.2, job.confidenceScore - 0.35);
    }
  }

  /**
   * Analyzes completeness and calculates normalized extraction confidence score
   */
  private static computeConfidenceAndCompleteness(job: ExtractedJobData): void {
    const missing: string[] = [];
    let score = 0.5; // Base score

    if (!job.companyName || job.companyName === "Company Not Specified") {
      missing.push("Company Name");
    } else {
      score += 0.15;
    }

    if (!job.jobTitle || job.jobTitle.includes("Associate")) {
      missing.push("Precise Job Title");
    } else {
      score += 0.1;
    }

    if (!job.recruiterEmail && !job.recruiterPhone && !job.applicationLink) {
      missing.push("Contact / Application Method");
    } else {
      score += 0.15;
    }

    if (!job.salaryPackage) {
      missing.push("Salary / CTC Package");
    } else {
      score += 0.05;
    }

    if (job.requiredSkills.length > 1) {
      score += 0.05;
    }

    if (job.isSuspicious) {
      score = Math.min(score, 0.45);
    }

    job.missingFields = missing;
    job.confidenceScore = Math.min(0.98, Math.max(0.1, parseFloat(score.toFixed(2))));
  }
}
