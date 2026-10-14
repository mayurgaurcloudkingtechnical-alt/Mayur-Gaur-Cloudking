import { db } from "@/server/db/client";
import { UserRoleCode } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AuditService } from "./audit.service";

export interface GeneratePlanOptions {
  runDate?: Date;
  forceRegenerate?: boolean;
}

export interface CustomTaskInput {
  title: string;
  description: string;
  department: string;
  assignedStaffId: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  dueDate: Date;
  targetQuantity?: number;
  expectedOutcome?: string;
  sourceType?: string;
}

export class DailyPlannerService {
  /**
   * Scans real CRM leads, applications, placement drives, and pending tasks
   * to deterministically propose prioritized tasks for Director review.
   */
  static async generateProposedDailyPlan(actor: AuthenticatedUser, options?: GeneratePlanOptions) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the Director or Super Admin can trigger daily work plan generation.",
      });
    }

    const targetDate = options?.runDate ? new Date(options.runDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const reportingStart = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000); // Past 24 hours
    const reportingEnd = new Date(targetDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    // Check if an existing run exists for today
    const existingRun = await db.taskGenerationRun.findFirst({
      where: { runDate: targetDate },
      include: {
        tasks: {
          include: {
            assignedStaff: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });

    if (existingRun && !options?.forceRegenerate) {
      return {
        run: existingRun,
        message: "Loaded existing daily work plan for this date.",
        isNew: false,
      };
    }

    // 1. Query Real CRM & Operational Metrics
    const now = new Date();

    const [
      overdueFollowUpLeads,
      unattendedNewLeads,
      pendingApplications,
      activeJobDrives,
      unverifiedDocuments,
      unverifiedPayments,
      counselorStaff,
      placementStaff,
      adminStaff,
    ] = await Promise.all([
      db.lead.findMany({
        where: {
          nextFollowUp: { lt: now },
          status: { notIn: ["LOST", "ADMITTED"] },
          isOptedOut: false,
        },
        take: 100,
        select: { id: true, fullName: true, phone: true, assignedCounselorId: true, assignedToId: true },
      }),
      db.lead.findMany({
        where: { status: "NEW", assignedToId: null, isOptedOut: false },
        take: 50,
        select: { id: true, fullName: true, phone: true, source: true },
      }),
      db.admissionApplication.findMany({
        where: { stage: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        take: 30,
        select: { id: true, applicationNumber: true, applicantName: true, counselorId: true },
      }),
      db.jobDrive.findMany({
        where: { status: "ACTIVE" },
        take: 20,
        select: { id: true, title: true, openingsCount: true, driveDate: true },
      }),
      db.staffDocument.findMany({
        where: { isVerified: false },
        take: 30,
        select: { id: true, title: true, staffId: true },
      }),
      db.studentRegistrationPayment.findMany({
        where: { paymentStatus: "PENDING" },
        take: 30,
        select: { id: true, transactionReference: true, amount: true },
      }),
      db.staffProfile.findMany({
        where: {
          department: { in: ["COUNSELING", "SALES", "TELECALLING", "ADMISSIONS"] },
          isActive: true,
        },
        include: { user: true },
      }),
      db.staffProfile.findMany({
        where: { department: { in: ["PLACEMENT"] }, isActive: true },
        include: { user: true },
      }),
      db.staffProfile.findMany({
        where: { department: { in: ["HR", "OPERATIONS", "FINANCE"] }, isActive: true },
        include: { user: true },
      }),
    ]);

    // Source Metrics Summary
    const sourceMetrics = {
      overdueFollowUpsCount: overdueFollowUpLeads.length,
      unattendedNewLeadsCount: unattendedNewLeads.length,
      pendingApplicationsCount: pendingApplications.length,
      activeJobDrivesCount: activeJobDrives.length,
      unverifiedDocumentsCount: unverifiedDocuments.length,
      unverifiedPaymentsCount: unverifiedPayments.length,
      activeCounselors: counselorStaff.length,
      activePlacementOfficers: placementStaff.length,
    };

    // 2. Create the TaskGenerationRun record
    const run = await db.taskGenerationRun.create({
      data: {
        runDate: targetDate,
        reportingStart,
        reportingEnd,
        status: "DIRECTOR_REVIEW",
        sourceMetrics,
      },
    });

    const tasksToCreate: any[] = [];
    const dateCode = targetDate.toISOString().slice(0, 10).replace(/-/g, "");
    const batchEntropy = Math.floor(100 + Math.random() * 900);
    let seq = 1;

    const getNextTaskCode = () => `TASK-${dateCode}-${String(seq++).padStart(3, "0")}-${batchEntropy}`;

    // A. Generate Counselors Tasks (Overdue Follow-ups Sprint)
    if (counselorStaff.length > 0 && overdueFollowUpLeads.length > 0) {
      const leadsPerCounselor = Math.max(1, Math.ceil(overdueFollowUpLeads.length / counselorStaff.length));
      counselorStaff.forEach((counselor, idx) => {
        const targetCount = Math.min(leadsPerCounselor, 25);
        tasksToCreate.push({
          taskCode: getNextTaskCode(),
          generationRunId: run.id,
          title: `Overdue Follow-up Sprint (${counselor.user.firstName} ${counselor.user.lastName})`,
          description: `Contact and resolve at least ${targetCount} overdue candidate follow-ups from the CRM lead queue today. Update disposition status and next schedule.`,
          department: "COUNSELING",
          sourceType: "CRM_OVERDUE_FOLLOWUP",
          assignedStaffId: counselor.id,
          reportingManagerId: counselor.reportingManagerId,
          priority: "HIGH",
          dueDate: new Date(targetDate.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM today
          targetQuantity: targetCount,
          expectedOutcome: `At least ${targetCount} scheduled calls logged in CRM with notes and next follow-up dates.`,
          status: "DIRECTOR_REVIEW",
          reportingDate: targetDate,
        });
      });
    }

    // B. Telecallers / Inbound Leads Ingestion Task
    if (unattendedNewLeads.length > 0 && counselorStaff.length > 0) {
      const primaryLeadOfficer = counselorStaff[0];
      tasksToCreate.push({
        taskCode: getNextTaskCode(),
        generationRunId: run.id,
        title: `Rapid Inbound Lead Qualification (${unattendedNewLeads.length} Leads Waiting)`,
        description: `There are ${unattendedNewLeads.length} new incoming website/campaign leads waiting unassigned. Verify contact details, qualify course interest, and route to academic counselors.`,
        department: "TELECALLING",
        sourceType: "CRM_NEW_UNATTENDED",
        assignedStaffId: primaryLeadOfficer.id,
        reportingManagerId: primaryLeadOfficer.reportingManagerId,
        priority: "CRITICAL",
        dueDate: new Date(targetDate.getTime() + 14 * 60 * 60 * 1000), // 2:00 PM
        targetQuantity: unattendedNewLeads.length,
        expectedOutcome: "Zero unassigned leads in queue; all converted to contacted/scheduled demos.",
        status: "DIRECTOR_REVIEW",
        reportingDate: targetDate,
      });
    }

    // C. Admissions Document Review Task
    if (pendingApplications.length > 0 && counselorStaff.length > 0) {
      const admissionsLead = counselorStaff[counselorStaff.length - 1];
      tasksToCreate.push({
        taskCode: getNextTaskCode(),
        generationRunId: run.id,
        title: `Admission Application Scrutiny & Approval (${pendingApplications.length} Pending)`,
        description: `Inspect ${pendingApplications.length} submitted admission applications. Validate marksheets, identity proof, course eligibility, and process approved enrollment conversions.`,
        department: "ADMISSIONS",
        sourceType: "CRM_ADMISSION_PIPELINE",
        assignedStaffId: admissionsLead.id,
        reportingManagerId: admissionsLead.reportingManagerId,
        priority: "HIGH",
        dueDate: new Date(targetDate.getTime() + 17 * 60 * 60 * 1000),
        targetQuantity: pendingApplications.length,
        expectedOutcome: "Applications transitioned to APPROVED or RETURNED_FOR_INFORMATION.",
        status: "DIRECTOR_REVIEW",
        reportingDate: targetDate,
      });
    }

    // D. Corporate Placement Drive Coordination Task
    if (activeJobDrives.length > 0 && placementStaff.length > 0) {
      placementStaff.forEach((placementOfficer) => {
        tasksToCreate.push({
          taskCode: getNextTaskCode(),
          generationRunId: run.id,
          title: `Campus Placement Drive Execution & Recruiter Follow-up`,
          description: `Coordinate with recruiters for ${activeJobDrives.length} active placement drives. Verify student candidate shortlists, resume dispatch, and schedule interview panels.`,
          department: "PLACEMENT",
          sourceType: "RECRUITER_VACANCY",
          assignedStaffId: placementOfficer.id,
          reportingManagerId: placementOfficer.reportingManagerId,
          priority: "HIGH",
          dueDate: new Date(targetDate.getTime() + 17 * 30 * 60 * 1000),
          targetQuantity: activeJobDrives.length,
          expectedOutcome: "All candidate nominations dispatched to recruiter portals and interview links confirmed.",
          status: "DIRECTOR_REVIEW",
          reportingDate: targetDate,
        });
      });
    }

    // E. HR & Operations Verification Task
    if ((unverifiedDocuments.length > 0 || unverifiedPayments.length > 0) && adminStaff.length > 0) {
      const opsStaff = adminStaff[0];
      tasksToCreate.push({
        taskCode: getNextTaskCode(),
        generationRunId: run.id,
        title: `Institutional Compliance & Staff KYC Reconciliation`,
        description: `Review ${unverifiedDocuments.length} pending employee KYC documents and verify ${unverifiedPayments.length} unconfirmed student registration payments against bank receipts.`,
        department: "OPERATIONS",
        sourceType: "HR_PENDING",
        assignedStaffId: opsStaff.id,
        reportingManagerId: opsStaff.reportingManagerId,
        priority: "MEDIUM",
        dueDate: new Date(targetDate.getTime() + 16 * 60 * 60 * 1000),
        targetQuantity: unverifiedDocuments.length + unverifiedPayments.length,
        expectedOutcome: "Student fee receipts verified and KYC documents approved.",
        status: "DIRECTOR_REVIEW",
        reportingDate: targetDate,
      });
    }

    // Batch create all proposed tasks
    const createdTasks = await Promise.all(
      tasksToCreate.map((t) =>
        db.dailyWorkTask.create({
          data: t,
          include: {
            assignedStaff: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        })
      )
    );

    // Update run with generated count
    await db.taskGenerationRun.update({
      where: { id: run.id },
      data: { generatedCount: createdTasks.length },
    });

    await AuditService.log({
      actorId: actor.id,
      action: "DAILY_WORK_PLAN_PROPOSED",
      resourceType: "TaskGenerationRun",
      resourceId: run.id,
      newData: { generatedCount: createdTasks.length, runDate: targetDate },
    });

    return {
      run: { ...run, tasks: createdTasks },
      message: `Generated ${createdTasks.length} prioritized tasks from live CRM reports for Director Review.`,
      isNew: true,
    };
  }

  /**
   * Director / Super Admin reviews, modifies, and approves the daily plan.
   * Tasks are transitioned to ASSIGNED and published to lower-management dashboards.
   */
  static async approveAndDistributePlan(
    actor: AuthenticatedUser,
    runId: string,
    reviewNotes?: string
  ) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the Director or Super Admin can approve and distribute daily work plans.",
      });
    }

    const run = await db.taskGenerationRun.findUnique({
      where: { id: runId },
      include: {
        tasks: {
          include: {
            assignedStaff: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!run) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Plan run not found." });
    }

    const now = new Date();

    // 1. Transition all tasks to ASSIGNED
    await db.dailyWorkTask.updateMany({
      where: { generationRunId: runId, status: "DIRECTOR_REVIEW" },
      data: {
        status: "ASSIGNED",
        approvedById: actor.id,
        approvedAt: now,
      },
    });

    // 2. Transition Run to APPROVED
    const updatedRun = await db.taskGenerationRun.update({
      where: { id: runId },
      data: {
        status: "APPROVED",
        approvedCount: run.tasks.length,
        reviewedById: actor.id,
        reviewedAt: now,
        reviewNotes: reviewNotes?.trim() || "Approved by Director for immediate team execution.",
      },
      include: {
        tasks: {
          include: {
            assignedStaff: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
      },
    });

    // 3. Notify assigned staff members via in-app Notification Center
    await Promise.all(
      run.tasks.map((task) =>
        db.notification.create({
          data: {
            userId: task.assignedStaff.userId,
            title: `New Daily Priority Assigned: ${task.title}`,
            message: `${task.description} (Due today by ${task.dueDate.toLocaleTimeString()})`,
            type: "SYSTEM",
            priority: task.priority === "CRITICAL" ? "URGENT" : "HIGH",
            link: "/admin/daily-reports",
            metadata: { taskId: task.id, taskCode: task.taskCode },
          },
        })
      )
    );

    await AuditService.log({
      actorId: actor.id,
      action: "DAILY_WORK_PLAN_APPROVED_AND_DISTRIBUTED",
      resourceType: "TaskGenerationRun",
      resourceId: runId,
      newData: { approvedCount: run.tasks.length, approvedBy: actor.email },
    });

    return updatedRun;
  }

  /**
   * Create custom Director directive task
   */
  static async createCustomTask(actor: AuthenticatedUser, input: CustomTaskInput) {
    const isAuthorized = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAuthorized) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied." });
    }

    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const taskCode = `TASK-${dateCode}-${randomCode}`;

    const task = await db.dailyWorkTask.create({
      data: {
        taskCode,
        title: input.title.trim(),
        description: input.description.trim(),
        department: input.department.toUpperCase().trim(),
        sourceType: input.sourceType || "DIRECTOR_DIRECTIVE",
        assignedStaffId: input.assignedStaffId,
        priority: input.priority,
        dueDate: input.dueDate,
        targetQuantity: input.targetQuantity,
        expectedOutcome: input.expectedOutcome?.trim(),
        status: "ASSIGNED",
        approvedById: actor.id,
        approvedAt: new Date(),
        reportingDate: new Date(),
      },
      include: {
        assignedStaff: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
      },
    });

    return task;
  }

  /**
   * Update task status by assigned employee or manager
   */
  static async updateTaskStatus(
    actor: AuthenticatedUser,
    taskId: string,
    status: string,
    notes?: string,
    completedQuantity?: number,
    evidenceUrl?: string
  ) {
    const task = await db.dailyWorkTask.findUnique({
      where: { id: taskId },
      include: { assignedStaff: true },
    });

    if (!task) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
    }

    const isAssigned = task.assignedStaff.userId === actor.id;
    const isManagerOrAdmin = (
      [
        UserRoleCode.SUPER_ADMIN,
        UserRoleCode.DIRECTOR,
        UserRoleCode.ADMIN,
        UserRoleCode.MANAGER,
      ] as UserRoleCode[]
    ).includes(actor.roleCode);

    if (!isAssigned && !isManagerOrAdmin) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify this task." });
    }

    const updated = await db.dailyWorkTask.update({
      where: { id: taskId },
      data: {
        status,
        ...(notes && { evidenceNotes: notes.trim() }),
        ...(completedQuantity !== undefined && { completedQuantity }),
        ...(evidenceUrl && { evidenceUrl: evidenceUrl.trim() }),
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    // Record status history audit
    await db.taskStatusHistory.create({
      data: {
        taskId,
        oldStatus: task.status,
        newStatus: status,
        actorId: actor.id,
        comment: notes?.trim(),
      },
    });

    return updated;
  }

  /**
   * List tasks for a given staff, department, or date
   */
  static async listTasks(params?: {
    staffId?: string;
    department?: string;
    date?: Date;
    status?: string;
    runId?: string;
  }) {
    return db.dailyWorkTask.findMany({
      where: {
        ...(params?.staffId ? { assignedStaffId: params.staffId } : {}),
        ...(params?.department ? { department: params.department } : {}),
        ...(params?.status ? { status: params.status } : {}),
        ...(params?.runId ? { generationRunId: params.runId } : {}),
        ...(params?.date
          ? {
              reportingDate: {
                gte: new Date(new Date(params.date).setHours(0, 0, 0, 0)),
                lte: new Date(new Date(params.date).setHours(23, 59, 59, 999)),
              },
            }
          : {}),
      },
      include: {
        assignedStaff: {
          include: { user: { select: { firstName: true, lastName: true, email: true } } },
        },
        approvedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }
}
