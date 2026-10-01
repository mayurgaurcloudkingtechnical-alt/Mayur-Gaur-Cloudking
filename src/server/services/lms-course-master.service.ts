import { db } from "@/server/db/client";
import { ContentStatus, BatchStatus } from "@prisma/client";

export interface MasterCourseRecord {
  id: string;
  courseName: string;
  courseCode: string;
  category: string;
  providerType: "SOFTLAB" | "UNIVERSITY";
  providerName: string;
  shortDescription: string;
  fullDescription: string;
  duration: string;
  durationWeeks: number;
  eligibility: string;
  curriculum: string[];
  fee: number; // In Rupees
  feePaise: number;
  discountedFee?: number;
  emiPlans: Array<{
    tenureMonths: number;
    monthlyAmountRupees: number;
    interestRatePercent: number;
  }>;
  placementInfo: string;
  mode: string;
  branch: string;
  batches: Array<{
    id: string;
    name: string;
    code: string;
    startDate: Date;
    capacity: number;
  }>;
  courseImage: string;
  brochureUrl: string;
  courseUrl: string;
  admissionUrl: string;
  paymentUrl: string;
  isActive: boolean;
  whatsappCatalogStatus: string;
  lastCatalogSyncAt?: Date | null;
  metaCatalogId?: string | null;
  metaProductId?: string | null;
  catalogSyncError?: string | null;
}

export class LmsCourseMasterService {
  /**
   * Transforms raw Prisma Course entity into authoritative MasterCourseRecord
   */
  private static transformCourse(c: any): MasterCourseRecord {
    const feeInRupees = Math.round(c.baseFee / 100);
    const discFeeInRupees = c.discountedFee ? Math.round(c.discountedFee / 100) : undefined;

    // Standard 0% interest EMI options calculated from live fee
    const defaultEmi = [
      {
        tenureMonths: 3,
        monthlyAmountRupees: Math.round(feeInRupees / 3),
        interestRatePercent: 0,
      },
      {
        tenureMonths: 6,
        monthlyAmountRupees: Math.round(feeInRupees / 6),
        interestRatePercent: 0,
      },
    ];

    const emiPlans = Array.isArray(c.emiPlans) && c.emiPlans.length > 0 ? (c.emiPlans as any) : defaultEmi;

    const curriculum = Array.isArray(c.modules)
      ? c.modules.map((m: any) => m.title)
      : [];

    const batches = Array.isArray(c.batches)
      ? c.batches.map((b: any) => ({
          id: b.id,
          name: b.name,
          code: b.code,
          startDate: b.startDate,
          capacity: b.capacity,
        }))
      : [];

    const durationStr =
      c.durationYears ||
      (c.durationWeeks ? `${c.durationWeeks} Weeks (${Math.round(c.durationWeeks / 4)} Months)` : "3 to 6 Months");

    const categoryStr =
      c.programCategory ||
      (c.providerType === "UNIVERSITY" ? "University Degree / Diploma" : "Flagship Professional IT Program");

    const baseUrl = process.env.NEXTAUTH_URL || "https://www.softlabglobal.com";

    return {
      id: c.id,
      courseName: c.title,
      courseCode: c.courseCode || c.slug.toUpperCase().replace(/-/g, "_"),
      category: categoryStr,
      providerType: (c.providerType as "SOFTLAB" | "UNIVERSITY") || "SOFTLAB",
      providerName: c.providerName || "SoftLab Global",
      shortDescription: c.summary || c.title,
      fullDescription: c.description || c.summary || c.title,
      duration: durationStr,
      durationWeeks: c.durationWeeks || 12,
      eligibility: c.eligibility || "Open to all graduates, diploma holders, and career transitioners",
      curriculum,
      fee: feeInRupees,
      feePaise: c.baseFee,
      discountedFee: discFeeInRupees,
      emiPlans,
      placementInfo:
        c.placementInfo || "100% Placement Support with 1,200+ Corporate Hiring Partners & Dedicated Placement Cell",
      mode: c.mode || "Classroom at Prayagraj & Live Online Interactive",
      branch: c.branch || "Civil Lines, Prayagraj",
      batches,
      courseImage: c.thumbnailUrl || `${baseUrl}/images/default-course.png`,
      brochureUrl: c.brochureUrl || `${baseUrl}/brochures/course-catalog.pdf`,
      courseUrl: `${baseUrl}/courses/${c.slug}`,
      admissionUrl: `${baseUrl}/admissions?course=${c.slug}`,
      paymentUrl: `${baseUrl}/pay?course=${c.slug}`,
      isActive: c.status === ContentStatus.PUBLISHED && !c.deletedAt,
      whatsappCatalogStatus: c.whatsappCatalogStatus || "PENDING",
      lastCatalogSyncAt: c.lastCatalogSyncAt,
      metaCatalogId: c.metaCatalogId,
      metaProductId: c.metaProductId,
      catalogSyncError: c.catalogSyncError,
    };
  }

