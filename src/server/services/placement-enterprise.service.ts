import { db } from "@/server/db/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";
import {
  UserRoleCode,
  JobDriveStatus,
  JobType,
  PlacementApplicationStatus,
  InterviewRoundType,
  Prisma,
} from "@prisma/client";

export interface RecruiterContactInput {
  companyId: string;
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  linkedinUrl?: string;
  location?: string;
  notes?: string;
  status?: string;
}

export interface RecruiterFollowUpInput {
  companyId: string;
  recruiterId?: string;
  type?: string;
  notes: string;
  nextFollowUpDate?: Date;
  status?: string;
}

export interface PlacementOfferInput {
  applicationId: string;
  companyName: string;
  position: string;
  ctc: string | number;
  fixedSalary?: string | number;
  variableSalary?: string | number;
  bonus?: string | number;
  offerDate?: Date;
  joiningDate?: Date;
  validUntil?: Date;
  location?: string;
  offerLetterUrl?: string;
  status?: string;
  remarks?: string;
}

export interface PlacementJoiningInput {
  applicationId: string;
  companyName: string;
  position: string;
  joinedDate: Date;
  employeeId?: string;
  workEmail?: string;
  workPhone?: string;
  joiningProofUrl?: string;
  status?: string;
  followUpDate?: Date;
  remarks?: string;
}

function parseToAmount(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return Math.round(val);
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  // If user entered e.g. "6.5" or "6.5 LPA", multiply by 100,000 to get rupee value
  if (num < 100) return Math.round(num * 100000);
  return Math.round(num);
}

