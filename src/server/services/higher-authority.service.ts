import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";

export interface CreateHigherAuthorityInput {
  name: string;
  designation: string;
  department?: string;
  roleCode?: UserRoleCode;
  officialEmail: string;
  personalEmail?: string;
  whatsappNumber?: string;
  isActive?: boolean;
  notifyEmail?: boolean;
  notifyPersonalEmail?: boolean;
  notifyWhatsApp?: boolean;
  receiveDailyReports?: boolean;
  receiveEscalations?: boolean;
  receiveOnboarding?: boolean;
  priority?: number;
  userId?: string;
}

export interface UpdateHigherAuthorityInput extends Partial<CreateHigherAuthorityInput> {
  id: string;
}

export class HigherAuthorityService {
  /**
   * Automatically initializes default Higher Authorities from existing active platform users
   * if the directory is currently empty.
   */
  public static async seedDefaultAuthoritiesIfEmpty(): Promise<void> {
    try {
      const count = await db.higherAuthorityRecipient.count();
      if (count > 0) return;

      console.log("[HigherAuthorityService] Initializing default Higher Authority Directory...");

      // 1. Fetch active Directors, Super Admins, Admins, HR from User table
      const users = await db.user.findMany({
        where: {
          status: "ACTIVE",
          roleCode: {
            in: [
              UserRoleCode.SUPER_ADMIN,
              UserRoleCode.DIRECTOR,
              UserRoleCode.ADMIN,
              UserRoleCode.HR,
            ],
          },
        },
        include: {
          staffProfile: true,
        },
      });

      const defaultAuthorities: Array<{
        name: string;
        designation: string;
        department: string;
        roleCode: UserRoleCode;
        officialEmail: string;
        personalEmail?: string;
        whatsappNumber?: string;
        userId?: string;
        priority: number;
        receiveDailyReports: boolean;
        receiveEscalations: boolean;
        receiveOnboarding: boolean;
      }> = [];

      // Add Executive Management fallback
      defaultAuthorities.push({
        name: "Executive Management Desk",
        designation: "Executive Board / Directorate",
        department: "EXECUTIVE_MANAGEMENT",
        roleCode: UserRoleCode.DIRECTOR,
        officialEmail: "softlabglobal9@gmail.com",
        personalEmail: "director@softlabglobal.com",
        whatsappNumber: "9196596975",
        priority: 1,
        receiveDailyReports: true,
        receiveEscalations: true,
        receiveOnboarding: true,
      });

      for (const u of users) {
        const fullName = `${u.firstName} ${u.lastName}`.trim();
        const designation = u.staffProfile?.designation || (u.roleCode === "DIRECTOR" ? "Executive Director" : u.roleCode === "SUPER_ADMIN" ? "Super Administrator" : u.roleCode === "ADMIN" ? "System Administrator" : "HR Manager");
        const department = u.staffProfile?.department ? String(u.staffProfile.department) : "EXECUTIVE_MANAGEMENT";

        defaultAuthorities.push({
          name: fullName,
          designation,
          department,
          roleCode: u.roleCode,
          officialEmail: u.email,
          personalEmail: u.staffProfile?.personalEmail || undefined,
          whatsappNumber: u.whatsappNumber || u.phone || u.staffProfile?.personalPhone || undefined,
          userId: u.id,
          priority: u.roleCode === "DIRECTOR" || u.roleCode === "SUPER_ADMIN" ? 1 : 2,
          receiveDailyReports: true,
          receiveEscalations: true,
          receiveOnboarding: u.roleCode === "HR" || u.roleCode === "SUPER_ADMIN",
        });
      }

      // Deduplicate by officialEmail
      const seen = new Set<string>();
      for (const auth of defaultAuthorities) {
        const cleanEmail = auth.officialEmail.toLowerCase().trim();
        if (seen.has(cleanEmail)) continue;
        seen.add(cleanEmail);

        await db.higherAuthorityRecipient.create({
          data: {
            ...auth,
            isActive: true,
            notifyEmail: true,
            notifyPersonalEmail: Boolean(auth.personalEmail),
            notifyWhatsApp: Boolean(auth.whatsappNumber),
          },
        });
      }

      console.log(`[HigherAuthorityService] Initialized ${seen.size} Higher Authorities.`);
    } catch (err: any) {
      console.error("[HigherAuthorityService] Error seeding default authorities:", err.message);
    }
  }

