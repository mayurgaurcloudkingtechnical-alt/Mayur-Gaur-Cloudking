import { router, publicProcedure, protectedProcedure } from "../init";
import { z } from "zod";
import { ImsService } from "@/server/services/ims.service";
import { AuthenticatedUser } from "@/server/auth/rbac";

function asAuthUser(user: any): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email || "",
    roleCode: user.roleCode,
    permissions: user.permissions || [],
    firstName: user.firstName || "",
    lastName: user.lastName || "",
  };
}

const boqItemSchema = z.object({
  id: z.string(),
  catalogueCode: z.string(),
  description: z.string().min(1),
  category: z.enum([
    "CAMERAS_SURVEILLANCE",
    "SERVERS_COMPUTERS",
    "NETWORKING_DEVICES",
    "BIOMETRIC_ACCESS",
    "CABLES_WIRES",
    "CONNECTORS_CONDUITS_ACCESSORIES",
    "RACKS_PATCH_STORAGE",
    "INSTALLATION_LABOUR",
    "CONFIG_COMMISSIONING",
    "SURVEY_LOGISTICS",
    "AMC_SUPPORT",
  ]),
  quantity: z.number().min(1),
  unit: z.string(),
  hsnSacCode: z.string(),
  supplierUnitCost: z.number().nullable(),
  unitPrice: z.number().nullable(),
  gstPercent: z.number().min(0).max(28),
  requiresSiteVerification: z.boolean(),
  pricePending: z.boolean(),
  remarks: z.string().optional(),
});

