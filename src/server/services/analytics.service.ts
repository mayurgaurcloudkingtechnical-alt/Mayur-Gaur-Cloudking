import { db } from "@/server/db/client";
import {
  PaymentTransactionStatus,
  PayrollStatus,
  FeeStructureStatus,
  EnrollmentStatus,
  BatchStatus,
  AttendanceStatus,
  CertificateStatus,
  LeadStatus,
  LeadSource,
  ApplicationStage,
  UserRoleCode,
} from "@prisma/client";

export class AnalyticsService {
  /**
   * Computes institutional financial metrics in deterministic integer Paise
   */
  static async getExecutiveFinancials() {
    const [revenueResult, payrollResult, outstandingResult] = await Promise.all([
      db.paymentTransaction.aggregate({
        where: { status: PaymentTransactionStatus.SUCCESS },
        _sum: { amount: true },
      }),
      db.payrollRecord.aggregate({
        where: { status: PayrollStatus.PAID },
        _sum: { netSalary: true },
      }),
      db.feeStructure.aggregate({
        where: { status: FeeStructureStatus.ACTIVE },
        _sum: { pendingAmount: true },
      }),
    ]);

    const totalRevenuePaise = revenueResult._sum.amount || 0;
    const totalPayrollDisbursedPaise = payrollResult._sum.netSalary || 0;
    const netOperationalBalancePaise = totalRevenuePaise - totalPayrollDisbursedPaise;
    const totalOutstandingDuesPaise = outstandingResult._sum.pendingAmount || 0;

    return {
      totalRevenuePaise,
      totalPayrollDisbursedPaise,
      netOperationalBalancePaise,
      totalOutstandingDuesPaise,
    };
  }

