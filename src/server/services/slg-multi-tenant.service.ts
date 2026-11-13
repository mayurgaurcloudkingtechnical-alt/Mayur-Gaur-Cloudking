import { db } from "@/server/db/client";
import { TenantPlanTier, TenantStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface CreateTenantInput {
  slug: string;
  name: string;
  legalName?: string;
  gstin?: string;
  planTier?: TenantPlanTier;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  adminPhone?: string;
  adminPasswordHash: string;
  customDomain?: string;
}

export class SlgMultiTenantService {
  public static readonly SOFTLAB_TENANT_SLUG = "softlab";

  /**
   * Initializes TENANT-0 (SOFTLAB GLOBAL) as the seed internal tenant.
   * Ensures default branches and departments exist, and backfills legacy records.
   */
  static async ensureDefaultSoftlabTenant() {
    let softlabTenant = await db.tenant.findUnique({
      where: { slug: this.SOFTLAB_TENANT_SLUG },
    });

    if (!softlabTenant) {
      softlabTenant = await db.tenant.create({
        data: {
          slug: this.SOFTLAB_TENANT_SLUG,
          name: "SOFTLAB GLOBAL",
          legalName: "SoftLab Global Technologies Pvt Ltd",
          gstin: "09AFYFS5388G1ZX",
          planTier: TenantPlanTier.ENTERPRISE,
          status: TenantStatus.ACTIVE,
          maxUsers: 500,
          maxStorageGb: 1000,
          monthlyAiMinutesLimit: 50000,
          themePrimaryColor: "#10B981",
          timeZone: "Asia/Kolkata",
        },
      });
    }

    // Default Branches
    const defaultBranches = [
      { code: "PRAYAGRAJ_HQ", name: "Prayagraj Head Campus", city: "Prayagraj", state: "Uttar Pradesh", latitude: 25.4358, longitude: 81.8463, geofenceRadiusMeters: 200 },
      { code: "NOIDA_CENTER", name: "Noida Tech Center", city: "Noida", state: "Uttar Pradesh", latitude: 28.5355, longitude: 77.3910, geofenceRadiusMeters: 200 },
    ];

    for (const b of defaultBranches) {
      await db.tenantBranch.upsert({
        where: {
          tenantId_code: {
            tenantId: softlabTenant.id,
            code: b.code,
          },
        },
        update: { name: b.name },
        create: {
          tenantId: softlabTenant.id,
          code: b.code,
          name: b.name,
          city: b.city,
          state: b.state,
          latitude: b.latitude,
          longitude: b.longitude,
          geofenceRadiusMeters: b.geofenceRadiusMeters,
        },
      });
    }

    // Default Departments
    const defaultDepartments = [
      { code: "SALES", name: "Sales & Outreach" },
      { code: "ADMISSIONS", name: "Admissions & Counseling" },
      { code: "HR", name: "Human Resources & People Ops" },
      { code: "PLACEMENT", name: "Placement & Corporate Relations" },
      { code: "SUPPORT", name: "Customer & Technical Support" },
      { code: "OPERATIONS", name: "Operations & Administration" },
      { code: "TECH", name: "Technology & Software Engineering" },
      { code: "MANAGEMENT", name: "Executive Leadership" },
    ];

    for (const d of defaultDepartments) {
      await db.tenantDepartment.upsert({
        where: {
          tenantId_code: {
            tenantId: softlabTenant.id,
            code: d.code,
          },
        },
        update: { name: d.name },
        create: {
          tenantId: softlabTenant.id,
          code: d.code,
          name: d.name,
        },
      });
    }

    // Backfill any orphaned users without tenantId to TENANT-0
    await db.user.updateMany({
      where: { tenantId: null },
      data: { tenantId: softlabTenant.id },
    });

    return softlabTenant;
  }

  /**
   * Provision a brand-new commercial tenant for external SaaS clients
   */
  static async provisionCommercialTenant(input: CreateTenantInput) {
    const existing = await db.tenant.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Tenant slug '${input.slug}' is already taken. Please select another company identifier.`,
      });
    }

    const tier = input.planTier || TenantPlanTier.STARTER;
    const maxUsers = tier === TenantPlanTier.STARTER ? 10 : tier === TenantPlanTier.PROFESSIONAL ? 50 : 250;
    const maxStorageGb = tier === TenantPlanTier.STARTER ? 15 : tier === TenantPlanTier.PROFESSIONAL ? 100 : 500;
    const monthlyAiMinutes = tier === TenantPlanTier.STARTER ? 300 : tier === TenantPlanTier.PROFESSIONAL ? 2000 : 10000;

    const tenant = await db.tenant.create({
      data: {
        slug: input.slug.toLowerCase().trim(),
        name: input.name,
        legalName: input.legalName,
        gstin: input.gstin,
        planTier: tier,
        status: TenantStatus.ACTIVE,
        maxUsers,
        maxStorageGb,
        monthlyAiMinutesLimit: monthlyAiMinutes,
        customDomain: input.customDomain,
        branches: {
          create: {
            code: "MAIN_OFFICE",
            name: `${input.name} Main Office`,
            country: "India",
          },
        },
        departments: {
          createMany: {
            data: [
              { code: "SALES", name: "Sales" },
              { code: "SUPPORT", name: "Support" },
              { code: "OPERATIONS", name: "Operations" },
              { code: "MANAGEMENT", name: "Management" },
            ],
          },
        },
      },
      include: {
        branches: true,
        departments: true,
      },
    });

    // Create Tenant Admin User
    const adminUser = await db.user.create({
      data: {
        tenantId: tenant.id,
        tenantBranchId: tenant.branches[0]?.id,
        tenantDepartmentId: tenant.departments.find((d) => d.code === "MANAGEMENT")?.id,
        email: input.adminEmail.toLowerCase().trim(),
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        phone: input.adminPhone,
        passwordHash: input.adminPasswordHash,
        roleCode: "SUPER_ADMIN",
      },
    });

    return {
      tenant,
      adminUser,
    };
  }

  /**
   * Retrieves comprehensive tenant metrics, quota limits, and usage details
   */
  static async getTenantOverview(tenantId: string) {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          select: { id: true, code: true, name: true, city: true, isActive: true },
        },
        departments: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        _count: {
          select: {
            users: true,
            callLogs: true,
            callRecordings: true,
            dailyReports: true,
            deviceRegistrations: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found." });
    }

    return {
      tenant,
      quota: {
        users: { current: tenant._count.users, max: tenant.maxUsers },
        storageGb: { max: tenant.maxStorageGb },
        aiMinutes: { current: tenant.usedAiMinutesCurrentMonth, max: tenant.monthlyAiMinutesLimit },
      },
    };
  }

  /**
   * Enforces tenant operational quotas
   */
  static async checkQuota(tenantId: string, resource: "USERS" | "AI_MINUTES") {
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: {
        maxUsers: true,
        monthlyAiMinutesLimit: true,
        usedAiMinutesCurrentMonth: true,
        _count: { select: { users: true } },
      },
    });

    if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found." });

    if (resource === "USERS" && tenant._count.users >= tenant.maxUsers) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Tenant has reached the maximum allowed user seats (${tenant.maxUsers}). Please upgrade your SaaS plan.`,
      });
    }

    if (resource === "AI_MINUTES" && tenant.usedAiMinutesCurrentMonth >= tenant.monthlyAiMinutesLimit) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Tenant has exhausted the monthly AI transcription and summary minutes quota (${tenant.monthlyAiMinutesLimit} mins).`,
      });
    }

    return true;
  }
}