  /**
   * Retrieves all active higher authorities configured for a given event,
   * deduplicating so an individual with multiple roles receives only one notification.
   */
  public static async getRecipientsForEvent(eventType: "DAILY_REPORT" | "ESCALATION" | "ONBOARDING"): Promise<Array<{
    id: string;
    name: string;
    designation: string;
    department: string;
    roleCode: string;
    officialEmail: string;
    personalEmail?: string | null;
    whatsappNumber?: string | null;
    notifyEmail: boolean;
    notifyPersonalEmail: boolean;
    notifyWhatsApp: boolean;
    priority: number;
  }>> {
    await this.seedDefaultAuthoritiesIfEmpty();

    const whereClause: any = { isActive: true };
    if (eventType === "DAILY_REPORT") whereClause.receiveDailyReports = true;
    if (eventType === "ESCALATION") whereClause.receiveEscalations = true;
    if (eventType === "ONBOARDING") whereClause.receiveOnboarding = true;

    const list = await db.higherAuthorityRecipient.findMany({
      where: whereClause,
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    // Deduplicate by officialEmail (case-insensitive)
    const deduped: any[] = [];
    const seenEmails = new Set<string>();

    for (const item of list) {
      const email = item.officialEmail.trim().toLowerCase();
      if (!seenEmails.has(email)) {
        seenEmails.add(email);
        deduped.push(item);
      }
    }

    return deduped;
  }

  /**
   * List all higher authorities for the Admin Management panel
   */
  public static async listHigherAuthorities(search?: string) {
    await this.seedDefaultAuthoritiesIfEmpty();

    return db.higherAuthorityRecipient.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { officialEmail: { contains: search, mode: "insensitive" } },
              { designation: { contains: search, mode: "insensitive" } },
              { department: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  /**
   * Create a new higher authority record
   */
  public static async createHigherAuthority(input: CreateHigherAuthorityInput) {
    const cleanEmail = input.officialEmail.trim().toLowerCase();
    const existing = await db.higherAuthorityRecipient.findFirst({
      where: { officialEmail: { equals: cleanEmail, mode: "insensitive" } },
    });

    if (existing) {
      throw new Error(`A higher authority with official email '${cleanEmail}' already exists.`);
    }

    return db.higherAuthorityRecipient.create({
      data: {
        name: input.name.trim(),
        designation: input.designation.trim(),
        department: input.department?.trim() || "EXECUTIVE_MANAGEMENT",
        roleCode: input.roleCode || UserRoleCode.DIRECTOR,
        officialEmail: cleanEmail,
        personalEmail: input.personalEmail?.trim().toLowerCase() || null,
        whatsappNumber: input.whatsappNumber?.trim() || null,
        isActive: input.isActive ?? true,
        notifyEmail: input.notifyEmail ?? true,
        notifyPersonalEmail: input.notifyPersonalEmail ?? false,
        notifyWhatsApp: input.notifyWhatsApp ?? true,
        receiveDailyReports: input.receiveDailyReports ?? true,
        receiveEscalations: input.receiveEscalations ?? true,
        receiveOnboarding: input.receiveOnboarding ?? false,
        priority: input.priority ?? 1,
        userId: input.userId || null,
      },
    });
  }

  /**
   * Update an existing higher authority record
   */
  public static async updateHigherAuthority(input: UpdateHigherAuthorityInput) {
    const { id, ...data } = input;
    return db.higherAuthorityRecipient.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.designation ? { designation: data.designation.trim() } : {}),
        ...(data.department ? { department: data.department.trim() } : {}),
        ...(data.roleCode ? { roleCode: data.roleCode } : {}),
        ...(data.officialEmail ? { officialEmail: data.officialEmail.trim().toLowerCase() } : {}),
        personalEmail: data.personalEmail !== undefined ? (data.personalEmail?.trim().toLowerCase() || null) : undefined,
        whatsappNumber: data.whatsappNumber !== undefined ? (data.whatsappNumber?.trim() || null) : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
        notifyEmail: data.notifyEmail !== undefined ? data.notifyEmail : undefined,
        notifyPersonalEmail: data.notifyPersonalEmail !== undefined ? data.notifyPersonalEmail : undefined,
        notifyWhatsApp: data.notifyWhatsApp !== undefined ? data.notifyWhatsApp : undefined,
        receiveDailyReports: data.receiveDailyReports !== undefined ? data.receiveDailyReports : undefined,
        receiveEscalations: data.receiveEscalations !== undefined ? data.receiveEscalations : undefined,
        receiveOnboarding: data.receiveOnboarding !== undefined ? data.receiveOnboarding : undefined,
        priority: data.priority !== undefined ? data.priority : undefined,
      },
    });
  }

  /**
   * Toggle active status
   */
  public static async toggleStatus(id: string) {
    const existing = await db.higherAuthorityRecipient.findUnique({ where: { id } });
    if (!existing) throw new Error("Recipient not found.");

    return db.higherAuthorityRecipient.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }
}