  /**
   * Retrieve all active published courses from LMS Course Master
   */
  public static async getAllActiveCourses(options?: {
    providerType?: "SOFTLAB" | "UNIVERSITY";
  }): Promise<MasterCourseRecord[]> {
    const where: any = {
      status: ContentStatus.PUBLISHED,
      deletedAt: null,
    };

    if (options?.providerType) {
      where.providerType = options.providerType;
    }

    const courses = await db.course.findMany({
      where,
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
          take: 8,
        },
        batches: {
          where: { status: { in: [BatchStatus.OPEN_FOR_ENROLLMENT, BatchStatus.UPCOMING, BatchStatus.ONGOING] } },
          take: 3,
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return courses.map(this.transformCourse);
  }

  /**
   * Retrieve specific course by ID or Slug
   */
  public static async getCourseByIdOrSlug(idOrSlug: string): Promise<MasterCourseRecord | null> {
    const course = await db.course.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        deletedAt: null,
      },
      include: {
        modules: {
          orderBy: { sortOrder: "asc" },
        },
        batches: {
          where: { status: { in: [BatchStatus.OPEN_FOR_ENROLLMENT, BatchStatus.UPCOMING, BatchStatus.ONGOING] } },
        },
      },
    });

    if (!course) return null;
    return this.transformCourse(course);
  }

  /**
   * Search Course Master dynamically for AI Counselor & WhatsApp responses
   */
  public static async findMatchingCourses(query: string): Promise<MasterCourseRecord[]> {
    const qLower = query.toLowerCase().trim();
    const allCourses = await this.getAllActiveCourses();

    if (!qLower) return allCourses;

    // Filter and score matches
    const scored = allCourses.map((c) => {
      let score = 0;
      const titleLower = c.courseName.toLowerCase();
      const slugLower = c.courseCode.toLowerCase();
      const descLower = c.fullDescription.toLowerCase();
      const catLower = c.category.toLowerCase();

      // Exact phrase match in title
      if (titleLower.includes(qLower)) score += 50;
      // Slug match
      if (slugLower.includes(qLower.replace(/\s+/g, "_"))) score += 40;
      // Partial word matches in title
      const qWords = qLower.split(/\s+/).filter((w) => w.length > 2);
      for (const word of qWords) {
        if (titleLower.includes(word)) score += 15;
        if (descLower.includes(word)) score += 5;
        if (catLower.includes(word)) score += 8;
      }

      // Keyword associations
      if (qLower.includes("cyber") || qLower.includes("hack") || qLower.includes("security")) {
        if (titleLower.includes("cyber") || titleLower.includes("security")) score += 30;
      }
      if (qLower.includes("python") || qLower.includes("django")) {
        if (titleLower.includes("python")) score += 30;
      }
      if (qLower.includes("mern") || qLower.includes("react") || qLower.includes("node") || qLower.includes("web dev") || qLower.includes("full stack")) {
        if (titleLower.includes("mern") || titleLower.includes("web development") || titleLower.includes("full stack")) score += 30;
      }
      if (qLower.includes("ai") || qLower.includes("ml") || qLower.includes("machine learning") || qLower.includes("intelligence")) {
        if (titleLower.includes("intelligence") || titleLower.includes("machine learning") || titleLower.includes("ai")) score += 30;
      }
      if (qLower.includes("cloud") || qLower.includes("aws") || qLower.includes("devops") || qLower.includes("server")) {
        if (titleLower.includes("cloud") || titleLower.includes("server") || titleLower.includes("networking")) score += 30;
      }
      if (qLower.includes("bca") || qLower.includes("mca") || qLower.includes("degree") || qLower.includes("diploma")) {
        if (c.providerType === "UNIVERSITY") score += 25;
      }

      return { course: c, score };
    });

    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.course);
  }
}
