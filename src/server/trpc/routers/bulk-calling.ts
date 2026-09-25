import { router, requireRoleProcedure } from "../init";
import { z } from "zod";
import { UserRoleCode, CallingBatchStatus, CallingQueueStatus } from "@prisma/client";
import { db } from "@/server/db/client";
import { BulkCallingParserService, RawImportRow } from "@/server/services/bulk-calling-parser.service";
import { BulkCallingQueueService } from "@/server/services/bulk-calling-queue.service";
import { AiCallingAgentService } from "@/server/services/ai-calling-agent.service";
import { TRPCError } from "@trpc/server";

export const BULK_CALLING_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
  UserRoleCode.COUNSELOR,
  UserRoleCode.TELECALLER,
  UserRoleCode.MARKETING,
];

export const bulkCallingRouter = router({
  /**
   * 1. Get downloadable template structure
   */
  getTemplate: requireRoleProcedure(BULK_CALLING_ROLES).query(() => {
    return {
      headers: BulkCallingParserService.getTemplateHeaders(),
      sampleRows: BulkCallingParserService.getSampleRows(),
    };
  }),

  /**
   * 2. Pre-Upload Validation (Analyzes file without creating batch)
   */
  validateUpload: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(
      z.object({
        rows: z.array(
          z.object({
            name: z.string().optional(),
            phone: z.string(),
            alternatePhone: z.string().optional(),
            email: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            course: z.string().optional(),
            source: z.string().optional(),
            campaign: z.string().optional(),
            language: z.string().optional(),
            remarks: z.string().optional(),
            consent: z.union([z.string(), z.boolean(), z.number()]).optional(),
            customFields: z.any().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      if (input.rows.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uploaded file is empty. Please provide at least one row.",
        });
      }
      return BulkCallingParserService.validateRows(input.rows);
    }),

  /**
   * 3. Confirm Import & Create Calling Batch
   */
  createBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(
      z.object({
        batchName: z.string().min(2, "Batch name is required"),
        description: z.string().optional(),
        fileName: z.string().default("imported_leads.xlsx"),
        assignedToId: z.string().optional(),
        autoStart: z.boolean().default(false),
        callingHoursStart: z.string().default("10:00"),
        callingHoursEnd: z.string().default("19:00"),
        maxRetries: z.number().default(3),
        retryDelayMinutes: z.number().default(30),
        language: z.string().default("Hindi"),
        openingScript: z.string().optional(),
        systemPrompt: z.string().optional(),
        voiceProvider: z.string().default("SIMULATOR"),
        validatedRows: z.array(z.any()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.user;
      const rows = input.validatedRows;

      if (!rows || rows.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No records provided to import.",
        });
      }

      // Compute counts
      const totalRows = rows.length;
      let validRows = 0;
      let invalidRows = 0;
      let duplicateRows = 0;
      let skippedRows = 0;
      let callableRows = 0;

      rows.forEach((r) => {
        if (!r.isValid) invalidRows++;
        else validRows++;

        if (r.isDuplicateInBatch) duplicateRows++;
        if (!r.isCallable) skippedRows++;
        else callableRows++;
      });

      // Create BulkCallingBatch in database
      const batch = await db.bulkCallingBatch.create({
        data: {
          batchName: input.batchName,
          description: input.description,
          fileName: input.fileName,
          uploadedById: user.id,
          assignedToId: input.assignedToId || user.id,
          status: CallingBatchStatus.READY,
          totalRows,
          validRows,
          invalidRows,
          duplicateRows,
          skippedRows,
          callableRows,
          autoStart: input.autoStart,
          callingHoursStart: input.callingHoursStart,
          callingHoursEnd: input.callingHoursEnd,
          maxRetries: input.maxRetries,
          retryDelayMinutes: input.retryDelayMinutes,
          language: input.language,
          openingScript: input.openingScript,
          systemPrompt: input.systemPrompt,
          voiceProvider: input.voiceProvider,
        },
      });

      // Insert Queue Items sequentially
      const queueData = rows.map((r, idx) => ({
        batchId: batch.id,
        queuePosition: idx + 1,
        name: r.name || null,
        phone: r.phone,
        alternatePhone: r.alternatePhone || null,
        email: r.email || null,
        city: r.city || null,
        state: r.state || null,
        course: r.matchedCourseTitle || r.course || null,
        source: r.source || "BULK_UPLOAD",
        campaign: r.campaign || null,
        language: r.language || input.language,
        remarks: r.remarks || null,
        consentGiven: r.consentGiven !== false,
        customFields: r.customFields || undefined,
        status: r.isCallable ? CallingQueueStatus.QUEUED : CallingQueueStatus.SKIPPED,
        skipReason: r.skipReason || null,
      }));

      await db.callingQueueItem.createMany({
        data: queueData,
      });

      await db.callingAuditLog.create({
        data: {
          batchId: batch.id,
          userId: user.id,
          action: "BATCH_UPLOADED",
          details: {
            batchName: batch.batchName,
            total: totalRows,
            callable: callableRows,
            autoStart: input.autoStart,
          },
        },
      });

      // Auto-start if requested
      if (input.autoStart) {
        await BulkCallingQueueService.startBatch(batch.id, user.id);
      }

      return {
        success: true,
        batchId: batch.id,
        batchName: batch.batchName,
        callableCount: callableRows,
        status: input.autoStart ? CallingBatchStatus.RUNNING : CallingBatchStatus.READY,
      };
    }),

  /**
   * 4. List Calling Batches with Role-Based Isolation
   */
  listBatches: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(
      z.object({
        status: z.nativeEnum(CallingBatchStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(15),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.user;
      const isSuperAdminOrAdmin =
        user.roleCode === UserRoleCode.SUPER_ADMIN ||
        user.roleCode === UserRoleCode.DIRECTOR ||
        user.roleCode === UserRoleCode.ADMIN;

      const isManager = user.roleCode === UserRoleCode.MANAGER;

      const where: any = {};
      if (input.status) {
        where.status = input.status;
      }

      // Role isolation: Telecallers/Counselors only see their own uploaded or assigned batches
      if (!isSuperAdminOrAdmin && !isManager) {
        where.OR = [
          { uploadedById: user.id },
          { assignedToId: user.id },
        ];
      }

      const total = await db.bulkCallingBatch.count({ where });
      const items = await db.bulkCallingBatch.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              roleCode: true,
            },
          },
        },
      });

      return {
        items,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  /**
   * 5. Get Detailed Batch Metrics and Queue Items
   */
  getBatchDetails: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(
      z.object({
        batchId: z.string(),
        queueStatus: z.nativeEnum(CallingQueueStatus).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const batch = await db.bulkCallingBatch.findUnique({
        where: { id: input.batchId },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              roleCode: true,
            },
          },
        },
      });

      if (!batch) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Batch not found",
        });
      }

      const queueWhere: any = { batchId: input.batchId };
      if (input.queueStatus) {
        queueWhere.status = input.queueStatus;
      }

      const totalQueueItems = await db.callingQueueItem.count({ where: queueWhere });
      const queueItems = await db.callingQueueItem.findMany({
        where: queueWhere,
        orderBy: { queuePosition: "asc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          lead: {
            select: {
              id: true,
              status: true,
              qualityScore: true,
            },
          },
        },
      });

      // Progress percentage
      const totalEligible = batch.callableRows || 1;
      const progressPercent = Math.min(100, Math.round((batch.completedCalls / totalEligible) * 100));

      return {
        batch,
        progressPercent,
        queueItems,
        totalQueueItems,
        page: input.page,
        totalPages: Math.ceil(totalQueueItems / input.limit),
      };
    }),

  /**
   * 6. Batch Calling Controls (Start, Pause, Resume, Stop)
   */
  startBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return BulkCallingQueueService.startBatch(input.batchId, ctx.user.id);
    }),

  pauseBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return BulkCallingQueueService.pauseBatch(input.batchId, ctx.user.id);
    }),

  resumeBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return BulkCallingQueueService.resumeBatch(input.batchId, ctx.user.id);
    }),

  stopBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return BulkCallingQueueService.stopBatch(input.batchId, ctx.user.id);
    }),

  /**
   * 7. Delete / Cancel Batch
   */
  deleteBatch: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const batch = await db.bulkCallingBatch.findUnique({
        where: { id: input.batchId },
      });

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found" });
      }

      if (batch.status === CallingBatchStatus.RUNNING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please stop the active calling queue before deleting the batch.",
        });
      }

      await db.bulkCallingBatch.delete({
        where: { id: input.batchId },
      });

      return { success: true, message: "Batch and queue records deleted successfully" };
    }),

  /**
   * 8. Export Batch Results to Excel / CSV
   */
  exportBatchResults: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ batchId: z.string() }))
    .query(async ({ input }) => {
      const batch = await db.bulkCallingBatch.findUnique({
        where: { id: input.batchId },
        include: {
          records: {
            orderBy: { queuePosition: "asc" },
            include: { lead: true },
          },
        },
      });

      if (!batch) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Batch not found" });
      }

      const rows = batch.records.map((r) => ({
        Position: r.queuePosition,
        Name: r.name || "N/A",
        Phone: r.phone,
        AlternatePhone: r.alternatePhone || "",
        Email: r.email || "",
        City: r.city || "",
        State: r.state || "",
        Course: r.course || "",
        Source: r.source || "",
        Language: r.language || "",
        Consent: r.consentGiven ? "YES" : "NO",
        QueueStatus: r.status,
        CallOutcome: r.callOutcome || "NOT_CALLED",
        InterestLevel: r.interestLevel || "N/A",
        DurationSeconds: r.callDurationSeconds || 0,
        Attempts: r.attemptCount,
        CallbackTime: r.callbackTime ? new Date(r.callbackTime).toLocaleString("en-IN") : r.callbackTimeText || "",
        HumanHandoff: r.humanHandoffRequired ? "YES" : "NO",
        HandoffReason: r.handoffReason || "",
        ConversationSummary: r.conversationSummary || "",
        LmsLeadId: r.leadId || "",
        IsExistingLmsLead: r.isExistingLead ? "YES" : "NO",
      }));

      return {
        batchName: batch.batchName,
        fileName: `${batch.batchName.replace(/[^a-z0-9]/gi, "_")}_Results.csv`,
        rows,
      };
    }),

  /**
   * 9. Global AI Calling Configuration (Super Admin / Admin)
   */
  getGlobalConfig: requireRoleProcedure(BULK_CALLING_ROLES).query(async () => {
    let config = await db.aiCallingGlobalConfig.findUnique({
      where: { id: "global-config" },
    });

    const defaultOpening =
      "Namaste {name}, main SoftLab Global, Civil Lines Prayagraj ki AI assistant bol rahi hoon. Aapne {course} ke regarding enquiry ki thi...";

    if (!config) {
      config = await db.aiCallingGlobalConfig.create({
        data: {
          id: "global-config",
          callingHoursStart: "10:00",
          callingHoursEnd: "19:00",
          defaultConcurrency: 1,
          maxRetries: 3,
          retryDelayMinutes: 30,
          autoStartDefault: false,
          defaultProvider: "SIMULATOR",
          defaultLanguage: "hi-IN",
          defaultOpeningScript: defaultOpening,
          campusLocation: "Civil Lines, Prayagraj, Uttar Pradesh",
          corporateRecruitingPartnersCount: "1200+",
          placementClaim: "100% Placement Support & Dedicated Placement Cell",
          practicalProjectClaim: "Live Industry Projects & Git/GitHub Repositories",
          liveProjectClaim: "Real-world projects with dedicated mentorship",
          websiteUrl: "https://softlabglobal.com",
        },
      });
    } else if (config.defaultOpeningScript && config.defaultOpeningScript.includes("Noida")) {
      config = await db.aiCallingGlobalConfig.update({
        where: { id: "global-config" },
        data: {
          defaultOpeningScript: defaultOpening,
          campusLocation: "Civil Lines, Prayagraj, Uttar Pradesh",
        },
      });
    }

    const dncCount = await db.doNotCallNumber.count();
    return {
      ...config,
      corporateRecruitingPartnersCount: config.corporateRecruitingPartnersCount || "1200+",
      placementClaim: config.placementClaim || "100% Placement Support & Dedicated Placement Cell",
      practicalProjectClaim: config.practicalProjectClaim || "Live Industry Projects & Git/GitHub Repositories",
      liveProjectClaim: config.liveProjectClaim || "Real-world projects with dedicated mentorship",
      campusLocation: config.campusLocation || "Civil Lines, Prayagraj, Uttar Pradesh",
      websiteUrl: config.websiteUrl || "https://softlabglobal.com",
      dncCount,
    };
  }),

  updateGlobalConfig: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN])
    .input(
      z.object({
        callingHoursStart: z.string(),
        callingHoursEnd: z.string(),
        defaultConcurrency: z.number().min(1).max(10),
        maxRetries: z.number().min(1).max(5),
        retryDelayMinutes: z.number().min(5).max(120),
        autoStartDefault: z.boolean(),
        defaultProvider: z.string(),
        defaultLanguage: z.string(),
        defaultOpeningScript: z.string().optional(),
        defaultSystemPrompt: z.string().optional(),
        providerApiKey: z.string().optional(),
        providerApiSecret: z.string().optional(),
        providerPhone: z.string().optional(),
        corporateRecruitingPartnersCount: z.string().optional(),
        placementClaim: z.string().optional(),
        practicalProjectClaim: z.string().optional(),
        liveProjectClaim: z.string().optional(),
        campusLocation: z.string().optional(),
        websiteUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db.aiCallingGlobalConfig.upsert({
        where: { id: "global-config" },
        update: {
          ...input,
          updatedById: ctx.user.id,
        },
        create: {
          id: "global-config",
          ...input,
          updatedById: ctx.user.id,
        },
      });

      return { success: true, config: updated };
    }),

  /**
   * 10. AI Calling Identities Management (Super Admin / Admin / Counselors)
   */
  listIdentities: requireRoleProcedure(BULK_CALLING_ROLES).query(async () => {
    const users = await db.user.findMany({
      where: {
        roleCode: {
          in: BULK_CALLING_ROLES,
        },
      },
      include: {
        callingIdentity: true,
      },
      orderBy: { firstName: "asc" },
    });

    return users.map((u) => {
      const officialNum = u.callingIdentity?.officialNumber || u.callingNumber || u.phone || null;
      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        roleCode: u.roleCode,
        profilePhone: u.phone,
        profileCallingNumber: u.callingNumber,
        officialNumber: officialNum,
        providerNumber: u.callingIdentity?.providerNumber || officialNum,
        verificationStatus: u.callingIdentity?.verificationStatus || (officialNum ? "PENDING_VERIFICATION" : "UNVERIFIED"),
        voiceProfile: u.callingIdentity?.voiceProfile || "alloy",
        language: u.callingIdentity?.language || "hi-IN",
        isActive: u.callingIdentity?.isActive ?? true,
        callingPermission: u.callingIdentity?.callingPermission ?? true,
        updatedAt: u.callingIdentity?.updatedAt || u.updatedAt,
      };
    });
  }),

  upsertIdentity: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN])
    .input(
      z.object({
        userId: z.string(),
        officialNumber: z.string(),
        providerNumber: z.string().optional(),
        verificationStatus: z.enum(["VERIFIED", "PENDING_VERIFICATION", "UNVERIFIED"]).default("VERIFIED"),
        voiceProfile: z.string().default("alloy"),
        language: z.string().default("hi-IN"),
        isActive: z.boolean().default(true),
        callingPermission: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const cleanNumber = input.officialNumber.trim();
      // Sync to User record
      await db.user.update({
        where: { id: input.userId },
        data: { callingNumber: cleanNumber },
      });

      const identity = await db.aiCallingUserIdentity.upsert({
        where: { userId: input.userId },
        update: {
          officialNumber: cleanNumber,
          providerNumber: (input.providerNumber || cleanNumber).trim(),
          verificationStatus: input.verificationStatus,
          voiceProfile: input.voiceProfile,
          language: input.language,
          isActive: input.isActive,
          callingPermission: input.callingPermission,
        },
        create: {
          userId: input.userId,
          officialNumber: cleanNumber,
          providerNumber: (input.providerNumber || cleanNumber).trim(),
          verificationStatus: input.verificationStatus,
          voiceProfile: input.voiceProfile,
          language: input.language,
          isActive: input.isActive,
          callingPermission: input.callingPermission,
        },
      });

      return { success: true, identity };
    }),

  /**
   * 11. Do-Not-Call (DNC) Management
   */
  listDnc: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const total = await db.doNotCallNumber.count();
      const items = await db.doNotCallNumber.findMany({
        orderBy: { createdAt: "desc" },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });
      return { items, total };
    }),

  addDnc: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ phone: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const clean = input.phone.replace(/\D/g, "");
      await db.doNotCallNumber.upsert({
        where: { phone: clean },
        update: { reason: input.reason, addedById: ctx.user.id },
        create: { phone: clean, reason: input.reason, addedById: ctx.user.id },
      });
      return { success: true, message: `Number ${clean} added to Do-Not-Call registry` };
    }),

  removeDnc: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(z.object({ phone: z.string() }))
    .mutation(async ({ input }) => {
      await db.doNotCallNumber.deleteMany({
        where: { phone: input.phone },
      });
      return { success: true, message: "Number removed from Do-Not-Call registry" };
    }),

  /**
   * 12. Interactive AI Call Simulator (For Testing and Acceptance Verification)
   */
  simulateCallTurn: requireRoleProcedure(BULK_CALLING_ROLES)
    .input(
      z.object({
        leadName: z.string().optional(),
        phone: z.string().default("9876543210"),
        courseTitle: z.string().default("AI & Machine Learning Masterclass"),
        language: z.string().default("Hindi"),
        scenario: z
          .enum([
            "INTERESTED_STUDENT",
            "WORKING_PRO_WEEKEND",
            "CALL_BACK_TOMORROW",
            "HUMAN_HANDOFF",
            "NOT_INTERESTED",
            "PRICE_QUERY",
            "BEGINNER_NON_TECH",
            "LOCATION_QUERY",
            "PRACTICAL_TRAINING_QUERY",
            "PLACEMENT_QUERY",
          ])
          .default("INTERESTED_STUDENT"),
      })
    )
    .mutation(async ({ input }) => {
      return AiCallingAgentService.simulateRealisticCall({
        leadName: input.leadName,
        phone: input.phone,
        courseTitle: input.courseTitle,
        language: input.language,
        simulatedScenario: input.scenario,
      });
    }),
});
