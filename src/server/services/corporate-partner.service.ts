import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { UserRoleCode, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

export interface CreatePartnerInput {
  name: string;
  industry?: string;
  website?: string;
  companySize?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  notes?: string;
}

export interface UpdatePartnerInput extends Partial<CreatePartnerInput> {
  id: string;
  isActive?: boolean;
}

export interface PublicRecruiterRegistrationInput {
  companyName: string;
  industry?: string;
  website?: string;
  companySize?: string;
  city?: string;
  state?: string;
  contactPersonName: string;
  designation?: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  hiringType?: string;
  targetDomains: string[];
  jobTitle?: string;
  openingsCount?: number;
  salaryPackage?: string;
  workMode?: string;
  jobDescription?: string;
  notes?: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export class CorporatePartnerService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.MANAGER ||
      user.roleCode === UserRoleCode.HR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage corporate partners.",
      });
    }
  }

  static async createPartner(user: AuthenticatedUser, input: CreatePartnerInput) {
    this.checkCanManage(user);

    if (!input.name.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Company name is required." });
    }

    const partner = await db.corporatePartner.create({
      data: {
        name: input.name.trim(),
        industry: input.industry?.trim(),
        website: input.website?.trim(),
        companySize: input.companySize?.trim(),
        address: input.address?.trim(),
        city: input.city?.trim(),
        state: input.state?.trim(),
        gstNumber: input.gstNumber?.trim(),
        contactPerson: input.contactPerson?.trim(),
        contactEmail: input.contactEmail?.trim(),
        contactPhone: input.contactPhone?.trim(),
        location: input.location?.trim() || input.city?.trim(),
        notes: input.notes?.trim(),
      },
    });

    if (input.contactPerson && input.contactEmail) {
      await db.recruiterContact.create({
        data: {
          companyId: partner.id,
          name: input.contactPerson.trim(),
          email: input.contactEmail.trim().toLowerCase(),
          phone: input.contactPhone?.trim() || "+91 9196596975",
          designation: "HR / Talent Acquisition Lead",
        },
      }).catch(() => null);
    }

    await AuditService.log({
      actorId: user.id,
      action: "CORPORATE_PARTNER_CREATED",
      resourceType: "CorporatePartner",
      resourceId: partner.id,
      newData: { name: partner.name },
    });

    return partner;
  }

  static async updatePartner(user: AuthenticatedUser, input: UpdatePartnerInput) {
    this.checkCanManage(user);

    const existing = await db.corporatePartner.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corporate partner not found." });
    }

    const updated = await db.corporatePartner.update({
      where: { id: input.id },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.industry !== undefined ? { industry: input.industry.trim() } : {}),
        ...(input.website !== undefined ? { website: input.website.trim() } : {}),
        ...(input.companySize !== undefined ? { companySize: input.companySize.trim() } : {}),
        ...(input.address !== undefined ? { address: input.address.trim() } : {}),
        ...(input.city !== undefined ? { city: input.city.trim() } : {}),
        ...(input.state !== undefined ? { state: input.state.trim() } : {}),
        ...(input.gstNumber !== undefined ? { gstNumber: input.gstNumber.trim() } : {}),
        ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson.trim() } : {}),
        ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail.trim() } : {}),
        ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone.trim() } : {}),
        ...(input.location !== undefined ? { location: input.location.trim() } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "CORPORATE_PARTNER_UPDATED",
      resourceType: "CorporatePartner",
      resourceId: input.id,
      newData: { name: updated.name, isActive: updated.isActive },
    });

    return updated;
  }

  static async listPartners(onlyActive = false) {
    return db.corporatePartner.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      include: {
        _count: { select: { jobDrives: true, recruiters: true } },
        recruiters: { take: 3 },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async listCorporatePartnersDetailed() {
    return db.corporatePartner.findMany({
      include: {
        _count: { select: { jobDrives: true, recruiters: true, followUps: true } },
        recruiters: true,
        jobDrives: {
          select: {
            id: true,
            title: true,
            department: true,
            openingsCount: true,
            salaryPackage: true,
            status: true,
            workMode: true,
            createdAt: true,
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPartnerById(id: string) {
    const partner = await db.corporatePartner.findUnique({
      where: { id },
      include: {
        recruiters: true,
        jobDrives: {
          include: {
            _count: { select: { applications: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        followUps: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corporate partner not found." });
    }

    return partner;
  }

  /**
   * Public recruiter submission from https://www.softlabglobal.com/recruiters
   */
  static async registerPublicRecruiter(input: PublicRecruiterRegistrationInput) {
    if (!input.companyName.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Company name is required." });
    }
    if (!input.contactPersonName.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Contact person name is required." });
    }
    if (!input.contactEmail.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Official work email is required." });
    }

    // 1. Create or find existing corporate partner
    let partner = await db.corporatePartner.findFirst({
      where: {
        OR: [
          { name: { equals: input.companyName.trim(), mode: "insensitive" } },
          { contactEmail: { equals: input.contactEmail.trim().toLowerCase(), mode: "insensitive" } },
        ],
      },
    });

    const partnerNotes = `Public registration via /recruiters. Domains: ${input.targetDomains.join(", ")}. Hiring Type: ${input.hiringType || "Direct Hire"}. Notes: ${input.notes || "None"}`;

    if (!partner) {
      partner = await db.corporatePartner.create({
        data: {
          name: input.companyName.trim(),
          industry: input.industry?.trim() || "Information Technology",
          website: input.website?.trim() || null,
          companySize: input.companySize?.trim() || "11-50",
          city: input.city?.trim() || "Prayagraj",
          state: input.state?.trim() || "Uttar Pradesh",
          location: `${input.city || "Prayagraj"}, ${input.state || "Uttar Pradesh"}`,
          contactPerson: input.contactPersonName.trim(),
          contactEmail: input.contactEmail.trim().toLowerCase(),
          contactPhone: input.contactPhone.trim(),
          notes: partnerNotes,
          isActive: true,
        },
      });
    }

    // 2. Add recruiter contact person
    const recruiter = await db.recruiterContact.create({
      data: {
        companyId: partner.id,
        name: input.contactPersonName.trim(),
        designation: input.designation?.trim() || "HR / Talent Acquisition Lead",
        email: input.contactEmail.trim().toLowerCase(),
        phone: input.contactPhone.trim(),
        notes: input.whatsappNumber ? `WhatsApp: ${input.whatsappNumber}` : undefined,
      },
    }).catch(() => null);

    // 3. If job opening or target domains specified, create an initial JobDrive (status: DRAFT / PENDING_REVIEW)
    let jobDrive = null;
    try {
      const defaultAdmin = await db.user.findFirst({
        where: { roleCode: UserRoleCode.SUPER_ADMIN },
      }) || (await db.user.findFirst());

      if (defaultAdmin) {
        const driveTitle = input.jobTitle?.trim() || `${input.targetDomains[0] || "Software Engineering"} Associate`;
        const slugBase = `${slugify(input.companyName)}-${slugify(driveTitle)}-${Date.now().toString(36)}`;

        jobDrive = await db.jobDrive.create({
          data: {
            companyId: partner.id,
            recruiterId: recruiter?.id || null,
            title: driveTitle,
            slug: slugBase,
            department: input.targetDomains.join(", ") || "Engineering",
            jobType: input.hiringType === "INTERNSHIP" ? "INTERNSHIP" : "FULL_TIME",
            workMode: input.workMode || "HYBRID",
            description: input.jobDescription?.trim() || `Hiring requirement submitted via SoftLab Global Recruiter Portal for ${input.companyName}. Looking for candidates skilled in ${input.targetDomains.join(", ")}.`,
            salaryPackage: input.salaryPackage?.trim() || "₹4.5 - ₹7.5 LPA",
            openingsCount: input.openingsCount || 5,
            requiredSkills: input.targetDomains,
            status: "DRAFT",
            createdById: defaultAdmin.id,
          },
        });
      }
    } catch (_) {
      // Job drive creation optional on public form
    }

    const refCode = `SLG-REC-${Math.floor(100000 + Math.random() * 900000)}`;

    return {
      success: true,
      referenceCode: refCode,
      companyId: partner.id,
      companyName: partner.name,
      contactPerson: input.contactPersonName,
      jobDriveId: jobDrive?.id || null,
    };
  }

  /**
   * Provision a RECRUITER role user account for a corporate partner's HR
   */
  static async createRecruiterUser(
    actor: AuthenticatedUser,
    input: {
      companyId: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      password?: string;
    }
  ) {
    this.checkCanManage(actor);

    const partner = await db.corporatePartner.findUnique({ where: { id: input.companyId } });
    if (!partner) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Company not found." });
    }

    const existingUser = await db.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
    });
    if (existingUser) {
      throw new TRPCError({ code: "CONFLICT", message: "A user account with this email already exists." });
    }

    const rawPassword = input.password?.trim() || "Recruiter@2026!";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const role = await db.role.findFirst({
      where: { code: UserRoleCode.RECRUITER },
    });
    if (!role) {
      throw new TRPCError({ code: "NOT_FOUND", message: "RECRUITER role not configured in database." });
    }

    const user = await db.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() || null,
        roleCode: UserRoleCode.RECRUITER,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "RECRUITER_USER_PROVISIONED",
      resourceType: "User",
      resourceId: user.id,
      newData: { email: user.email, companyId: partner.id },
    });

    return {
      success: true,
      userId: user.id,
      email: user.email,
      temporaryPassword: rawPassword,
      companyName: partner.name,
    };
  }
}