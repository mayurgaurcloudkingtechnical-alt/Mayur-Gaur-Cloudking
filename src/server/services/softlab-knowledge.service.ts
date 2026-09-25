import { db } from "@/server/db/client";

export interface InstituteKnowledge {
  instituteName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  admissionsHelpline: string;
  placementHighlights: string;
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
   */
  public static async getKnowledge(): Promise<InstituteKnowledge> {
    const now = Date.now();
    if (this.cachedKnowledge && now < this.cacheExpiry) {
      return this.cachedKnowledge;
    }

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
      deliveryMode: "HYBRID",
      shortDescription: c.summary || c.description || undefined,
    }));

    this.cachedKnowledge = {
      instituteName: "SoftLab Global",
      tagline: "Center for Excellence in Technology & Advanced Learning",
      address: "H-15, Sector-63",
      city: "Noida",
      state: "Uttar Pradesh",
      phone: "+91 98765 43210",
      email: "admissions@softlabglobal.com",
      website: "https://softlabglobal.com",
      admissionsHelpline: "+91 98765 43210",
      placementHighlights: "100% Placement Assistance with 300+ hiring corporate partners, dedicated mock interviews, capstone projects, and resume building.",
      emiHighlights: "Easy zero-cost EMI installment options available starting from ₹3,500/month, with merit-based scholarships up to 20%.",
      courses: formattedCourses,
    };

    // Cache for 10 minutes
    this.cacheExpiry = now + 10 * 60 * 1000;
    return this.cachedKnowledge;
  }

  /**
   * Formats course details into a concise prompt text
   */
  public static async getCourseContextPrompt(courseNameOrId?: string): Promise<string> {
    const knowledge = await this.getKnowledge();
    if (!courseNameOrId) {
      return `Popular courses available at SoftLab Global:
- AI & Machine Learning Masterclass (24 Weeks, ₹45,000, Classroom & Online)
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
      return `Target Course: ${matched.title}
- Duration: ${matched.durationWeeks} Weeks
- Standard Investment / Fee: ₹${matched.feeInRupees.toLocaleString("en-IN")} (Zero-cost EMI & Scholarship options available)
- Mode of Training: ${matched.deliveryMode} (Interactive live practical labs, industry mentor sessions)
- Placement Assistance: Included with guaranteed interview opportunities.`;
    }

    return `Target Course/Area: ${courseNameOrId}
SoftLab Global offers certified programs with practical industry lab training, flexible weekend/weekday batches, and dedicated placement support.`;
  }
}
