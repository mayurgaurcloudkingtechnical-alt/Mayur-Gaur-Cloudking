import { db } from "@/server/db/client";

export interface InstituteKnowledge {
  instituteName: string;
  tagline: string;
  campusLocation: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  admissionsHelpline: string;
  recruitingPartnersCount: string;
  corporateRecruitingPartnersCount: string;
  placementClaim: string;
  practicalProjectClaim: string;
  placementHighlights: string;
  practicalTrainingHighlights: string;
  emiHighlights: string;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    durationWeeks?: number;
    feeInRupees: number;
    deliveryMode: string;
    shortDescription?: string;
  }>;
}

export class SoftLabKnowledgeService {
  private static cachedKnowledge: InstituteKnowledge | null = null;
  private static cacheExpiry = 0;

  /**
   * Returns verified institutional knowledge for AI calling prompts
   * Location: Civil Lines, Prayagraj, Uttar Pradesh
   * Dynamically reads configured recruiting partners count (default 1200+)
   */
  public static async getKnowledge(forceRefresh = false): Promise<InstituteKnowledge> {
    const now = Date.now();
    if (!forceRefresh && this.cachedKnowledge && now < this.cacheExpiry) {
      return this.cachedKnowledge;
    }

    // 1. Fetch dynamic global config for recruiting partners count & claims
    const config = await db.aiCallingGlobalConfig.findUnique({
      where: { id: "global-config" },
    });

    const recruitingPartners = config?.corporateRecruitingPartnersCount || "1200+";
    const campusLoc = config?.campusLocation || "Civil Lines, Prayagraj, Uttar Pradesh";
    const webUrl = config?.websiteUrl || "https://www.softlabglobal.com";
    const placementClaim = config?.placementClaim || "100% Placement Support & Dedicated Placement Cell";
    const projectClaim = config?.practicalProjectClaim || "Live Industry Projects & Git/GitHub Repositories";

    // 2. Fetch active LMS courses
    const courses = await db.course.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        slug: true,
        durationWeeks: true,
        baseFee: true,
        summary: true,
        description: true,
      },
      take: 50,
    });

    const formattedCourses = courses.map((c) => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      durationWeeks: c.durationWeeks || 16,
      feeInRupees: Math.floor((c.baseFee || 4500000) / 100),
      deliveryMode: "Classroom, Live Online & Weekend Batches",
      shortDescription: c.summary || c.description || undefined,
    }));

    this.cachedKnowledge = {
      instituteName: "SoftLab Global",
      tagline: "Center for Excellence in Technology & Advanced Learning",
      campusLocation: campusLoc,
      address: "Civil Lines",
      city: "Prayagraj",
      state: "Uttar Pradesh",
      phone: "+91 91965 96979",
      email: "admissions@softlabglobal.com",
      website: webUrl,
      admissionsHelpline: "+91 91965 96979",
      recruitingPartnersCount: recruitingPartners,
      corporateRecruitingPartnersCount: recruitingPartners,
      placementClaim,
      practicalProjectClaim: projectClaim,
      placementHighlights: `${placementClaim} with ${recruitingPartners} corporate recruiting partners, dedicated placement cell, mock technical interviews, capstone projects, and resume building.`,
      practicalTrainingHighlights: `${projectClaim}, 100% practical & hands-on labs, production-oriented projects, Git/GitHub based workflows, and senior industry mentorship.`,
      emiHighlights: "Easy zero-cost EMI installment options available starting from ₹3,500/month, with merit-based scholarships up to 20%.",
      courses: formattedCourses,
    };

    // Cache for 5 minutes
    this.cacheExpiry = now + 5 * 60 * 1000;
    return this.cachedKnowledge;
  }

  /**
   * Formats course details and verified value propositions into a concise prompt text
   */
  public static async getCourseContextPrompt(courseNameOrId?: string): Promise<string> {
    const knowledge = await this.getKnowledge();
    const commonContext = `Institution: SoftLab Global
Location: ${knowledge.campusLocation}
Official Website: ${knowledge.website}
Practical Training: ${knowledge.practicalTrainingHighlights}
Placement Track: ${knowledge.placementHighlights}
Recruiting Partners: ${knowledge.recruitingPartnersCount} corporate recruiting partners.`;

    if (!courseNameOrId) {
      return `${commonContext}

Popular programs at SoftLab Global (Civil Lines, Prayagraj):
- AI & Machine Learning Complete Masterclass (24 Weeks, ₹45,000, Classroom & Online)
- Full Stack Web Development (MERN) (20 Weeks, ₹40,000, Hybrid)
- Data Science & Business Analytics (16 Weeks, ₹42,000, Hybrid)
- Cloud Computing & DevOps (16 Weeks, ₹38,000, Hybrid)
- Cybersecurity & Ethical Hacking (18 Weeks, ₹45,000, Classroom)
- Digital Marketing & Growth Hacking (12 Weeks, ₹25,000, Online/Offline)`;
    }

    const matched = knowledge.courses.find(
      (c) =>
        c.id === courseNameOrId ||
        c.slug.toLowerCase() === courseNameOrId.toLowerCase() ||
        c.title.toLowerCase().includes(courseNameOrId.toLowerCase()) ||
        courseNameOrId.toLowerCase().includes(c.title.toLowerCase())
    );

    if (matched) {
      return `${commonContext}

Target Program: ${matched.title}
- Duration: ${matched.durationWeeks} Weeks
- Official Fee / Investment: ₹${matched.feeInRupees.toLocaleString("en-IN")} (Zero-cost EMI & Scholarship options available)
- Training Delivery: ${matched.deliveryMode} at Civil Lines, Prayagraj Campus or Live Online
- Practical Labs: 100% practical hands-on projects with GitHub portfolio
- Placement Support: Dedicated placement cell with interview scheduling.`;
    }

    return `${commonContext}

Target Program: ${courseNameOrId}
SoftLab Global (Civil Lines, Prayagraj) offers industry-aligned training with practical labs, flexible weekend/weekday batches, and dedicated placement assistance.`;
  }
}
