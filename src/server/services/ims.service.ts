import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import { ServiceEnquiryStatus, UserRoleCode } from "@prisma/client";
import {
  DEFAULT_IMS_CATALOGUE_ITEMS,
  DEFAULT_IMS_ESTIMATION_RULES,
  ImsBoqLineItem,
  ImsCatalogueItem,
  ImsEstimationRules,
  ImsRequirementInput,
  generateProvisionalBoqFromRequirements,
} from "@/lib/constants/ims-catalog";

export interface ImsQuotationRecord {
  id: string;
  quotationNumber: string; // SLG/IMS/QTN/2026/XXXX
  version: string; // e.g., "v1.0"
  enquiryNumber: string; // IMS-2026-XXXX
  enquiryId: string;
  status: "PROVISIONAL_ESTIMATE" | "PENDING_APPROVAL" | "APPROVED_FINAL_QUOTE" | "SENT_TO_CLIENT";
  customerName: string;
  companyName: string;
  email: string;
  phone: string;
  city: string;
  siteAddress: string;
  siteType: string;
  engagementType: string;
  selectedServices: string[];
  items: ImsBoqLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  grandTotal: number;
  hasPendingPrices: boolean;
  hasSiteVerificationItems: boolean;
  scopeOfWork: string;
  assumptionsAndExclusions: string;
  warrantyAndAmcTerms: string;
  paymentTerms: string;
  validityDays: number;
  approvedById?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImsProjectAmcRecord {
  id: string;
  referenceNumber: string;
  contractNumber?: string;
  enquiryNumber: string;
  quotationNumber?: string;
  customerName: string;
  clientName?: string;
  companyName: string;
  company?: string;
  phone: string;
  email: string;
  siteLocation: string;
  servicesScope: string[];
  recordType: "INSTALLATION_PROJECT" | "AMC_CONTRACT";
  status: "SITE_SURVEY_PENDING" | "MATERIAL_PROCUREMENT" | "INSTALLATION_IN_PROGRESS" | "COMMISSIONED" | "AMC_ACTIVE" | "RENEWAL_DUE" | "EXPIRED";
  assignedEngineer: string;
  startDate: string;
  endDate: string;
  nextPreventiveMaintenanceDate?: string;
  nextPreventiveVisitDate?: string;
  totalVisitsPerYear?: number;
  completedVisits?: number;
  contractValue?: number | null;
  annualContractValue?: number | null;
  notes?: string;
  updatedAt: string;
}

export type ImsEnquiryRecord = ImsEnquiryExtendedRecord;

export interface ImsEnquiryExtendedRecord {
  id: string;
  enquiryNumber: string;
  referenceNumber?: string;
  serviceEnquiryId: string;
  quotationId: string;
  quotationNumber: string;
  status:
    | "NEW"
    | "SITE_SURVEY_SCHEDULED"
    | "BOQ_PREPARED"
    | "QUOTATION_SENT"
    | "APPROVED"
    | "IN_INSTALLATION"
    | "COMPLETED"
    | "AMC_ACTIVE"
    | "CLOSED";
  requirements: ImsRequirementInput;
  customer?: {
    name: string;
    company?: string;
    city: string;
    phone: string;
    email: string;
  };
  quotation?: any;
  createdAt: string;
  updatedAt: string;
}

const KEY_CATALOGUE = "ims:catalogue";
const KEY_RULES = "ims:estimation_rules";
const KEY_ENQUIRIES = "ims:enquiries_list";
const KEY_QUOTATIONS = "ims:quotations_list";
const KEY_PROJECTS_AMC = "ims:projects_amc_list";

const PRICING_ADMIN_ROLES: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
];

const IMS_VIEW_ROLES: UserRoleCode[] = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.COUNSELOR,
];

