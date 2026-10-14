import { db } from "@/server/db/client";
import { ExtractedJobData } from "./ai-hiring-extraction.service";

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  matchType?: "EXACT_HASH" | "EXISTING_JOB_DRIVE" | "EXISTING_EXTRACTED_JOB";
  matchedJobDriveId?: string;
  matchedExtractedJobId?: string;
  matchedCompanyName?: string;
  matchedTitle?: string;
  similarityScore: number;
  hasProposedChanges: boolean;
  proposedChanges?: Record<string, { old: any; new: any }>;
}

export class HiringDuplicateDetectionService {
  /**
   * Normalizes company name for fuzzy matching (strips corporate entities, punctuation)
   */
  public static normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(private|pvt\.?|limited|ltd\.?|technologies|tech|solutions|infotech|services|corp|corporation|inc|llp|group|international|india)\b/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Normalizes job title for similarity matching
   */
  public static normalizeJobTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/\b(sr\.?|jr\.?|senior|junior|lead|associate|engineer|developer|executive|specialist|urgent|immediate)\b/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();
  }

  /**
   * Calculates token overlap Jaccard similarity between two strings
   */
  public static calculateTokenSimilarity(str1: string, str2: string): number {
    const tokens1 = new Set(str1.toLowerCase().split(/\s+/).filter(Boolean));
    const tokens2 = new Set(str2.toLowerCase().split(/\s+/).filter(Boolean));

    if (tokens1.size === 0 || tokens2.size === 0) return 0;

    const intersection = new Set([...tokens1].filter((x) => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    return intersection.size / union.size;
  }

  /**
   * Checks candidate job against existing JobDrives and ExtractedHiringJobs
   */
  public static async checkForDuplicates(
    candidate: ExtractedJobData,
    contentHash?: string
  ): Promise<DuplicateDetectionResult> {
    const normCandCompany = this.normalizeCompanyName(candidate.companyName);
    const normCandTitle = this.normalizeJobTitle(candidate.jobTitle);

    // 1. Content hash exact match check on IncomingHiringMessage
    if (contentHash) {
      const exactExistingMsg = await db.incomingHiringMessage.findFirst({
        where: {
          contentHash,
          extractedJob: { isNot: null },
        },
        include: {
          extractedJob: {
            include: { jobDrive: true },
          },
        },
      });

      if (exactExistingMsg?.extractedJob) {
        return {
          isDuplicate: true,
          matchType: "EXACT_HASH",
          matchedExtractedJobId: exactExistingMsg.extractedJob.id,
          matchedJobDriveId: exactExistingMsg.extractedJob.jobDriveId || undefined,
          matchedCompanyName: exactExistingMsg.extractedJob.companyName,
          matchedTitle: exactExistingMsg.extractedJob.jobTitle,
          similarityScore: 1.0,
          hasProposedChanges: false,
        };
      }
    }

    // 2. Check against live JobDrives in Placement CRM
    const activeDrives = await db.jobDrive.findMany({
      where: {
        status: { in: ["ACTIVE", "DRAFT"] },
      },
      include: {
        company: true,
        recruiter: true,
      },
      take: 200,
    });

    for (const drive of activeDrives) {
      const normDriveCompany = this.normalizeCompanyName(drive.company.name);
      const isCompanyMatch =
        normCandCompany.length > 2 &&
        (normCandCompany === normDriveCompany ||
          normCandCompany.includes(normDriveCompany) ||
          normDriveCompany.includes(normCandCompany));

      const titleSim = this.calculateTokenSimilarity(candidate.jobTitle, drive.title);
      const isTitleMatch = titleSim >= 0.5 || normCandTitle === this.normalizeJobTitle(drive.title);

      // Contact match (phone or email)
      const isPhoneMatch = Boolean(
        candidate.recruiterPhone &&
          (drive.recruiter?.phone?.includes(candidate.recruiterPhone) ||
            drive.company.contactPhone?.includes(candidate.recruiterPhone))
      );
      const isEmailMatch = Boolean(
        candidate.recruiterEmail &&
          (drive.recruiter?.email?.toLowerCase() === candidate.recruiterEmail.toLowerCase() ||
            drive.company.contactEmail?.toLowerCase() === candidate.recruiterEmail.toLowerCase())
      );

      // If (Company + Title) match OR (Company + Phone/Email) match
      if ((isCompanyMatch && isTitleMatch) || (isCompanyMatch && (isPhoneMatch || isEmailMatch))) {
        // Compare material fields for changes
        const proposedChanges: Record<string, { old: any; new: any }> = {};

        if (candidate.salaryPackage && candidate.salaryPackage !== drive.salaryPackage) {
          proposedChanges.salaryPackage = { old: drive.salaryPackage, new: candidate.salaryPackage };
        }
        if (candidate.openingsCount && candidate.openingsCount !== drive.openingsCount) {
          proposedChanges.openingsCount = { old: drive.openingsCount, new: candidate.openingsCount };
        }
        if (candidate.location && drive.location && candidate.location.toLowerCase() !== drive.location.toLowerCase()) {
          proposedChanges.location = { old: drive.location, new: candidate.location };
        }
        if (candidate.deadline && drive.deadline && candidate.deadline.getTime() !== drive.deadline.getTime()) {
          proposedChanges.deadline = { old: drive.deadline, new: candidate.deadline };
        }

        const hasChanges = Object.keys(proposedChanges).length > 0;

        return {
          isDuplicate: true,
          matchType: "EXISTING_JOB_DRIVE",
          matchedJobDriveId: drive.id,
          matchedCompanyName: drive.company.name,
          matchedTitle: drive.title,
          similarityScore: isCompanyMatch && isTitleMatch ? 0.95 : 0.85,
          hasProposedChanges: hasChanges,
          proposedChanges: hasChanges ? proposedChanges : undefined,
        };
      }
    }

    // 3. Check against previously extracted jobs in review queue
    const recentExtracted = await db.extractedHiringJob.findMany({
      where: {
        status: { in: ["PENDING_VERIFICATION", "APPROVED", "PUBLISHED"] },
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    for (const job of recentExtracted) {
      const normJobCompany = this.normalizeCompanyName(job.companyName);
      const isCompanyMatch =
        normCandCompany.length > 2 &&
        (normCandCompany === normJobCompany ||
          normCandCompany.includes(normJobCompany) ||
          normJobCompany.includes(normCandCompany));

      const titleSim = this.calculateTokenSimilarity(candidate.jobTitle, job.jobTitle);

      if (isCompanyMatch && titleSim >= 0.5) {
        return {
          isDuplicate: true,
          matchType: "EXISTING_EXTRACTED_JOB",
          matchedExtractedJobId: job.id,
          matchedJobDriveId: job.jobDriveId || undefined,
          matchedCompanyName: job.companyName,
          matchedTitle: job.jobTitle,
          similarityScore: 0.9,
          hasProposedChanges: false,
        };
      }
    }

    return {
      isDuplicate: false,
      similarityScore: 0,
      hasProposedChanges: false,
    };
  }
}