  /**
   * Computes CRM leads and admissions pipeline conversion metrics
   */
  static async getAdmissionsMetrics() {
    const [totalLeads, leadsByStatus, totalApplications, applicationsByStage] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.admissionApplication.count(),
      db.admissionApplication.groupBy({
        by: ["stage"],
        _count: { _all: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    leadsByStatus.forEach((g) => {
      statusCounts[g.status] = g._count._all;
    });

    const admittedCount = statusCounts[LeadStatus.ADMITTED] || 0;
    const conversionRate = totalLeads > 0 ? Number(((admittedCount / totalLeads) * 100).toFixed(1)) : 0;

    const stageCounts: Record<string, number> = {};
    applicationsByStage.forEach((g) => {
      stageCounts[g.stage] = g._count._all;
    });

    return {
      totalLeads,
      statusCounts,
      admittedCount,
      conversionRate,
      totalApplications,
      stageCounts,
    };
  }

  /**
   * Computes academic performance, attendance rate, and certification counts
   */
  static async getAcademicsMetrics() {
    const [
      totalActiveEnrollments,
      totalBatchesInSession,
      totalAttendanceCount,
      presentAttendanceCount,
      totalCertificatesIssued,
      totalExamsPassed,
    ] = await Promise.all([
      db.enrollment.count({ where: { status: EnrollmentStatus.ACTIVE } }),
      db.batch.count({ where: { status: BatchStatus.ONGOING } }),
      db.attendanceEntry.count(),
      db.attendanceEntry.count({ where: { status: AttendanceStatus.PRESENT } }),
      db.certificate.count({ where: { status: CertificateStatus.VALID } }),
      db.examAttempt.count({ where: { isPassed: true } }),
    ]);

    const averageAttendanceRate =
      totalAttendanceCount > 0
        ? Number(((presentAttendanceCount / totalAttendanceCount) * 100).toFixed(1))
        : 100;

    return {
      totalActiveEnrollments,
      totalBatchesInSession,
      averageAttendanceRate,
      totalCertificatesIssued,
      totalExamsPassed,
    };
  }

  /**
   * Computes placement success metrics, placement rate %, and packages
   */
  static async getPlacementMetrics() {
    const [totalEligibleStudents, placedProfiles, placedApps] = await Promise.all([
      db.studentProfile.count(),
      db.studentPlacementProfile.findMany({
        where: { isPlaced: true },
        select: { placedPackage: true, placedCompany: true },
      }),
      db.placementApplication.findMany({
        where: { status: "PLACED" },
        select: { offeredPackage: true, jobDrive: { select: { title: true, company: { select: { name: true } } } } },
      }),
    ]);

    const totalStudentsPlaced = placedProfiles.length;
    const placementRate =
      totalEligibleStudents > 0
        ? Number(((totalStudentsPlaced / totalEligibleStudents) * 100).toFixed(1))
        : 0;

    // Package parsing
    let highestLPA = 0;
    let totalLPA = 0;
    let lpaCount = 0;

    const allPackages = [
      ...placedProfiles.map((p) => p.placedPackage),
      ...placedApps.map((a) => a.offeredPackage),
    ].filter(Boolean) as string[];

    for (const pkg of allPackages) {
      const match = pkg.match(/([\d.]+)/);
      if (match) {
        const val = parseFloat(match[1]);
        if (!isNaN(val)) {
          if (val > highestLPA) highestLPA = val;
          totalLPA += val;
          lpaCount += 1;
        }
      }
    }

    const averageLPA = lpaCount > 0 ? Number((totalLPA / lpaCount).toFixed(1)) : 0;

    return {
      totalEligibleStudents,
      totalStudentsPlaced,
      placementRate,
      highestPackage: highestLPA > 0 ? `${highestLPA} LPA` : "N/A",
      averagePackage: averageLPA > 0 ? `${averageLPA} LPA` : "N/A",
    };
  }

  /**
   * Aggregates full executive BI overview across all institutional facets
   */
  static async getExecutiveOverview() {
    const [financials, admissions, academics, placements] = await Promise.all([
      this.getExecutiveFinancials(),
      this.getAdmissionsMetrics(),
      this.getAcademicsMetrics(),
      this.getPlacementMetrics(),
    ]);

    return {
      financials,
      admissions,
      academics,
      placements,
      generatedAt: new Date(),
    };
  }

  /**
   * Generates a month-by-month cashflow trend for the past N months
   */
  static async getMonthlyRevenueVsPayroll(monthsCount = 6) {
    const trend = [];
    const now = new Date();

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
      const year = d.getFullYear();
      const month = d.getMonth() + 1;

      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      const [monthRevenue, monthPayroll] = await Promise.all([
        db.paymentTransaction.aggregate({
          where: {
            status: PaymentTransactionStatus.SUCCESS,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        db.payrollRecord.aggregate({
          where: {
            year,
            month,
            status: PayrollStatus.PAID,
          },
          _sum: { netSalary: true },
        }),
      ]);

      const revenuePaise = monthRevenue._sum.amount || 0;
      const payrollPaise = monthPayroll._sum.netSalary || 0;
      const netSurplusPaise = revenuePaise - payrollPaise;

      const label = d.toLocaleString("default", { month: "short", year: "numeric", timeZone: "UTC" });

      trend.push({
        label,
        year,
        month,
        revenuePaise,
        payrollPaise,
        netSurplusPaise,
      });
    }

    return trend;
  }

  /**
   * Computes comprehensive marketing channels, campaign attribution,
   * full conversion funnels, counselor-wise velocity, and course revenue analytics.
   */
  static async getMarketingAnalytics() {
    // 1. Fetch all leads with their applications, payments, course, and assignees
    const [leads, allCourses, staffUsers] = await Promise.all([
      db.lead.findMany({
        include: {
          applications: {
            include: {
              payments: {
                where: { status: PaymentTransactionStatus.SUCCESS },
                select: { amount: true },
              },
            },
          },
          course: { select: { id: true, title: true } },
          assignedCounselor: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTelecaller: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          followUps: { select: { id: true, createdAt: true } },
        },
      }),
      db.course.findMany({
        where: { deletedAt: null },
        select: { id: true, title: true },
      }),
      db.user.findMany({
        where: {
          roleCode: { in: [UserRoleCode.COUNSELOR, UserRoleCode.TELECALLER, UserRoleCode.MANAGER, UserRoleCode.ADMIN] },
          status: "ACTIVE",
        },
        select: { id: true, firstName: true, lastName: true, email: true, roleCode: true },
      }),
    ]);

    // Channel definitions
    const channelDefinitions: Array<{ id: string; name: string; sources: LeadSource[] }> = [
      { id: "meta", name: "Meta (Facebook & Instagram)", sources: [LeadSource.META, LeadSource.META_ADS_FB, LeadSource.META_ADS_IG] },
      { id: "google", name: "Google Ads & Search", sources: [LeadSource.GOOGLE, LeadSource.GOOGLE_ADS, LeadSource.GOOGLE_SEARCH] },
      { id: "justdial", name: "Justdial Local Search", sources: [LeadSource.JUSTDIAL] },
      { id: "website", name: "Website Direct & Popups", sources: [LeadSource.WEBSITE, LeadSource.WEBSITE_CAREER_POPUP, LeadSource.CAREER_POPUP, LeadSource.COURSE_PAGE, LeadSource.CONTACT_FORM] },
      { id: "whatsapp", name: "WhatsApp & Chatbot", sources: [LeadSource.WHATSAPP, LeadSource.CHATBOT] },
      { id: "referral", name: "Student & Alumni Referrals", sources: [LeadSource.REFERRAL] },
      { id: "walk_in", name: "Campus Walk-ins", sources: [LeadSource.WALK_IN] },
      { id: "other", name: "Other Direct & Campus Drives", sources: [LeadSource.OTHER, LeadSource.SOCIAL_MEDIA, LeadSource.CAMPUS_DRIVE] },
    ];

    const getIntegrationStatus = (id: string) => {
      switch (id) {
        case "meta": {
          const isConfigured = Boolean(process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || process.env.META_PIXEL_ID);
          return {
            status: isConfigured ? ("CONNECTED" as const) : ("NOT_CONNECTED" as const),
            message: isConfigured ? "Meta Graph API & Pixel Active" : "Integration not connected",
          };
        }
        case "google": {
          const isConfigured = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN || process.env.GOOGLE_ADS_CLIENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);
          return {
            status: isConfigured ? ("CONNECTED" as const) : ("NOT_CONNECTED" as const),
            message: isConfigured ? "Google Ads & Analytics Connected" : "Integration not connected",
          };
        }
        case "justdial": {
          const isConfigured = Boolean(process.env.JUSTDIAL_API_KEY || process.env.JUSTDIAL_LEAD_WEBHOOK_SECRET);
          return {
            status: isConfigured ? ("CONNECTED" as const) : ("NOT_CONNECTED" as const),
            message: isConfigured ? "Justdial Webhook Ingestion Live" : "Integration not connected",
          };
        }
        case "whatsapp": {
          const isConfigured = Boolean(process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_PHONE_NUMBER_ID);
          return {
            status: isConfigured ? ("CONNECTED" as const) : ("NOT_CONNECTED" as const),
            message: isConfigured ? "WhatsApp Cloud API Active" : "Web chat mode active (Cloud API not connected)",
          };
        }
        case "website":
          return { status: "NATIVE" as const, message: "Native in-app capture active" };
        case "referral":
        case "walk_in":
        default:
          return { status: "NATIVE" as const, message: "Direct institutional tracking" };
      }
    };

    // Aggregate channel metrics
    const channels = channelDefinitions.map((def) => {
      const channelLeads = leads.filter((l) => def.sources.includes(l.source));
      const leadsCount = channelLeads.length;
      const contactedCount = channelLeads.filter((l) => l.status !== LeadStatus.NEW).length;
      
      let applicationsCount = 0;
      let admissionsCount = 0;
      let revenuePaise = 0;

      for (const lead of channelLeads) {
        applicationsCount += lead.applications.length;
        const isAdmitted =
          lead.status === LeadStatus.ADMITTED ||
          lead.applications.some((a) => a.stage === ApplicationStage.APPROVED || a.stage === ApplicationStage.CONVERTED);
        if (isAdmitted) {
          admissionsCount++;
        }
        for (const app of lead.applications) {
          for (const payment of app.payments) {
            revenuePaise += payment.amount;
          }
        }
      }

      const conversionRate = leadsCount > 0 ? Number(((admissionsCount / leadsCount) * 100).toFixed(1)) : 0;
      const integration = getIntegrationStatus(def.id);

      return {
        id: def.id,
        name: def.name,
        leadsCount,
        contactedCount,
        applicationsCount,
        admissionsCount,
        conversionRate,
        revenuePaise,
        integration,
      };
    });

    // Compute Funnel Stages
    const totalLeads = leads.length;
    const contactedLeads = leads.filter((l) => l.status !== LeadStatus.NEW).length;
    const followUpLeads = leads.filter(
      (l) => l.followUps.length > 0 || ([LeadStatus.FOLLOW_UP, LeadStatus.INTERESTED, LeadStatus.DEMO, LeadStatus.NEGOTIATION, LeadStatus.ADMITTED] as LeadStatus[]).includes(l.status)
    ).length;
    const interestedLeads = leads.filter(
      (l) => ([LeadStatus.INTERESTED, LeadStatus.DEMO, LeadStatus.NEGOTIATION, LeadStatus.ADMITTED] as LeadStatus[]).includes(l.status)
    ).length;
    const applicationLeads = leads.filter((l) => l.applications.length > 0).length;
    const approvedLeads = leads.filter((l) =>
      l.applications.some((a) => a.stage === ApplicationStage.APPROVED || a.stage === ApplicationStage.CONVERTED)
    ).length;
    const convertedLeads = leads.filter(
      (l) => l.status === LeadStatus.ADMITTED || l.applications.some((a) => a.stage === ApplicationStage.CONVERTED)
    ).length;
    const lostLeads = leads.filter((l) => l.status === LeadStatus.LOST).length;

    const calcPct = (count: number) => (totalLeads > 0 ? Number(((count / totalLeads) * 100).toFixed(1)) : 0);

    const funnelStages = [
      { stage: "Lead", count: totalLeads, percentage: 100 },
      { stage: "Contacted", count: contactedLeads, percentage: calcPct(contactedLeads) },
      { stage: "Follow-up", count: followUpLeads, percentage: calcPct(followUpLeads) },
      { stage: "Interested", count: interestedLeads, percentage: calcPct(interestedLeads) },
      { stage: "Application", count: applicationLeads, percentage: calcPct(applicationLeads) },
      { stage: "Admission", count: approvedLeads, percentage: calcPct(approvedLeads) },
      { stage: "Converted", count: convertedLeads, percentage: calcPct(convertedLeads) },
      { stage: "Lost", count: lostLeads, percentage: calcPct(lostLeads) },
    ];

    // Counselor conversions
    const counselorMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      role: string;
      assignedLeads: number;
      admittedCount: number;
      revenuePaise: number;
      pendingFollowUps: number;
    }>();

    for (const staff of staffUsers) {
      counselorMap.set(staff.id, {
        id: staff.id,
        name: `${staff.firstName} ${staff.lastName}`.trim(),
        email: staff.email,
        role: staff.roleCode,
        assignedLeads: 0,
        admittedCount: 0,
        revenuePaise: 0,
        pendingFollowUps: 0,
      });
    }

    const now = new Date();
    for (const lead of leads) {
      const counselorId = lead.assignedCounselorId || lead.assignedToId || lead.assignedTelecallerId;
      if (counselorId && counselorMap.has(counselorId)) {
        const item = counselorMap.get(counselorId)!;
        item.assignedLeads++;
        const isAdmitted =
          lead.status === LeadStatus.ADMITTED ||
          lead.applications.some((a) => a.stage === ApplicationStage.APPROVED || a.stage === ApplicationStage.CONVERTED);
        if (isAdmitted) {
          item.admittedCount++;
        }
        for (const app of lead.applications) {
          for (const payment of app.payments) {
            item.revenuePaise += payment.amount;
          }
        }
        if (lead.nextFollowUp && lead.nextFollowUp < now && lead.status !== LeadStatus.ADMITTED && lead.status !== LeadStatus.LOST) {
          item.pendingFollowUps++;
        }
      }
    }

    const counselors = Array.from(counselorMap.values()).map((c) => ({
      ...c,
      conversionRate: c.assignedLeads > 0 ? Number(((c.admittedCount / c.assignedLeads) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.assignedLeads - a.assignedLeads);

    // Course performance
    const courseMap = new Map<string, {
      id: string;
      title: string;
      leadsCount: number;
      applicationsCount: number;
      admissionsCount: number;
      revenuePaise: number;
    }>();

    for (const course of allCourses) {
      courseMap.set(course.id, {
        id: course.id,
        title: course.title,
        leadsCount: 0,
        applicationsCount: 0,
        admissionsCount: 0,
        revenuePaise: 0,
      });
    }

    for (const lead of leads) {
      const courseId = lead.interestedCourseId;
      if (courseId && courseMap.has(courseId)) {
        const item = courseMap.get(courseId)!;
        item.leadsCount++;
        item.applicationsCount += lead.applications.length;
        const isAdmitted =
          lead.status === LeadStatus.ADMITTED ||
          lead.applications.some((a) => a.stage === ApplicationStage.APPROVED || a.stage === ApplicationStage.CONVERTED);
        if (isAdmitted) {
          item.admissionsCount++;
        }
        for (const app of lead.applications) {
          for (const payment of app.payments) {
            item.revenuePaise += payment.amount;
          }
        }
      }
    }

    const courses = Array.from(courseMap.values()).map((c) => ({
      ...c,
      conversionRate: c.leadsCount > 0 ? Number(((c.admissionsCount / c.leadsCount) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.leadsCount - a.leadsCount);

    // Aggregate summary
    const totalMarketingRevenuePaise = channels.reduce((acc, ch) => acc + ch.revenuePaise, 0);
    const overallConversionRate = totalLeads > 0 ? Number(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;

    return {
      channels,
      funnelStages,
      counselors,
      courses,
      summary: {
        totalLeads,
        totalContacted: contactedLeads,
        totalApplications: applicationLeads,
        totalAdmissions: convertedLeads,
        overallConversionRate,
        totalMarketingRevenuePaise,
      },
    };
  }
}