export class ImsService {
  private static assertAccess(user: AuthenticatedUser, requirePricingAuth = false) {
    const allowed = requirePricingAuth ? PRICING_ADMIN_ROLES : IMS_VIEW_ROLES;
    if (!allowed.includes(user.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: requirePricingAuth
          ? "Only authorized management (Director / Admin) may modify pricing, discounts, or approve quotations."
          : "You do not have permission to access the IMS module.",
      });
    }
  }

  private static async getSetting<T>(key: string, defaultVal: T): Promise<T> {
    const row = await db.systemSetting.findUnique({ where: { key } });
    if (!row || row.value === null || row.value === undefined) {
      return defaultVal;
    }
    return row.value as unknown as T;
  }

  private static async setSetting<T>(key: string, value: T, updatedBy?: string): Promise<void> {
    await db.systemSetting.upsert({
      where: { key },
      update: {
        value: value as any,
        category: "IMS",
        updatedBy: updatedBy || "SYSTEM",
      },
      create: {
        key,
        value: value as any,
        category: "IMS",
        isSecret: false,
        updatedBy: updatedBy || "SYSTEM",
      },
    });
  }

  // ==========================================================================
  // 1. CONFIGURABLE CATALOGUE & ESTIMATION RULES
  // ==========================================================================

  static async getCatalogue(user?: AuthenticatedUser): Promise<ImsCatalogueItem[]> {
    const items = await this.getSetting<ImsCatalogueItem[]>(KEY_CATALOGUE, DEFAULT_IMS_CATALOGUE_ITEMS);
    const canViewConfidentialCost = user && PRICING_ADMIN_ROLES.includes(user.roleCode);
    if (!canViewConfidentialCost) {
      return items.map((item) => ({ ...item, supplierCost: null }));
    }
    return items;
  }

  static async upsertCatalogueItem(user: AuthenticatedUser, item: ImsCatalogueItem) {
    this.assertAccess(user, true);
    const items = await this.getSetting<ImsCatalogueItem[]>(KEY_CATALOGUE, DEFAULT_IMS_CATALOGUE_ITEMS);
    const idx = items.findIndex((i) => i.id === item.id || i.code === item.code);

    const updatedItem: ImsCatalogueItem = {
      ...item,
      priceStatus:
        item.sellingPrice !== null && item.sellingPrice > 0
          ? "VERIFIED_CONFIGURED"
          : "PENDING_MANAGEMENT_INPUT",
    };

    if (idx >= 0) {
      items[idx] = updatedItem;
    } else {
      items.push(updatedItem);
    }

    await this.setSetting(KEY_CATALOGUE, items, user.email);
    return updatedItem;
  }

  static async getEstimationRules(): Promise<ImsEstimationRules> {
    return this.getSetting<ImsEstimationRules>(KEY_RULES, DEFAULT_IMS_ESTIMATION_RULES);
  }

  static async updateEstimationRules(user: AuthenticatedUser, rules: ImsEstimationRules) {
    this.assertAccess(user, true);
    await this.setSetting(KEY_RULES, rules, user.email);
    return rules;
  }

  // ==========================================================================
  // 2. PUBLIC IMS REQUIREMENT SUBMISSION & AUTO-PROVISIONAL BOQ GENERATION
  // ==========================================================================

  private static async generateUniqueRef(prefix: string): Promise<string> {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${year}-${rand}`;
  }

  static async submitImsRequirement(input: ImsRequirementInput) {
    const cleanPhone = input.phone.trim();
    const cleanEmail = input.email.trim().toLowerCase();

    // Spam & duplicate check within last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentDuplicate = await db.serviceEnquiry.findFirst({
      where: {
        phone: cleanPhone,
        email: cleanEmail,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentDuplicate) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Your requirement was already registered under reference ${recentDuplicate.enquiryNumber}. Please wait a moment before submitting again.`,
      });
    }

    const enquiryNumber = await this.generateUniqueRef("IMS");
    const year = new Date().getFullYear();
    const qtnRand = Math.floor(1000 + Math.random() * 9000);
    const quotationNumber = `SLG/IMS/QTN/${year}/${qtnRand}`;

    // Load current catalogue & rules
    const [catalogue, rules] = await Promise.all([
      this.getSetting<ImsCatalogueItem[]>(KEY_CATALOGUE, DEFAULT_IMS_CATALOGUE_ITEMS),
      this.getEstimationRules(),
    ]);

    // Generate provisional itemized BOQ
    const boq = generateProvisionalBoqFromRequirements(input, catalogue, rules);

    // Format readable summary for backward compatibility with existing ServiceEnquiry table
    const readableSummary = [
      `[IMS Division Requirement — ${input.engagementType}]`,
      `Selected Services: ${input.selectedServices.join(", ")}`,
      `Location: ${input.siteAddress}, ${input.city} (${input.siteType}, ${input.buildingFloors} Floor(s))`,
      input.ipCameraCount || input.hdCameraCount
        ? `CCTV: ${input.ipCameraCount || 0} IP Cameras, ${input.hdCameraCount || 0} HD Cameras (${input.recordingRetentionDays || 30} days storage)`
        : null,
      input.serverCount ? `Servers: ${input.serverCount} (${input.serverType || "Standard"})` : null,
      input.computerCount ? `Computers/Lab Nodes: ${input.computerCount} (UPS: ${input.upsRequired ? "Yes" : "No"})` : null,
      input.networkPointsCount || input.wifiAccessPointsCount
        ? `Networking: ${input.networkPointsCount || 0} LAN Points, ${input.wifiAccessPointsCount || 0} Wi-Fi APs`
        : null,
      input.biometricCount || input.doorAccessCount
        ? `Access Control: ${input.biometricCount || 0} Biometrics, ${input.doorAccessCount || 0} Door Locks`
        : null,
      input.approxCableLengthMeters ? `Approx. Cable Run: ${input.approxCableLengthMeters} Meters` : null,
      input.preferredBrands ? `Preferred Brands: ${input.preferredBrands}` : null,
      input.technicalRequirements ? `Tech Specs: ${input.technicalRequirements}` : null,
      input.timeline ? `Timeline: ${input.timeline}` : null,
      input.budgetRange ? `Budget Range: ${input.budgetRange}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    // 1. Save in existing ServiceEnquiry table (backward-compatible integration)
    const serviceEnquiry = await db.serviceEnquiry.create({
      data: {
        enquiryNumber,
        fullName: input.fullName.trim(),
        companyName: input.companyName?.trim() || null,
        phone: cleanPhone,
        email: cleanEmail,
        city: input.city.trim(),
        serviceCategoryCode: "IMS_INFRASTRUCTURE",
        packageName: input.selectedServices.slice(0, 3).join(", "),
        requirement: readableSummary,
        preferredContact: "PHONE",
        message: input.additionalNotes?.trim() || null,
        source: "Website — IMS Quote Request",
        status: ServiceEnquiryStatus.QUOTE_REQUESTED,
      },
    });

    await db.serviceEnquiryActivity.create({
      data: {
        enquiryId: serviceEnquiry.id,
        actorName: "IMS Quotation Engine",
        action: "IMS_BOQ_GENERATED",
        details: `Generated provisional BOQ ${quotationNumber} with ${boq.items.length} line items for ${enquiryNumber}.`,
      },
    });

    const nowIso = new Date().toISOString();
    const quotationId = `qtn-${Date.now()}`;

    // 2. Create Quotation Record
    const quotationRecord: ImsQuotationRecord = {
      id: quotationId,
      quotationNumber,
      version: "v1.0 (Provisional)",
      enquiryNumber,
      enquiryId: serviceEnquiry.id,
      status: "PROVISIONAL_ESTIMATE",
      customerName: input.fullName.trim(),
      companyName: input.companyName?.trim() || "Individual / Institutional Client",
      email: cleanEmail,
      phone: cleanPhone,
      city: input.city.trim(),
      siteAddress: input.siteAddress.trim(),
      siteType: input.siteType,
      engagementType: input.engagementType,
      selectedServices: input.selectedServices,
      items: boq.items,
      subtotal: boq.subtotal,
      discountPercent: 0,
      discountAmount: 0,
      taxableAmount: boq.subtotal,
      gstAmount: boq.gstAmount,
      grandTotal: boq.grandTotal,
      hasPendingPrices: boq.hasPendingPrices,
      hasSiteVerificationItems: boq.hasSiteVerificationItems,
      scopeOfWork:
        "Supply, installation, structured cabling, termination, rack dressing, system configuration, testing, and commissioning of the selected IT Infrastructure & Managed Services at the specified project location.",
      assumptionsAndExclusions:
        "1. Cable, conduit, and trunking quantities are provisional estimates; final billing will be based on actual measured site runs.\n2. Civil core-cutting, scaffolding above 12ft, and main electrical power sockets (230V AC) at rack/equipment locations are to be provided by the client unless explicitly itemized.\n3. Unconfigured hardware unit prices require final brand/model selection and management verification.",
      warrantyAndAmcTerms:
        "1. All active hardware carries standard OEM manufacturer warranty (1 to 3 years as applicable).\n2. Installation workmanship is covered for 90 days from commissioning.\n3. Optional comprehensive/non-comprehensive Annual Maintenance Contract (AMC) available post-warranty.",
      paymentTerms:
        "60% Advance along with Purchase Order (PO) against material delivery at site | 30% upon physical installation & cabling completion | 10% upon final testing, commissioning & handover.",
      validityDays: 15,
      approvedById: null,
      approvedByName: null,
      approvedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const enquiryRecord: ImsEnquiryExtendedRecord = {
      id: `imsenq-${Date.now()}`,
      enquiryNumber,
      serviceEnquiryId: serviceEnquiry.id,
      quotationId,
      quotationNumber,
      status: "NEW",
      requirements: input,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const [enquiriesList, quotationsList] = await Promise.all([
      this.getSetting<ImsEnquiryExtendedRecord[]>(KEY_ENQUIRIES, []),
      this.getSetting<ImsQuotationRecord[]>(KEY_QUOTATIONS, []),
    ]);

    enquiriesList.unshift(enquiryRecord);
    quotationsList.unshift(quotationRecord);

    await Promise.all([
      this.setSetting(KEY_ENQUIRIES, enquiriesList, input.email),
      this.setSetting(KEY_QUOTATIONS, quotationsList, input.email),
    ]);

    return {
      enquiryNumber,
      quotationNumber,
      quotationId,
      status: quotationRecord.status,
      hasPendingPrices: quotationRecord.hasPendingPrices,
      hasSiteVerificationItems: quotationRecord.hasSiteVerificationItems,
      itemCount: quotationRecord.items.length,
      provisionalItems: quotationRecord.items.map((i) => ({
        catalogueCode: i.catalogueCode,
        description: i.description,
        quantity: i.quantity,
        unit: i.unit,
        unitPrice: i.unitPrice,
        requiresSiteVerification: i.requiresSiteVerification,
        pricePending: i.pricePending,
      })),
    };
  }

  // ==========================================================================
  // 3. ADMIN ENQUIRIES, QUOTATIONS & BOQ APPROVAL
  // ==========================================================================

  static async listImsEnquiries(user: AuthenticatedUser) {
    this.assertAccess(user, false);
    const [enquiries, quotations] = await Promise.all([
      this.getSetting<ImsEnquiryExtendedRecord[]>(KEY_ENQUIRIES, []),
      this.getSetting<ImsQuotationRecord[]>(KEY_QUOTATIONS, []),
    ]);

    return enquiries.map((e) => {
      const q = quotations.find((quot) => quot.id === e.quotationId || quot.enquiryNumber === e.enquiryNumber);
      return {
        ...e,
        referenceNumber: e.enquiryNumber,
        customer: {
          name: e.requirements?.fullName || "Prospective Client",
          company: e.requirements?.companyName,
          city: e.requirements?.city || "Prayagraj",
          phone: e.requirements?.phone || "",
          email: e.requirements?.email || "",
        },
        quotation: q || {
          id: e.quotationId,
          quotationNumber: e.quotationNumber,
          status: "DRAFT",
          lineItems: [],
          subtotalExclTax: 0,
          gstTotal: 0,
          grandTotal: 0,
          discountPercent: 0,
          scopeOfWork: "",
          assumptionsAndExclusions: "",
          warrantyAndAmcTerms: "",
          paymentTerms: "",
        },
      };
    });
  }

  static async updateImsEnquiryStatus(
    user: AuthenticatedUser,
    enquiryNumber: string,
    status: ImsEnquiryExtendedRecord["status"]
  ) {
    this.assertAccess(user, false);
    const list = await this.getSetting<ImsEnquiryExtendedRecord[]>(KEY_ENQUIRIES, []);
    const idx = list.findIndex((e) => e.enquiryNumber === enquiryNumber);
    if (idx === -1) {
      throw new TRPCError({ code: "NOT_FOUND", message: "IMS Enquiry not found." });
    }
    list[idx].status = status;
    list[idx].updatedAt = new Date().toISOString();
    await this.setSetting(KEY_ENQUIRIES, list, user.email);
    return list[idx];
  }

  static async listQuotations(user: AuthenticatedUser): Promise<ImsQuotationRecord[]> {
    this.assertAccess(user, false);
    const list = await this.getSetting<ImsQuotationRecord[]>(KEY_QUOTATIONS, []);
    const canViewCost = PRICING_ADMIN_ROLES.includes(user.roleCode);
    if (!canViewCost) {
      return list.map((q) => ({
        ...q,
        items: q.items.map((item) => ({ ...item, supplierUnitCost: null })),
      }));
    }
    return list;
  }

  static async saveQuotation(
    user: AuthenticatedUser,
    input: {
      id: string;
      version?: string;
      items: ImsBoqLineItem[];
      discountPercent: number;
      scopeOfWork: string;
      assumptionsAndExclusions: string;
      warrantyAndAmcTerms: string;
      paymentTerms: string;
      validityDays: number;
      approveNow?: boolean;
    }
  ) {
    this.assertAccess(user, true);
    const list = await this.getSetting<ImsQuotationRecord[]>(KEY_QUOTATIONS, []);
    const idx = list.findIndex((q) => q.id === input.id);
    if (idx === -1) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Quotation record not found." });
    }

    const existing = list[idx];

    // Recalculate totals accurately
    let subtotal = 0;
    let hasPendingPrices = false;
    let hasSiteVerificationItems = false;

    const normalizedItems: ImsBoqLineItem[] = input.items.map((item) => {
      const pricePending = item.unitPrice === null || item.unitPrice <= 0;
      if (pricePending) hasPendingPrices = true;
      if (item.requiresSiteVerification) hasSiteVerificationItems = true;
      if (!pricePending && item.unitPrice) {
        subtotal += item.quantity * item.unitPrice;
      }
      return {
        ...item,
        pricePending,
      };
    });

    const discountPercent = Math.min(100, Math.max(0, input.discountPercent || 0));
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // Compute weighted GST across priced items after discount ratio
    const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;
    let gstAmount = 0;
    for (const item of normalizedItems) {
      if (!item.pricePending && item.unitPrice) {
        const discountedLine = item.quantity * item.unitPrice * discountRatio;
        gstAmount += Math.round((discountedLine * (item.gstPercent || 18)) / 100);
      }
    }

    const grandTotal = taxableAmount + gstAmount;

    if (input.approveNow && hasPendingPrices) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Cannot approve a final commercial quotation while one or more line items have pending/unverified prices. Please enter verified unit prices for all items first.",
      });
    }

    const nowIso = new Date().toISOString();
    const newStatus: ImsQuotationRecord["status"] = input.approveNow
      ? "APPROVED_FINAL_QUOTE"
      : hasPendingPrices
      ? "PROVISIONAL_ESTIMATE"
      : "PENDING_APPROVAL";

    const updated: ImsQuotationRecord = {
      ...existing,
      version: input.version || (input.approveNow ? "v2.0 (Final Approved)" : existing.version),
      status: newStatus,
      items: normalizedItems,
      subtotal,
      discountPercent,
      discountAmount,
      taxableAmount,
      gstAmount,
      grandTotal,
      hasPendingPrices,
      hasSiteVerificationItems,
      scopeOfWork: input.scopeOfWork,
      assumptionsAndExclusions: input.assumptionsAndExclusions,
      warrantyAndAmcTerms: input.warrantyAndAmcTerms,
      paymentTerms: input.paymentTerms,
      validityDays: input.validityDays,
      approvedById: input.approveNow ? user.id : existing.approvedById,
      approvedByName: input.approveNow
        ? `${user.firstName} ${user.lastName}`.trim() || user.email
        : existing.approvedByName,
      approvedAt: input.approveNow ? nowIso : existing.approvedAt,
      updatedAt: nowIso,
    };

    list[idx] = updated;
    await this.setSetting(KEY_QUOTATIONS, list, user.email);

    // Sync ServiceEnquiry estimatedBudget if grandTotal > 0
    if (grandTotal > 0 && existing.enquiryId) {
      await db.serviceEnquiry
        .update({
          where: { id: existing.enquiryId },
          data: {
            estimatedBudget: grandTotal,
            status: input.approveNow ? ServiceEnquiryStatus.QUOTATION_SENT : undefined,
          },
        })
        .catch(() => undefined);
    }

    return updated;
  }

  // ==========================================================================
  // 4. PROJECTS, INSTALLATIONS & AMC CONTRACT TRACKING
  // ==========================================================================

  static async listProjectsAndAmc(user: AuthenticatedUser): Promise<ImsProjectAmcRecord[]> {
    this.assertAccess(user, false);
    return this.getSetting<ImsProjectAmcRecord[]>(KEY_PROJECTS_AMC, []);
  }

  static async upsertProjectOrAmc(user: AuthenticatedUser, record: ImsProjectAmcRecord) {
    this.assertAccess(user, true);
    const list = await this.getSetting<ImsProjectAmcRecord[]>(KEY_PROJECTS_AMC, []);
    const idx = list.findIndex((r) => r.id === record.id);
    const updated = { ...record, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updated;
    } else {
      list.unshift(updated);
    }
    await this.setSetting(KEY_PROJECTS_AMC, list, user.email);
    return updated;
  }
}