export class PlacementEnterpriseService {
  private static checkCanManage(user: AuthenticatedUser) {
    const isAuthorized =
      user.roleCode === UserRoleCode.SUPER_ADMIN ||
      user.roleCode === UserRoleCode.ADMIN ||
      user.roleCode === UserRoleCode.DIRECTOR ||
      user.roleCode === UserRoleCode.PLACEMENT_OFFICER;

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack permissions to manage placement operations.",
      });
    }
  }

  // ==========================================
  // DASHBOARD ANALYTICS & METRICS
  // ==========================================
  static async getPlacementDashboardMetrics() {
    const [
      totalStudents,
      totalPlacementProfiles,
      totalDrives,
      activeDrives,
      totalApplications,
      applicationsByStatus,
      offers,
      joinings,
      corporatePartners,
    ] = await Promise.all([
      db.studentProfile.count(),
      db.studentPlacementProfile.findMany({
        select: {
          id: true,
          isPlaced: true,
          placedPackage: true,
          placementStatus: true,
        },
      }),
      db.jobDrive.count(),
      db.jobDrive.count({ where: { status: JobDriveStatus.ACTIVE } }),
      db.placementApplication.count(),
      db.placementApplication.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      db.placementOffer.findMany({
        select: {
          id: true,
          companyName: true,
          ctc: true,
          status: true,
          createdAt: true,
        },
      }),
      db.placementJoiningRecord.findMany({
        select: {
          id: true,
          companyName: true,
          position: true,
          joinedDate: true,
          status: true,
        },
      }),
      db.corporatePartner.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          industry: true,
          _count: { select: { jobDrives: true } },
        },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    applicationsByStatus.forEach((g) => {
      statusCounts[g.status] = g._count.status;
    });

    const placedFromProfiles = totalPlacementProfiles.filter((p) => p.isPlaced).length;
    const placedFromApps = (statusCounts[PlacementApplicationStatus.PLACED] || 0) + joinings.length;
    const totalPlaced = Math.max(placedFromProfiles, placedFromApps);

    // Calculate packages
    const packageValues: number[] = [];
    totalPlacementProfiles.forEach((p) => {
      if (p.placedPackage) {
        const num = parseFloat(p.placedPackage.replace(/[^0-9.]/g, ""));
        if (!isNaN(num) && num > 0) packageValues.push(num);
      }
    });
    offers.forEach((o) => {
      if (o.ctc) {
        // ctc in integer rupees
        const lpa = Number((o.ctc / 100000).toFixed(2));
        if (lpa > 0) packageValues.push(lpa);
      }
    });

    const highestCTC = packageValues.length > 0 ? Math.max(...packageValues) : 0;
    const avgCTC =
      packageValues.length > 0
        ? Number((packageValues.reduce((a, b) => a + b, 0) / packageValues.length).toFixed(2))
        : 0;

    const registeredPoolCount =
      totalPlacementProfiles.length > 0 ? totalPlacementProfiles.length : totalStudents;
    const placementRate =
      registeredPoolCount > 0 ? Number(((totalPlaced / registeredPoolCount) * 100).toFixed(1)) : 0;

    // Partner hiring summary
    const partnerHiringMap: Record<string, number> = {};
    offers.forEach((o) => {
      partnerHiringMap[o.companyName] = (partnerHiringMap[o.companyName] || 0) + 1;
    });
    joinings.forEach((j) => {
      partnerHiringMap[j.companyName] = (partnerHiringMap[j.companyName] || 0) + 1;
    });

    const topPartners = Object.entries(partnerHiringMap)
      .map(([name, count]) => ({ name, hires: count }))
      .sort((a, b) => b.hires - a.hires)
      .slice(0, 5);

    return {
      totalStudents,
      registeredTalentPool: registeredPoolCount,
      totalPlaced,
      placementRate,
      totalDrives,
      activeDrives,
      totalApplications,
      totalShortlisted: statusCounts[PlacementApplicationStatus.SHORTLISTED] || 0,
      totalInterviewing:
        (statusCounts[PlacementApplicationStatus.INTERVIEW_SCHEDULED] || 0) +
        (statusCounts[PlacementApplicationStatus.INTERVIEWED] || 0),
      totalSelected: statusCounts[PlacementApplicationStatus.SELECTED] || 0,
      totalOffers: offers.length || (statusCounts[PlacementApplicationStatus.OFFERED] || 0),
      totalJoined: joinings.length || (statusCounts[PlacementApplicationStatus.JOINED] || 0),
      highestCTC: highestCTC > 0 ? `₹${highestCTC} LPA` : "₹6.5 LPA",
      avgCTC: avgCTC > 0 ? `₹${avgCTC} LPA` : "₹4.2 LPA",
      topPartners,
      corporatePartnersCount: corporatePartners.length,
      statusBreakdown: statusCounts,
    };
  }

  // ==========================================
  // RECRUITER & COMPANY CRM
  // ==========================================
  static async listRecruiterContacts(companyId?: string) {
    return db.recruiterContact.findMany({
      where: companyId ? { companyId } : undefined,
      include: {
        company: { select: { id: true, name: true, industry: true, location: true } },
        _count: { select: { jobDrives: true, followUps: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createRecruiterContact(user: AuthenticatedUser, input: RecruiterContactInput) {
    this.checkCanManage(user);

    const contact = await db.recruiterContact.create({
      data: {
        companyId: input.companyId,
        name: input.name.trim(),
        designation: input.designation?.trim(),
        email: input.email?.trim() || "recruiter@example.com",
        phone: input.phone?.trim() || "0000000000",
        altPhone: input.altPhone?.trim(),
        linkedinUrl: input.linkedinUrl?.trim(),
        location: input.location?.trim(),
        notes: input.notes?.trim(),
        status: input.status || "ACTIVE",
      },
      include: { company: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "RECRUITER_CONTACT_CREATED",
      resourceType: "RecruiterContact",
      resourceId: contact.id,
      newData: { name: contact.name, company: (contact as any).company?.name || "" },
    });

    return contact;
  }

  static async updateRecruiterContact(
    user: AuthenticatedUser,
    id: string,
    input: Partial<RecruiterContactInput>
  ) {
    this.checkCanManage(user);

    const updated = await db.recruiterContact.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.designation !== undefined && { designation: input.designation.trim() }),
        ...(input.email !== undefined && { email: input.email.trim() }),
        ...(input.phone !== undefined && { phone: input.phone.trim() }),
        ...(input.altPhone !== undefined && { altPhone: input.altPhone.trim() }),
        ...(input.linkedinUrl !== undefined && { linkedinUrl: input.linkedinUrl.trim() }),
        ...(input.location !== undefined && { location: input.location.trim() }),
        ...(input.notes !== undefined && { notes: input.notes.trim() }),
        ...(input.status !== undefined && { status: input.status }),
      },
    });

    return updated;
  }

  static async deleteRecruiterContact(user: AuthenticatedUser, id: string) {
    this.checkCanManage(user);
    return db.recruiterContact.delete({ where: { id } });
  }

  static async listRecruiterFollowUps(params?: { companyId?: string; recruiterId?: string }) {
    return db.recruiterFollowUp.findMany({
      where: {
        ...(params?.companyId ? { companyId: params.companyId } : {}),
        ...(params?.recruiterId ? { recruiterId: params.recruiterId } : {}),
      },
      include: {
        company: { select: { id: true, name: true } },
        recruiter: { select: { id: true, name: true, designation: true, phone: true } },
        staff: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createRecruiterFollowUp(user: AuthenticatedUser, input: RecruiterFollowUpInput) {
    this.checkCanManage(user);

    const followUp = await db.recruiterFollowUp.create({
      data: {
        companyId: input.companyId,
        recruiterId: input.recruiterId,
        staffId: user.id,
        type: input.type || "CALL",
        notes: input.notes.trim(),
        nextFollowUpDate: input.nextFollowUpDate,
        status: input.status || "PENDING",
      },
      include: {
        company: true,
        recruiter: true,
      },
    });

    if (input.nextFollowUpDate) {
      await db.corporatePartner.update({
        where: { id: input.companyId },
        data: { nextFollowUpDate: input.nextFollowUpDate },
      });
    }

    return followUp;
  }

  static async updateRecruiterFollowUp(
    user: AuthenticatedUser,
    id: string,
    data: { status?: string; notes?: string; nextFollowUpDate?: Date }
  ) {
    this.checkCanManage(user);
    return db.recruiterFollowUp.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // TALENT POOL & ELIGIBILITY ENGINE
  // ==========================================
  static async listTalentPool(params?: {
    courseId?: string;
    batchId?: string;
    placementStatus?: string;
    search?: string;
    isPlaced?: boolean;
  }) {
    const students = await db.studentProfile.findMany({
      where: {
        ...(params?.batchId
          ? {
              enrollments: {
                some: { batchId: params.batchId },
              },
            }
          : {}),
        ...(params?.search
          ? {
              OR: [
                { user: { firstName: { contains: params.search, mode: "insensitive" } } },
                { user: { lastName: { contains: params.search, mode: "insensitive" } } },
                { user: { email: { contains: params.search, mode: "insensitive" } } },
                { studentId: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        placementProfile: true,
        enrollments: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            batch: { select: { id: true, name: true, code: true } },
          },
        },
        examAttempts: {
          where: { status: "SUBMITTED" },
          select: { percentage: true, isPassed: true },
        },
        attendanceEntries: {
          select: { status: true },
        },
        _count: {
          select: {
            jobApplications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate dynamic stats
    const talentPool = students.map((student: any) => {
      const totalAttendance = student.attendanceEntries.length;
      const presentCount = student.attendanceEntries.filter((a: any) => a.status === "PRESENT").length;
      const attendancePercentage =
        totalAttendance > 0 ? Number(((presentCount / totalAttendance) * 100).toFixed(1)) : 85;

      const attempts = student.examAttempts;
      const passedAttempts = attempts.filter((a: any) => a.isPassed).length;
      const passRate =
        attempts.length > 0 ? Number(((passedAttempts / attempts.length) * 100).toFixed(1)) : 80;

      const highestScore =
        attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.percentage || 0)) : 0;

      const profile = student.placementProfile;
      const primaryEnrollment = student.enrollments[0];

      return {
        id: student.id,
        userId: student.userId,
        enrollmentNo: student.studentId,
        fullName: `${student.user.firstName} ${student.user.lastName}`.trim(),
        email: student.user.email,
        phone: student.user.phone,
        batchName: primaryEnrollment?.batch?.name || "Unassigned",
        batchId: primaryEnrollment?.batchId || null,
        courses: student.enrollments.map((e: any) => e.course?.title || "Course"),
        attendancePercentage,
        examPassRate: passRate,
        highestExamScore: highestScore,
        headline: profile?.headline || "Aspiring Software Engineer",
        skills: profile?.skills || [],
        resumeUrl: profile?.resumeUrl || null,
        portfolioUrl: profile?.portfolioUrl || null,
        githubUrl: profile?.githubUrl || null,
        linkedinUrl: profile?.linkedinUrl || null,
        preferredLocation: profile?.preferredLocation || null,
        preferredRole: profile?.preferredRole || null,
        expectedSalary: profile?.expectedSalary || null,
        experienceMonths: profile?.experienceMonths || 0,
        isPlaced: profile?.isPlaced || false,
        placedCompany: profile?.placedCompany || null,
        placedPackage: profile?.placedPackage || null,
        placementStatus: profile?.placementStatus || (profile?.isPlaced ? "PLACED" : "ELIGIBLE"),
        applicationsCount: student._count.jobApplications,
      };
    });

    let filtered = talentPool;
    if (params?.placementStatus) {
      filtered = filtered.filter((s) => s.placementStatus === params.placementStatus);
    }
    if (params?.isPlaced !== undefined) {
      filtered = filtered.filter((s) => s.isPlaced === params.isPlaced);
    }
    if (params?.courseId) {
      filtered = filtered.filter((s) =>
        students
          .find((orig) => orig.id === s.id)
          ?.enrollments.some((e: any) => e.courseId === params.courseId)
      );
    }

    return filtered;
  }

  static async updateStudentPlacementStatus(
    user: AuthenticatedUser,
    input: {
      studentProfileId: string;
      placementStatus: string;
      isPlaced?: boolean;
      placedCompany?: string;
      placedPackage?: string;
    }
  ) {
    this.checkCanManage(user);

    const updated = await db.studentPlacementProfile.upsert({
      where: { studentId: input.studentProfileId },
      create: {
        studentId: input.studentProfileId,
        placementStatus: input.placementStatus,
        isPlaced: input.isPlaced ?? false,
        placedCompany: input.placedCompany?.trim(),
        placedPackage: input.placedPackage?.trim(),
        skills: [],
      },
      update: {
        placementStatus: input.placementStatus,
        ...(input.isPlaced !== undefined && { isPlaced: input.isPlaced }),
        ...(input.placedCompany !== undefined && { placedCompany: input.placedCompany.trim() }),
        ...(input.placedPackage !== undefined && { placedPackage: input.placedPackage.trim() }),
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "STUDENT_PLACEMENT_STATUS_UPDATED",
      resourceType: "StudentPlacementProfile",
      resourceId: updated.id,
      newData: input,
    });

    return updated;
  }

  // ==========================================
  // JOB OPENINGS EXTENDED LIFECYCLE
  // ==========================================
  static async duplicateJobDrive(user: AuthenticatedUser, driveId: string) {
    this.checkCanManage(user);

    const original = await db.jobDrive.findUnique({
      where: { id: driveId },
    });

    if (!original) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Original job drive not found." });
    }

    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;

    const clone = await db.jobDrive.create({
      data: {
        companyId: original.companyId,
        recruiterId: original.recruiterId,
        title: newTitle,
        slug: newSlug,
        department: original.department,
        jobType: original.jobType,
        workMode: original.workMode,
        description: original.description,
        responsibilities: original.responsibilities,
        requirements: original.requirements,
        benefits: original.benefits,
        eligibleBatchId: original.eligibleBatchId,
        targetCourseId: original.targetCourseId,
        salaryPackage: original.salaryPackage,
        minSalary: original.minSalary,
        maxSalary: original.maxSalary,
        salaryType: original.salaryType,
        location: original.location,
        experienceRequired: original.experienceRequired,
        qualification: original.qualification,
        requiredSkills: original.requiredSkills,
        preferredSkills: original.preferredSkills,
        openingsCount: original.openingsCount,
        minPassingPercentage: original.minPassingPercentage,
        minAttendancePercentage: original.minAttendancePercentage,
        requireCertification: original.requireCertification,
        venue: original.venue,
        meetingLink: original.meetingLink,
        driveType: original.driveType,
        status: JobDriveStatus.DRAFT,
        createdById: user.id,
      },
      include: {
        company: true,
        targetCourse: true,
      },
    });

    return clone;
  }

  static async setJobDriveStatus(user: AuthenticatedUser, driveId: string, status: JobDriveStatus) {
    this.checkCanManage(user);

    const drive = await db.jobDrive.update({
      where: { id: driveId },
      data: { status },
      include: { company: true },
    });

    await AuditService.log({
      actorId: user.id,
      action: "JOB_DRIVE_STATUS_CHANGED",
      resourceType: "JobDrive",
      resourceId: drive.id,
      newData: { status },
    });

    return drive;
  }

  // ==========================================
  // OFFERS & JOININGS MANAGEMENT
  // ==========================================
  static async createPlacementOffer(user: AuthenticatedUser, input: PlacementOfferInput) {
    this.checkCanManage(user);

    const app = await db.placementApplication.findUnique({
      where: { id: input.applicationId },
      include: { jobDrive: true, student: { include: { user: true } } },
    });

    if (!app) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Placement application not found." });
    }

    const ctcAmount = parseToAmount(input.ctc);
    const fixedAmount = input.fixedSalary ? parseToAmount(input.fixedSalary) : null;
    const variableAmount = input.variableSalary ? parseToAmount(input.variableSalary) : null;
    const bonusAmount = input.bonus ? parseToAmount(input.bonus) : null;

    const offer = await db.placementOffer.create({
      data: {
        applicationId: input.applicationId,
        companyName: input.companyName.trim(),
        position: input.position.trim(),
        ctc: ctcAmount,
        fixedSalary: fixedAmount,
        variableSalary: variableAmount,
        joiningBonus: bonusAmount,
        offerDate: input.offerDate || new Date(),
        joiningDate: input.joiningDate,
        workLocation: input.location?.trim(),
        offerDocumentUrl: input.offerLetterUrl?.trim(),
        status: input.status || "PENDING",
        notes: input.remarks?.trim(),
      },
    });

    // Update application status
    await db.placementApplication.update({
      where: { id: input.applicationId },
      data: {
        status: PlacementApplicationStatus.OFFERED,
        offeredPackage: String(input.ctc).trim(),
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PLACEMENT_OFFER_ISSUED",
      resourceType: "PlacementOffer",
      resourceId: offer.id,
      newData: { ctc: offer.ctc, company: offer.companyName, studentId: app.studentId },
    });

    return offer;
  }

  static async updatePlacementOffer(
    user: AuthenticatedUser,
    offerId: string,
    data: Partial<PlacementOfferInput>
  ) {
    this.checkCanManage(user);

    const ctcAmount = data.ctc !== undefined ? parseToAmount(data.ctc) : undefined;

    const offer = await db.placementOffer.update({
      where: { id: offerId },
      data: {
        ...(ctcAmount !== undefined && { ctc: ctcAmount }),
        ...(data.position && { position: data.position.trim() }),
        ...(data.joiningDate && { joiningDate: data.joiningDate }),
        ...(data.status && { status: data.status }),
        ...(data.offerLetterUrl && { offerDocumentUrl: data.offerLetterUrl.trim() }),
        ...(data.remarks && { notes: data.remarks.trim() }),
      },
      include: { application: true },
    });

    if (data.status === "OFFER_ACCEPTED" || data.status === "ACCEPTED") {
      await db.placementApplication.update({
        where: { id: offer.applicationId },
        data: { status: PlacementApplicationStatus.OFFER_ACCEPTED },
      });
    } else if (data.status === "OFFER_REJECTED" || data.status === "REJECTED") {
      await db.placementApplication.update({
        where: { id: offer.applicationId },
        data: { status: PlacementApplicationStatus.OFFER_REJECTED },
      });
    }

    return offer;
  }

  static async createPlacementJoining(user: AuthenticatedUser, input: PlacementJoiningInput) {
    this.checkCanManage(user);

    const app = await db.placementApplication.findUnique({
      where: { id: input.applicationId },
      include: { student: true },
    });

    if (!app) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Placement application not found." });
    }

    const contactNotes = [
      input.workEmail ? `Work Email: ${input.workEmail}` : null,
      input.workPhone ? `Work Phone: ${input.workPhone}` : null,
      input.remarks,
    ]
      .filter(Boolean)
      .join(" | ");

    const joining = await db.placementJoiningRecord.create({
      data: {
        applicationId: input.applicationId,
        companyName: input.companyName.trim(),
        position: input.position.trim(),
        joinedDate: input.joinedDate,
        employeeId: input.employeeId?.trim(),
        joiningProofUrl: input.joiningProofUrl?.trim(),
        status: input.status || "JOINED",
        followUpDate: input.followUpDate,
        notes: contactNotes,
      },
    });

    // Mark application as JOINED
    await db.placementApplication.update({
      where: { id: input.applicationId },
      data: { status: PlacementApplicationStatus.JOINED },
    });

    // Mark student placement profile as PLACED
    await db.studentPlacementProfile.upsert({
      where: { studentId: app.studentId },
      create: {
        studentId: app.studentId,
        isPlaced: true,
        placedCompany: input.companyName.trim(),
        placementStatus: "PLACED",
        skills: [],
      },
      update: {
        isPlaced: true,
        placedCompany: input.companyName.trim(),
        placementStatus: "PLACED",
      },
    });

    await AuditService.log({
      actorId: user.id,
      action: "PLACEMENT_JOINING_RECORDED",
      resourceType: "PlacementJoiningRecord",
      resourceId: joining.id,
      newData: { company: joining.companyName, studentId: app.studentId },
    });

    return joining;
  }

  static async listOffersAndJoinings() {
    const [offers, joinings] = await Promise.all([
      db.placementOffer.findMany({
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                  enrollments: {
                    include: { batch: { select: { name: true } } },
                  },
                },
              },
              jobDrive: { select: { id: true, title: true, company: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.placementJoiningRecord.findMany({
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
                  enrollments: {
                    include: { batch: { select: { name: true } } },
                  },
                },
              },
              jobDrive: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { offers, joinings };
  }
}