export const imsRouter = router({
  // ==========================================================================
  // PUBLIC PROCEDURES
  // ==========================================================================

  submitRequirement: publicProcedure
    .input(
      z.object({
        selectedServices: z.array(z.string()).min(1, "Select at least one IMS service"),
        engagementType: z.enum(["NEW_INSTALLATION", "EXPANSION", "REPAIR", "REPLACEMENT", "AMC"]),
        fullName: z.string().min(2, "Full name is required"),
        companyName: z.string().optional(),
        email: z.string().email("Valid email address is required"),
        phone: z.string().min(10, "Valid 10-digit phone number is required"),
        city: z.string().min(2, "City / project location is required"),
        siteAddress: z.string().min(3, "Site address is required"),
        siteType: z.string().default("Commercial Office"),
        buildingFloors: z.number().min(1).max(100).default(1),
        approxCableLengthMeters: z.number().min(0).optional(),
        ipCameraCount: z.number().min(0).optional(),
        hdCameraCount: z.number().min(0).optional(),
        recordingRetentionDays: z.number().min(1).optional(),
        serverCount: z.number().min(0).optional(),
        serverType: z.string().optional(),
        computerCount: z.number().min(0).optional(),
        upsRequired: z.boolean().optional(),
        networkPointsCount: z.number().min(0).optional(),
        wifiAccessPointsCount: z.number().min(0).optional(),
        biometricCount: z.number().min(0).optional(),
        doorAccessCount: z.number().min(0).optional(),
        videoDoorPhoneCount: z.number().min(0).optional(),
        preferredBrands: z.string().optional(),
        technicalRequirements: z.string().optional(),
        timeline: z.string().optional(),
        budgetRange: z.string().optional(),
        additionalNotes: z.string().optional(),
        attachments: z
          .array(
            z.object({
              fileName: z.string(),
              fileSize: z.number(),
              dataUrl: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      return ImsService.submitImsRequirement(input);
    }),

  // ==========================================================================
  // PROTECTED ADMIN / MANAGEMENT PROCEDURES
  // ==========================================================================

  getAdminDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const actor = asAuthUser(ctx.user);
    const [enquiries, quotations, catalogue, rules, projectsAmc] = await Promise.all([
      ImsService.listImsEnquiries(actor),
      ImsService.listQuotations(actor),
      ImsService.getCatalogue(actor),
      ImsService.getEstimationRules(),
      ImsService.listProjectsAndAmc(actor),
    ]);

    return {
      enquiries,
      quotations,
      catalogue,
      rules,
      projectsAmc,
    };
  }),

  updateEnquiryStatus: protectedProcedure
    .input(
      z.object({
        enquiryNumber: z.string(),
        status: z.enum([
          "NEW",
          "SITE_SURVEY_SCHEDULED",
          "BOQ_PREPARED",
          "QUOTATION_SENT",
          "APPROVED",
          "IN_INSTALLATION",
          "COMPLETED",
          "AMC_ACTIVE",
          "CLOSED",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ImsService.updateImsEnquiryStatus(
        asAuthUser(ctx.user),
        input.enquiryNumber,
        input.status
      );
    }),

  saveQuotation: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        version: z.string().optional(),
        items: z.array(boqItemSchema),
        discountPercent: z.number().min(0).max(100).default(0),
        scopeOfWork: z.string(),
        assumptionsAndExclusions: z.string(),
        warrantyAndAmcTerms: z.string(),
        paymentTerms: z.string(),
        validityDays: z.number().min(1).max(180).default(15),
        approveNow: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ImsService.saveQuotation(asAuthUser(ctx.user), input);
    }),

  upsertCatalogueItem: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        code: z.string().min(2),
        name: z.string().min(2),
        category: z.enum([
          "CAMERAS_SURVEILLANCE",
          "SERVERS_COMPUTERS",
          "NETWORKING_DEVICES",
          "BIOMETRIC_ACCESS",
          "CABLES_WIRES",
          "CONNECTORS_CONDUITS_ACCESSORIES",
          "RACKS_PATCH_STORAGE",
          "INSTALLATION_LABOUR",
          "CONFIG_COMMISSIONING",
          "SURVEY_LOGISTICS",
          "AMC_SUPPORT",
        ]),
        unit: z.enum(["Nos", "Meters", "Roll (305m)", "Points", "Lot", "Visit", "Year"]),
        hsnSacCode: z.string(),
        supplierCost: z.number().nullable(),
        sellingPrice: z.number().nullable(),
        gstPercent: z.number().min(0).max(28),
        priceStatus: z.enum(["VERIFIED_CONFIGURED", "PENDING_MANAGEMENT_INPUT"]),
        requiresSiteVerificationDefault: z.boolean(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ImsService.upsertCatalogueItem(asAuthUser(ctx.user), input);
    }),

  updateEstimationRules: protectedProcedure
    .input(
      z.object({
        avgCableMetersPerCamera: z.number().min(1),
        avgCableMetersPerNetworkPoint: z.number().min(1),
        avgCableMetersPerBiometric: z.number().min(1),
        floorCableMultiplierPercent: z.number().min(0),
        conduitMetersPerCableMeter: z.number().min(0),
        bncConnectorsPerHdCamera: z.number().min(1),
        dcConnectorsPerHdCamera: z.number().min(1),
        rj45JacksPerIpCamera: z.number().min(1),
        rj45JacksPerNetworkPoint: z.number().min(1),
        switchPortBufferPercent: z.number().min(0),
        defaultGstPercent: z.number().min(0).max(28),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ImsService.updateEstimationRules(asAuthUser(ctx.user), input);
    }),

  upsertProjectOrAmc: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        referenceNumber: z.string(),
        enquiryNumber: z.string(),
        quotationNumber: z.string().optional(),
        customerName: z.string().min(2),
        companyName: z.string(),
        phone: z.string(),
        email: z.string(),
        siteLocation: z.string(),
        servicesScope: z.array(z.string()),
        recordType: z.enum(["INSTALLATION_PROJECT", "AMC_CONTRACT"]),
        status: z.enum([
          "SITE_SURVEY_PENDING",
          "MATERIAL_PROCUREMENT",
          "INSTALLATION_IN_PROGRESS",
          "COMMISSIONED",
          "AMC_ACTIVE",
          "RENEWAL_DUE",
          "EXPIRED",
        ]),
        assignedEngineer: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        nextPreventiveMaintenanceDate: z.string().optional(),
        totalVisitsPerYear: z.number().optional(),
        completedVisits: z.number().optional(),
        contractValue: z.number().nullable().optional(),
        notes: z.string().optional(),
        updatedAt: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ImsService.upsertProjectOrAmc(asAuthUser(ctx.user), input);
    }),
});
