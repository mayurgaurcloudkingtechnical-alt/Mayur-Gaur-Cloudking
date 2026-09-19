import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuditService } from "./audit.service";
import { formatPaiseToRupees, formatDate } from "@/lib/utils";

export class StaffExtendedService {
  // ============================================================================
  // 1. SHIFTS MANAGEMENT
  // ============================================================================
  static async listShifts() {
    return db.staffShift.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { staff: true } },
      },
    });
  }

  static async createShift(input: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    weeklyOff?: string;
  }) {
    const existing = await db.staffShift.findUnique({
      where: { code: input.code.toUpperCase() },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Shift code '${input.code}' already exists.`,
      });
    }

    return db.staffShift.create({
      data: {
        name: input.name,
        code: input.code.toUpperCase(),
        startTime: input.startTime,
        endTime: input.endTime,
        breakMinutes: input.breakMinutes ?? 60,
        weeklyOff: input.weeklyOff || "SUNDAY",
      },
    });
  }

  static async updateShift(input: {
    id: string;
    name?: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
    weeklyOff?: string;
    isActive?: boolean;
  }) {
    return db.staffShift.update({
      where: { id: input.id },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.startTime && { startTime: input.startTime }),
        ...(input.endTime && { endTime: input.endTime }),
        ...(input.breakMinutes !== undefined && { breakMinutes: input.breakMinutes }),
        ...(input.weeklyOff && { weeklyOff: input.weeklyOff }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }

  static async assignStaffShift(staffId: string, shiftId: string | null) {
    return db.staffProfile.update({
      where: { id: staffId },
      data: { shiftId },
      include: { shift: true },
    });
  }

  // ============================================================================
  // 2. ASSET MANAGEMENT
  // ============================================================================
  static async listAssets(filters?: {
    category?: string;
    status?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.category && filters.category !== "ALL") {
      where.category = filters.category;
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { assetTag: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
        { serialNumber: { contains: filters.search, mode: "insensitive" } },
        { brand: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return db.staffAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        assignedStaff: {
          include: { user: true },
        },
      },
    });
  }

  static async createAsset(input: {
    assetTag: string;
    name: string;
    category: string;
    serialNumber?: string;
    brand?: string;
    model?: string;
    purchaseDate?: Date;
    warrantyExpiry?: Date;
    condition?: string;
    status?: string;
    assignedStaffId?: string;
    notes?: string;
  }) {
    const existing = await db.staffAsset.findUnique({
      where: { assetTag: input.assetTag.toUpperCase() },
    });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `Asset tag '${input.assetTag}' already registered.`,
      });
    }

    const asset = await db.staffAsset.create({
      data: {
        assetTag: input.assetTag.toUpperCase(),
        name: input.name,
        category: input.category.toUpperCase(),
        serialNumber: input.serialNumber,
        brand: input.brand,
        model: input.model,
        purchaseDate: input.purchaseDate,
        warrantyExpiry: input.warrantyExpiry,
        condition: input.condition || "GOOD",
        status: input.assignedStaffId ? "ASSIGNED" : (input.status || "AVAILABLE"),
        assignedStaffId: input.assignedStaffId || null,
        assignedDate: input.assignedStaffId ? new Date() : null,
        notes: input.notes,
      },
      include: {
        assignedStaff: { include: { user: true } },
      },
    });

    await AuditService.log({
      action: "ASSET_CREATED",
      resourceType: "StaffAsset",
      resourceId: asset.id,
      newData: { assetTag: asset.assetTag, category: asset.category },
    });

    return asset;
  }

  static async assignAsset(assetId: string, staffId: string, notes?: string) {
    const asset = await db.staffAsset.update({
      where: { id: assetId },
      data: {
        assignedStaffId: staffId,
        assignedDate: new Date(),
        status: "ASSIGNED",
        returnDate: null,
        ...(notes && { notes }),
      },
      include: {
        assignedStaff: { include: { user: true } },
      },
    });

    await AuditService.log({
      action: "ASSET_ASSIGNED",
      resourceType: "StaffAsset",
      resourceId: asset.id,
      newData: { assignedStaffId: staffId, assetTag: asset.assetTag },
    });

    return asset;
  }

  static async returnAsset(assetId: string, condition?: string, notes?: string) {
    const asset = await db.staffAsset.update({
      where: { id: assetId },
      data: {
        assignedStaffId: null,
        returnDate: new Date(),
        status: "AVAILABLE",
        ...(condition && { condition }),
        ...(notes && { notes }),
      },
    });

    await AuditService.log({
      action: "ASSET_RETURNED",
      resourceType: "StaffAsset",
      resourceId: asset.id,
      newData: { condition: asset.condition, assetTag: asset.assetTag },
    });

    return asset;
  }

  // ============================================================================
  // 3. RECRUITMENT / ATS CANDIDATE PIPELINE
  // ============================================================================
  static async listJobOpenings(filters?: { status?: string; department?: string }) {
    const where: any = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.department && filters.department !== "ALL") {
      where.department = filters.department;
    }

    const openings = await db.staffJobOpening.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        applicants: {
          select: { id: true, status: true, rating: true },
        },
      },
    });

    return openings.map((o) => {
      const stageCounts: Record<string, number> = {};
      for (const a of o.applicants) {
        stageCounts[a.status] = (stageCounts[a.status] || 0) + 1;
      }
      return {
        ...o,
        totalApplicants: o.applicants.length,
        stageCounts,
      };
    });
  }

  static async createJobOpening(input: {
    title: string;
    department: string;
    employmentType?: string;
    experienceMin?: number;
    experienceMax?: number;
    minSalary?: number;
    maxSalary?: number;
    openPositions?: number;
    location?: string;
    description: string;
    requirements?: string;
    closingDate?: Date;
    createdById: string;
  }) {
    return db.staffJobOpening.create({
      data: {
        title: input.title,
        department: input.department,
        employmentType: input.employmentType || "FULL_TIME",
        experienceMin: input.experienceMin ?? 0,
        experienceMax: input.experienceMax,
        minSalary: input.minSalary,
        maxSalary: input.maxSalary,
        openPositions: input.openPositions ?? 1,
        location: input.location || "PRAYAGRAJ_CAMPUS",
        description: input.description,
        requirements: input.requirements,
        closingDate: input.closingDate,
        createdById: input.createdById,
        status: "ACTIVE",
      },
    });
  }

  static async listApplicants(openingId?: string, status?: string, search?: string) {
    const where: any = {};
    if (openingId) where.openingId = openingId;
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { currentRole: { contains: search, mode: "insensitive" } },
      ];
    }

    return db.staffApplicant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        opening: {
          select: { id: true, title: true, department: true },
        },
      },
    });
  }

  static async createApplicant(input: {
    openingId: string;
    fullName: string;
    email: string;
    phone: string;
    currentRole?: string;
    currentCompany?: string;
    experienceYears?: number;
    expectedCtc?: number;
    noticePeriodDays?: number;
    resumeUrl?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    notes?: string;
  }) {
    return db.staffApplicant.create({
      data: {
        openingId: input.openingId,
        fullName: input.fullName,
        email: input.email.toLowerCase(),
        phone: input.phone,
        currentRole: input.currentRole,
        currentCompany: input.currentCompany,
        experienceYears: input.experienceYears ?? 0,
        expectedCtc: input.expectedCtc,
        noticePeriodDays: input.noticePeriodDays ?? 30,
        resumeUrl: input.resumeUrl,
        portfolioUrl: input.portfolioUrl,
        linkedinUrl: input.linkedinUrl,
        notes: input.notes,
        status: "APPLIED",
      },
    });
  }

  static async updateApplicantStatus(input: {
    id: string;
    status: string;
    rating?: number;
    notes?: string;
    interviewDate?: Date;
  }) {
    return db.staffApplicant.update({
      where: { id: input.id },
      data: {
        status: input.status,
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.interviewDate !== undefined && { interviewDate: input.interviewDate }),
      },
      include: { opening: true },
    });
  }

  // ============================================================================
  // 4. ONBOARDING & OFFBOARDING
  // ============================================================================
  static async getOnboardingChecklist(staffId: string) {
    let checklist = await db.staffOnboardingChecklist.findUnique({
      where: { staffId },
      include: {
        staff: { include: { user: true } },
      },
    });

    if (!checklist) {
      checklist = await db.staffOnboardingChecklist.create({
        data: { staffId },
        include: { staff: { include: { user: true } } },
      });
    }

    return checklist;
  }

  static async updateOnboardingChecklist(input: {
    staffId: string;
    personalDetailsDone?: boolean;
    documentsUploaded?: boolean;
    bankDetailsVerified?: boolean;
    workstationAssigned?: boolean;
    idCardIssued?: boolean;
    emailAccountCreated?: boolean;
    slackOrPortalInvited?: boolean;
    orientationCompleted?: boolean;
    notes?: string;
  }) {
    const existing = await this.getOnboardingChecklist(input.staffId);

    const updatedData = {
      personalDetailsDone: input.personalDetailsDone ?? existing.personalDetailsDone,
      documentsUploaded: input.documentsUploaded ?? existing.documentsUploaded,
      bankDetailsVerified: input.bankDetailsVerified ?? existing.bankDetailsVerified,
      workstationAssigned: input.workstationAssigned ?? existing.workstationAssigned,
      idCardIssued: input.idCardIssued ?? existing.idCardIssued,
      emailAccountCreated: input.emailAccountCreated ?? existing.emailAccountCreated,
      slackOrPortalInvited: input.slackOrPortalInvited ?? existing.slackOrPortalInvited,
      orientationCompleted: input.orientationCompleted ?? existing.orientationCompleted,
      ...(input.notes !== undefined && { notes: input.notes }),
    };

    const items = [
      updatedData.personalDetailsDone,
      updatedData.documentsUploaded,
      updatedData.bankDetailsVerified,
      updatedData.workstationAssigned,
      updatedData.idCardIssued,
      updatedData.emailAccountCreated,
      updatedData.slackOrPortalInvited,
      updatedData.orientationCompleted,
    ];

    const completedCount = items.filter(Boolean).length;
    const completionPercent = Math.round((completedCount / items.length) * 100);
    const status =
      completionPercent === 100
        ? "COMPLETED"
        : completionPercent > 0
        ? "IN_PROGRESS"
        : "NOT_STARTED";

    return db.staffOnboardingChecklist.update({
      where: { staffId: input.staffId },
      data: {
        ...updatedData,
        completionPercent,
        status,
        completedAt: completionPercent === 100 ? new Date() : null,
      },
      include: {
        staff: { include: { user: true } },
      },
    });
  }

  static async getOffboardingRecord(staffId: string) {
    let record = await db.staffOffboardingRecord.findUnique({
      where: { staffId },
      include: {
        staff: { include: { user: true } },
      },
    });

    if (!record) {
      record = await db.staffOffboardingRecord.create({
        data: { staffId },
        include: { staff: { include: { user: true } } },
      });
    }

    return record;
  }

  static async updateOffboardingRecord(input: {
    staffId: string;
    resignationDate?: Date;
    lastWorkingDay?: Date;
    reasonForLeaving?: string;
    assetsReturned?: boolean;
    emailDeactivated?: boolean;
    idCardReturned?: boolean;
    accountsDuesCleared?: boolean;
    relievingLetterIssued?: boolean;
    experienceLetterIssued?: boolean;
    exitInterviewNotes?: string;
    status?: string;
    clearedById?: string;
  }) {
    const existing = await this.getOffboardingRecord(input.staffId);

    const isCleared =
      (input.assetsReturned ?? existing.assetsReturned) &&
      (input.emailDeactivated ?? existing.emailDeactivated) &&
      (input.idCardReturned ?? existing.idCardReturned) &&
      (input.accountsDuesCleared ?? existing.accountsDuesCleared);

    const calculatedStatus =
      input.status || (isCleared ? "CLEARED" : "PENDING_CLEARANCE");

    return db.staffOffboardingRecord.update({
      where: { staffId: input.staffId },
      data: {
        ...(input.resignationDate && { resignationDate: input.resignationDate }),
        ...(input.lastWorkingDay && { lastWorkingDay: input.lastWorkingDay }),
        ...(input.reasonForLeaving !== undefined && { reasonForLeaving: input.reasonForLeaving }),
        ...(input.assetsReturned !== undefined && { assetsReturned: input.assetsReturned }),
        ...(input.emailDeactivated !== undefined && { emailDeactivated: input.emailDeactivated }),
        ...(input.idCardReturned !== undefined && { idCardReturned: input.idCardReturned }),
        ...(input.accountsDuesCleared !== undefined && { accountsDuesCleared: input.accountsDuesCleared }),
        ...(input.relievingLetterIssued !== undefined && { relievingLetterIssued: input.relievingLetterIssued }),
        ...(input.experienceLetterIssued !== undefined && { experienceLetterIssued: input.experienceLetterIssued }),
        ...(input.exitInterviewNotes !== undefined && { exitInterviewNotes: input.exitInterviewNotes }),
        status: calculatedStatus,
        ...(isCleared && { clearedAt: new Date() }),
        ...(input.clearedById && { clearedById: input.clearedById }),
      },
      include: {
        staff: { include: { user: true } },
      },
    });
  }

  // ============================================================================
  // 5. DOCUMENT & LETTER TEMPLATE GENERATOR
  // ============================================================================
  static async seedDefaultTemplates() {
    const templatesCount = await db.documentTemplate.count();
    if (templatesCount > 0) return;

    const defaultTemplates = [
      {
        templateKey: "OFFER_LETTER",
        name: "Official Job Offer Letter",
        category: "HR",
        subject: "Offer of Employment — {{InstitutionName}}",
        variables: ["EmployeeName", "Designation", "Department", "JoiningDate", "Salary", "InstitutionName", "Campus", "Date"],
        bodyContent: `Dear {{EmployeeName}},

We are pleased to offer you the position of {{Designation}} in the {{Department}} Department at {{InstitutionName}}, {{Campus}}.

Your gross annual compensation will be {{Salary}} per annum, subject to statutory deductions.

Your tentative date of joining will be {{JoiningDate}}. Please report to the HR Department with your original credentials and KYC documents for onboarding verification.

We look forward to welcoming you to the SoftLab Global team.

Sincerely,
Human Resources Department
{{InstitutionName}}
Date: {{Date}}`,
      },
      {
        templateKey: "APPOINTMENT_LETTER",
        name: "Formal Appointment Letter",
        category: "HR",
        subject: "Appointment Letter — {{EmployeeName}}",
        variables: ["EmployeeName", "EmployeeId", "Designation", "Department", "JoiningDate", "Salary", "InstitutionName", "Date"],
        bodyContent: `APPOINTMENT LETTER

Date: {{Date}}
To: {{EmployeeName}} (Emp ID: {{EmployeeId}})

Dear {{EmployeeName}},

With reference to your acceptance of our offer, we are pleased to appoint you as {{Designation}} in the {{Department}} Department at {{InstitutionName}} with effect from {{JoiningDate}}.

You will be under probation for a period of six months from your date of joining. Your monthly remuneration will be {{Salary}} as agreed upon.

You will be governed by the standard service conduct, non-disclosure agreements, and institutional regulations of {{InstitutionName}}.

Welcome aboard.

Authorized Signatory,
{{InstitutionName}}`,
      },
      {
        templateKey: "RELIEVING_LETTER",
        name: "Employee Relieving Letter",
        category: "HR",
        subject: "Relieving Letter — {{EmployeeName}}",
        variables: ["EmployeeName", "EmployeeId", "Designation", "JoiningDate", "LastWorkingDay", "InstitutionName", "Date"],
        bodyContent: `RELIEVING LETTER

Date: {{Date}}
Employee ID: {{EmployeeId}}

This is to certify that {{EmployeeName}} was employed with {{InstitutionName}} as {{Designation}} from {{JoiningDate}} to {{LastWorkingDay}}.

{{EmployeeName}} has been relieved from duties at the close of business hours on {{LastWorkingDay}} following proper clearance of institutional assets and dues.

We wish {{EmployeeName}} all the best in future endeavors.

For {{InstitutionName}},
Authorized HR Signatory`,
      },
      {
        templateKey: "EXPERIENCE_LETTER",
        name: "Experience & Service Certificate",
        category: "HR",
        subject: "Experience Certificate — {{EmployeeName}}",
        variables: ["EmployeeName", "EmployeeId", "Designation", "JoiningDate", "LastWorkingDay", "InstitutionName", "Date"],
        bodyContent: `TO WHOMSOEVER IT MAY CONCERN

Date: {{Date}}

This is to certify that {{EmployeeName}} was an integral part of {{InstitutionName}} from {{JoiningDate}} to {{LastWorkingDay}}, serving with distinction as {{Designation}}.

During the tenure, {{EmployeeName}} exhibited commendable professionalism, commitment, and integrity. All institutional assets and records were properly transitioned.

We recommend {{EmployeeName}} highly and wish every success in future career pursuits.

Sincerely,
Head of Human Resources
{{InstitutionName}}`,
      },
    ];

    for (const t of defaultTemplates) {
      await db.documentTemplate.upsert({
        where: { templateKey: t.templateKey },
        create: t,
        update: t,
      });
    }
  }

  static async listTemplates() {
    await this.seedDefaultTemplates();
    return db.documentTemplate.findMany({
      orderBy: { name: "asc" },
    });
  }

  static async generateLetter(input: {
    templateKey: string;
    staffId?: string;
    applicantId?: string;
    customVariables?: Record<string, string>;
  }) {
    await this.seedDefaultTemplates();

    const template = await db.documentTemplate.findUnique({
      where: { templateKey: input.templateKey },
    });

    if (!template) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Template '${input.templateKey}' not found.`,
      });
    }

    const vars: Record<string, string> = {
      InstitutionName: "SOFTLAB GLOBAL",
      Campus: "Center for Excellence Prayagraj",
      Date: formatDate(new Date()),
      ...(input.customVariables || {}),
    };

    if (input.staffId) {
      const staff = await db.staffProfile.findUnique({
        where: { id: input.staffId },
        include: { user: true },
      });
      if (staff) {
        vars["EmployeeName"] = `${staff.user.firstName} ${staff.user.lastName}`.trim();
        vars["EmployeeId"] = staff.employeeId;
        vars["Designation"] = staff.designation;
        vars["Department"] = staff.department;
        vars["JoiningDate"] = formatDate(staff.joiningDate);
        vars["Salary"] = formatPaiseToRupees(staff.baseSalary * 12);
        vars["MonthlySalary"] = formatPaiseToRupees(staff.baseSalary);
        vars["Email"] = staff.user.email;
        vars["Phone"] = staff.personalPhone || staff.user.phone || "";
      }
    } else if (input.applicantId) {
      const applicant = await db.staffApplicant.findUnique({
        where: { id: input.applicantId },
        include: { opening: true },
      });
      if (applicant) {
        vars["EmployeeName"] = applicant.fullName;
        vars["Designation"] = applicant.opening.title;
        vars["Department"] = applicant.opening.department;
        vars["Salary"] = applicant.expectedCtc
          ? formatPaiseToRupees(applicant.expectedCtc)
          : "Competitive Industry Standard";
        vars["JoiningDate"] = formatDate(new Date(Date.now() + 14 * 86400000));
        vars["Email"] = applicant.email;
        vars["Phone"] = applicant.phone;
      }
    }

    let renderedText = template.bodyContent;
    let renderedSubject = template.subject || template.name;

    for (const [key, val] of Object.entries(vars)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      renderedText = renderedText.replace(regex, val);
      renderedSubject = renderedSubject.replace(regex, val);
    }

    return {
      templateKey: template.templateKey,
      title: template.name,
      subject: renderedSubject,
      variablesUsed: vars,
      content: renderedText,
    };
  }
}
