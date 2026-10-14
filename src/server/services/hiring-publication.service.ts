import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { JobDriveStatus, JobType } from "@prisma/client";

export class HiringPublicationService {
  /**
   * Generates URL-friendly unique slug for JobDrive
   */
  private static generateSlug(title: string, company: string): string {
    const base = `${company}-${title}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50);
    return `${base}-${Date.now().toString().slice(-6)}`;
  }

  /**
   * Matches existing CorporatePartner by normalized name or creates a new one
   */
  public static async matchOrCreateCorporatePartner(companyName: string, location?: string, website?: string) {
    const trimmed = companyName.trim();
    if (!trimmed || trimmed === "Company Not Specified") {
      let unverified = await db.corporatePartner.findFirst({
        where: { name: "WhatsApp Partner (Unverified)" },
      });
      if (!unverified) {
        unverified = await db.corporatePartner.create({
          data: {
            name: "WhatsApp Partner (Unverified)",
            industry: "IT & Software",
            location: location || "India",
            notes: "Auto-created placeholder for unverified WhatsApp hiring posts",
          },
        });
      }
      return unverified;
    }

    // Exact or case-insensitive search
    const existing = await db.corporatePartner.findFirst({
      where: {
        name: { equals: trimmed, mode: "insensitive" },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new partner
    return db.corporatePartner.create({
      data: {
        name: trimmed,
        industry: "IT & Services",
        website: website,
        location: location || "India",
        notes: "Auto-registered from authorized WhatsApp Hiring Automation",
      },
    });
  }

  /**
   * Matches existing RecruiterContact by phone/email or creates a new one
   */
  public static async matchOrCreateRecruiterContact(
    companyId: string,
    name?: string,
    email?: string,
    phone?: string,
    designation?: string
  ) {
    if (!email && !phone) {
      return null;
    }

    // Try finding by email or phone
    const existing = await db.recruiterContact.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: { equals: email.trim(), mode: "insensitive" as const } }] : []),
          ...(phone ? [{ phone: { contains: phone.trim().slice(-10) } }] : []),
        ],
      },
    });

    if (existing) {
      return existing;
    }

    // Create new recruiter contact
    return db.recruiterContact.create({
      data: {
        companyId,
        name: name?.trim() || "Recruitment Team",
        designation: designation || "Talent Acquisition / HR",
        email: email?.trim() || `hr.${Date.now()}@partner.softlabglobal.com`,
        phone: phone?.trim() || "0000000000",
        location: "India",
        notes: "Captured via WhatsApp Hiring Automation",
        status: "ACTIVE",
      },
    });
  }

  /**
   * Approves an extracted hiring job and publishes it into the official Placement CRM
   */
  public static async publishExtractedJobToCrm(
    actor: AuthenticatedUser,
    extractedJobId: string,
    overrides?: {
      jobTitle?: string;
      companyName?: string;
      salaryPackage?: string;
      location?: string;
      openingsCount?: number;
      deadline?: Date;
    }
  ) {
    const job = await db.extractedHiringJob.findUnique({
      where: { id: extractedJobId },
      include: { message: true },
    });

    if (!job) {
      throw new Error("Extracted job record not found.");
    }

    const title = overrides?.jobTitle?.trim() || job.jobTitle;
    const company = overrides?.companyName?.trim() || job.companyName;
    const salary = overrides?.salaryPackage?.trim() || job.salaryPackage;
    const loc = overrides?.location?.trim() || job.location;
    const openings = overrides?.openingsCount ?? job.openingsCount;
    const deadline = overrides?.deadline || job.deadline;

    // 1. Resolve Corporate Partner & Recruiter
    const partner = await this.matchOrCreateCorporatePartner(company, loc || undefined, job.companyWebsite || undefined);
    const recruiter = await this.matchOrCreateRecruiterContact(
      partner.id,
      job.recruiterName || undefined,
      job.recruiterEmail || undefined,
      job.recruiterPhone || undefined,
      job.recruiterDesignation || undefined
    );

    // 2. Generate slug & JobDrive
    const slug = this.generateSlug(title, partner.name);

    let jobTypeEnum: JobType = JobType.FULL_TIME;
    if (job.employmentType === "INTERNSHIP") jobTypeEnum = JobType.INTERNSHIP;
    else if (job.employmentType === "CONTRACT") jobTypeEnum = JobType.CONTRACT;

    const drive = await db.jobDrive.create({
      data: {
        companyId: partner.id,
        recruiterId: recruiter?.id,
        title,
        slug,
        jobType: jobTypeEnum,
        workMode: job.workMode,
        description: job.jobDescription,
        requirements: `Required Skills: ${job.requiredSkills.join(", ")}\nEligibility: ${job.qualification || "Any Graduate"}\nExperience: ${job.experienceRequired || "Fresher / 0-1 Year"}`,
        eligibilityCriteria: job.qualification,
        salaryPackage: salary,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        location: loc,
        experienceRequired: job.experienceRequired,
        qualification: job.qualification,
        requiredSkills: job.requiredSkills,
        openingsCount: openings,
        deadline,
        interviewDate: job.interviewDate,
        status: JobDriveStatus.ACTIVE,
        createdById: actor.id,
      },
    });

    // 3. Update Extracted Job
    const updatedJob = await db.extractedHiringJob.update({
      where: { id: extractedJobId },
      data: {
        jobDriveId: drive.id,
        status: "PUBLISHED",
        verifiedById: actor.id,
        verifiedAt: new Date(),
        jobTitle: title,
        companyName: company,
        salaryPackage: salary,
        location: loc,
        openingsCount: openings,
      },
    });

    // 4. Update message processing status & create source reference
    await db.incomingHiringMessage.update({
      where: { id: job.messageId },
      data: { processingStatus: "PUBLISHED" },
    });

    await db.jobSourceReference.create({
      data: {
        jobDriveId: drive.id,
        messageId: job.messageId,
        sourceId: job.message.sourceId,
      },
    });

    // 5. Audit Log
    await AuditService.log({
      actorId: actor.id,
      action: "WHATSAPP_HIRING_JOB_PUBLISHED",
      resourceType: "JobDrive",
      resourceId: drive.id,
      newData: {
        title: drive.title,
        company: partner.name,
        extractedJobId,
        sourceMessageId: job.messageId,
      },
    });

    await db.hiringAutomationLog.create({
      data: {
        sourceId: job.message.sourceId,
        messageId: job.messageId,
        level: "SUCCESS",
        event: "JOB_PUBLISHED_TO_CRM",
        details: {
          jobDriveId: drive.id,
          title: drive.title,
          company: partner.name,
          publishedBy: actor.email,
        },
      },
    });

    return { drive, extractedJob: updatedJob };
  }
}
