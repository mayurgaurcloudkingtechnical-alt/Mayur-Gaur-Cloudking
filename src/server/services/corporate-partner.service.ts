import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { UserRoleCode } from "@prisma/client";

export interface CreatePartnerInput {
  name: string;
  industry?: string;
  website?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
}

export interface UpdatePartnerInput extends Partial<CreatePartnerInput> {
  id: string;
  isActive?: boolean;
}

export class CorporatePartnerService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
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
        contactPerson: input.contactPerson?.trim(),
        contactEmail: input.contactEmail?.trim(),
        contactPhone: input.contactPhone?.trim(),
        location: input.location?.trim(),
      },
    });

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
        ...(input.contactPerson !== undefined ? { contactPerson: input.contactPerson.trim() } : {}),
        ...(input.contactEmail !== undefined ? { contactEmail: input.contactEmail.trim() } : {}),
        ...(input.contactPhone !== undefined ? { contactPhone: input.contactPhone.trim() } : {}),
        ...(input.location !== undefined ? { location: input.location.trim() } : {}),
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
        _count: { select: { jobDrives: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  static async getPartnerById(id: string) {
    const partner = await db.corporatePartner.findUnique({
      where: { id },
      include: {
        jobDrives: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!partner) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Corporate partner not found." });
    }

    return partner;
  }
}