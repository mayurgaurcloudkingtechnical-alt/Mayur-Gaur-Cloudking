import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import { UserRoleCode, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { EmailService } from "./email.service";

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

export interface CreateStaffingInvoiceInput {
  partnerId?: string;
  companyName: string;
  companyGst?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;

  candidateName: string;
  candidateEmail?: string;
  candidatePhone?: string;
  position: string;
  joinedDate?: string | Date;
  annualCtc: number; // in INR (e.g. 600000)
  feePercentage?: number; // 8.33 to 12.0
  sacCode?: string; // default "998512"
  authorizedBy?: string; // default "Harsh Shukla"
  dueDate?: string | Date;
  notes?: string;
}

export interface UpdateStaffingInvoiceStatusInput {
  invoiceId: string;
  status: "UNPAID" | "PAID" | "PARTIALLY_PAID" | "CANCELLED";
  paymentMode?: string;
  transactionRef?: string;
  paidAt?: string | Date;
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

  /**
   * Create a GST-compliant Corporate Staffing Invoice for candidate placement fulfillment
   */
  static async createStaffingInvoice(actor: AuthenticatedUser, input: CreateStaffingInvoiceInput) {
    this.checkCanManage(actor);

    if (!input.companyName.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Company name is required." });
    }
    if (!input.candidateName.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Candidate name is required." });
    }
    if (!input.position.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Designation / Position is required." });
    }
    if (!input.annualCtc || input.annualCtc <= 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "A valid annual CTC is required." });
    }

    const feePercentage = input.feePercentage && input.feePercentage > 0 ? Number(input.feePercentage) : 8.33;
    const baseAmount = Math.round(input.annualCtc * (feePercentage / 100));
    const gstRate = 18.0;
    const totalTaxAmount = Math.round(baseAmount * (gstRate / 100));

    // Determine state for GST split (Default SoftLab HQ is Uttar Pradesh)
    const state = (input.companyState || "").trim().toLowerCase();
    const isUP = state.includes("uttar pradesh") || state === "up" || state === "";
    const cgstAmount = isUP ? Math.round(totalTaxAmount / 2) : 0;
    const sgstAmount = isUP ? totalTaxAmount - cgstAmount : 0;
    const igstAmount = isUP ? 0 : totalTaxAmount;
    const grandTotal = baseAmount + totalTaxAmount;

    // Generate Invoice Number
    const year = new Date().getFullYear();
    const count = await db.corporateStaffingInvoice.count();
    const invoiceNumber = `SLG-INV-STF-${year}-${String(count + 1).padStart(4, "0")}`;

    const joinedDate = input.joinedDate ? new Date(input.joinedDate) : new Date();
    const dueDate = input.dueDate
      ? new Date(input.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days corporate payment terms

    const invoice = await db.corporateStaffingInvoice.create({
      data: {
        invoiceNumber,
        partnerId: input.partnerId || null,
        companyName: input.companyName.trim(),
        companyGst: input.companyGst?.trim() || null,
        companyAddress: input.companyAddress?.trim() || null,
        companyCity: input.companyCity?.trim() || null,
        companyState: input.companyState?.trim() || "Uttar Pradesh",
        contactPerson: input.contactPerson?.trim() || null,
        contactEmail: input.contactEmail?.trim().toLowerCase() || null,
        contactPhone: input.contactPhone?.trim() || null,
        candidateName: input.candidateName.trim(),
        candidateEmail: input.candidateEmail?.trim().toLowerCase() || null,
        candidatePhone: input.candidatePhone?.trim() || null,
        position: input.position.trim(),
        joinedDate,
        annualCtc: input.annualCtc,
        feePercentage,
        baseAmount,
        sacCode: input.sacCode?.trim() || "998512",
        gstRate,
        cgstAmount,
        sgstAmount,
        igstAmount,
        totalTaxAmount,
        grandTotal,
        status: "UNPAID",
        dueDate,
        notes: input.notes?.trim() || null,
        authorizedBy: input.authorizedBy?.trim() || "Harsh Shukla",
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFFING_INVOICE_GENERATED",
      resourceType: "CorporateStaffingInvoice",
      resourceId: invoice.id,
      newData: {
        invoiceNumber: invoice.invoiceNumber,
        companyName: invoice.companyName,
        candidateName: invoice.candidateName,
        grandTotal: invoice.grandTotal,
        feePercentage: invoice.feePercentage,
      },
    });

    return invoice;
  }

  /**
   * List all staffing invoices
   */
  static async listStaffingInvoices() {
    return db.corporateStaffingInvoice.findMany({
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            contactPerson: true,
            contactEmail: true,
            contactPhone: true,
            gstNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get single staffing invoice by ID
   */
  static async getStaffingInvoiceById(id: string) {
    const invoice = await db.corporateStaffingInvoice.findUnique({
      where: { id },
      include: {
        partner: true,
      },
    });

    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staffing invoice not found." });
    }

    return invoice;
  }

  /**
   * Update invoice payment status
   */
  static async updateStaffingInvoiceStatus(actor: AuthenticatedUser, input: UpdateStaffingInvoiceStatusInput) {
    this.checkCanManage(actor);

    const existing = await db.corporateStaffingInvoice.findUnique({
      where: { id: input.invoiceId },
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found." });
    }

    const updated = await db.corporateStaffingInvoice.update({
      where: { id: input.invoiceId },
      data: {
        status: input.status,
        paymentMode: input.paymentMode || existing.paymentMode,
        transactionRef: input.transactionRef || existing.transactionRef,
        paidAt: input.status === "PAID" ? (input.paidAt ? new Date(input.paidAt) : new Date()) : null,
        notes: input.notes ? `${existing.notes ? existing.notes + " | " : ""}${input.notes}` : existing.notes,
      },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFFING_INVOICE_STATUS_UPDATED",
      resourceType: "CorporateStaffingInvoice",
      resourceId: updated.id,
      newData: { status: updated.status, transactionRef: updated.transactionRef },
    });

    return updated;
  }

  /**
   * Dispatch Staffing Invoice to Recruiter Email with formatted breakdown
   */
  static async dispatchStaffingInvoice(actor: AuthenticatedUser, invoiceId: string) {
    this.checkCanManage(actor);

    const invoice = await db.corporateStaffingInvoice.findUnique({
      where: { id: invoiceId },
      include: { partner: true },
    });
    if (!invoice) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Staffing invoice not found." });
    }

    const targetEmail = invoice.contactEmail || invoice.partner?.contactEmail;
    if (!targetEmail) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No email address found for this company/recruiter contact.",
      });
    }

    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(invoice.grandTotal);

    const formattedBase = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(invoice.baseAmount);

    const formattedTax = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(invoice.totalTaxAmount);

    const formattedCtc = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(invoice.annualCtc);

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b;">
        <div style="background: linear-gradient(135deg, #0b3d91 0%, #059669 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">SOFTLAB GLOBAL</h1>
          <p style="color: #a7f3d0; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Corporate Staffing &amp; Talent Fulfillment Tax Invoice</p>
        </div>
        
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #e2e8f0; margin-top: 0;">Dear <strong>${invoice.contactPerson || invoice.companyName}</strong>,</p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            We are pleased to present the official GST Tax Invoice for manpower placement fulfillment under our Corporate Empanelment Agreement with <strong>${invoice.companyName}</strong>.
          </p>

          <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #334155;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Invoice Number:</td>
                <td style="color: #38bdf8; font-weight: 700; text-align: right; font-family: monospace;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Candidate Placed:</td>
                <td style="color: #f8fafc; font-weight: 600; text-align: right;">${invoice.candidateName} (${invoice.position})</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Annual CTC:</td>
                <td style="color: #f8fafc; text-align: right;">${formattedCtc}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Empanelment Fee (${invoice.feePercentage}%):</td>
                <td style="color: #f8fafc; text-align: right;">${formattedBase}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">GST @ 18% (SAC 998512):</td>
                <td style="color: #f8fafc; text-align: right;">${formattedTax}</td>
              </tr>
              <tr style="border-top: 1px solid #334155;">
                <td style="color: #ffffff; padding: 12px 0 6px 0; font-size: 15px; font-weight: 700;">Grand Total Payable:</td>
                <td style="color: #34d399; padding: 12px 0 6px 0; font-size: 18px; font-weight: 800; text-align: right;">${formattedAmount}</td>
              </tr>
            </table>
          </div>

          <div style="background: #0f172a; border-radius: 12px; padding: 18px; border: 1px solid #1e293b; font-size: 12px; color: #94a3b8; line-height: 1.6;">
            <p style="margin: 0 0 8px 0; font-weight: 700; color: #e2e8f0;">Bank Remittance Details:</p>
            <p style="margin: 2px 0;"><strong>Account Name:</strong> SoftLab Global</p>
            <p style="margin: 2px 0;"><strong>Account No:</strong> 50200089123456 | <strong>IFSC:</strong> HDFC0000211</p>
            <p style="margin: 2px 0;"><strong>Branch:</strong> Civil Lines, Prayagraj, UP</p>
            <p style="margin: 2px 0;"><strong>UPI ID:</strong> softlabglobal@upi</p>
          </div>

          <div style="margin-top: 24px; text-align: center;">
            <a href="https://www.softlabglobal.com/recruiters" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 13px;">View Recruiter Portal &amp; Receipt</a>
          </div>

          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 0;">Authorized Signatory:</p>
              <p style="margin: 2px 0 0 0; color: #cbd5e1; font-weight: 700;">${invoice.authorizedBy || "Harsh Shukla"}</p>
              <p style="margin: 0; font-size: 11px;">SoftLab Global</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0;">Helpline: +91 9196596975</p>
              <p style="margin: 2px 0 0 0;">info@softlabglobal.com</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const emailResult = await EmailService.sendEmail({
      to: targetEmail,
      subject: `[INVOICE ${invoice.invoiceNumber}] Manpower Placement Fulfillment - ${invoice.candidateName} | SoftLab Global`,
      html: emailHtml,
      text: `Tax Invoice ${invoice.invoiceNumber} for candidate ${invoice.candidateName} (${invoice.position}) placed at ${invoice.companyName}. Net Amount: ${formattedAmount}. Please remit payment within terms.`,
    });

    await AuditService.log({
      actorId: actor.id,
      action: "STAFFING_INVOICE_DISPATCHED",
      resourceType: "CorporateStaffingInvoice",
      resourceId: invoice.id,
      newData: { targetEmail, sent: emailResult.sent },
    });

    return {
      success: true,
      invoiceNumber: invoice.invoiceNumber,
      sentTo: targetEmail,
      emailSent: emailResult.sent,
    };
  }
}