import { z } from "zod";
import { router, protectedProcedure, requireRoleProcedure } from "../init";
import { UserRoleCode, HiringSourceType, HiringProcessingStatus, HiringTrustPolicy } from "@prisma/client";
import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { HiringIngestionService } from "@/server/services/hiring-ingestion.service";
import { HiringPublicationService } from "@/server/services/hiring-publication.service";
import { HiringAutomationConfigService } from "@/server/services/hiring-automation-config.service";
import { AiHiringExtractionService } from "@/server/services/ai-hiring-extraction.service";

const authorizedRoles = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.PLACEMENT_OFFICER,
  UserRoleCode.MANAGER,
];

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

export const hiringAutomationRouter = router({
  // ==========================================
  // 1. INTEGRATION STATUS & DIAGNOSTICS
  // ==========================================
  getIntegrationStatus: requireRoleProcedure(authorizedRoles).query(async () => {
    return HiringAutomationConfigService.getIntegrationDiagnostics();
  }),

  // ==========================================
  // 2. AUTHORIZED HIRING SOURCES
  // ==========================================
  listSources: requireRoleProcedure(authorizedRoles).query(async () => {
    return db.hiringSource.findMany({
      include: {
        _count: { select: { messages: true, sourceReferences: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  createSource: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        name: z.string().min(2),
        sourceType: z.nativeEnum(HiringSourceType).default(HiringSourceType.WHATSAPP_GROUP),
        identifier: z.string().optional(),
        description: z.string().optional(),
        consentStatus: z.string().default("AUTHORIZED"),
        isEnabled: z.boolean().default(true),
        allowedCategories: z.array(z.string()).default([]),
        autoPublishTrust: z.boolean().default(false),
        minConfidence: z.number().min(0).max(1).default(0.85),
      })
    )
    .mutation(async ({ input }) => {
      return db.hiringSource.create({
        data: input,
      });
    }),

  updateSource: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        identifier: z.string().optional(),
        description: z.string().optional(),
        consentStatus: z.string().optional(),
        isEnabled: z.boolean().optional(),
        allowedCategories: z.array(z.string()).optional(),
        autoPublishTrust: z.boolean().optional(),
        minConfidence: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.hiringSource.update({
        where: { id },
        data,
      });
    }),

  deleteSource: requireRoleProcedure(authorizedRoles)
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.hiringSource.delete({
        where: { id: input.id },
      });
    }),

  // ==========================================
  // 3. INCOMING MESSAGES & INGESTION
  // ==========================================
  listIncomingMessages: requireRoleProcedure(authorizedRoles)
    .input(
      z
        .object({
          sourceId: z.string().optional(),
          status: z.nativeEnum(HiringProcessingStatus).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.incomingHiringMessage.findMany({
        where: {
          ...(input?.sourceId ? { sourceId: input.sourceId } : {}),
          ...(input?.status ? { processingStatus: input.status } : {}),
          ...(input?.search
            ? {
                OR: [
                  { rawText: { contains: input.search, mode: "insensitive" } },
                  { senderName: { contains: input.search, mode: "insensitive" } },
                  { senderPhone: { contains: input.search } },
                ],
              }
            : {}),
        },
        include: {
          source: { select: { id: true, name: true, sourceType: true } },
          extractedJob: {
            select: { id: true, jobTitle: true, companyName: true, status: true, confidenceScore: true },
          },
        },
        orderBy: { receivedAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  ingestRawMessage: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        sourceId: z.string().optional(),
        rawText: z.string().min(10),
        senderPhone: z.string().optional(),
        senderName: z.string().optional(),
        providerMessageId: z.string().optional(),
        channel: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return HiringIngestionService.processIncomingMessage(input);
    }),

  ingestBatchChatExport: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        sourceId: z.string().optional(),
        rawBatchText: z.string().min(20),
      })
    )
    .mutation(async ({ input }) => {
      return HiringIngestionService.processBatchChatExport(input.rawBatchText, input.sourceId);
    }),

  // ==========================================
  // 4. AI EXTRACTED JOBS & REVIEW QUEUE
  // ==========================================
  listExtractedJobs: requireRoleProcedure(authorizedRoles)
    .input(
      z
        .object({
          status: z.nativeEnum(HiringProcessingStatus).optional(),
          isSuspicious: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.extractedHiringJob.findMany({
        where: {
          ...(input?.status ? { status: input.status } : {}),
          ...(input?.isSuspicious !== undefined ? { isSuspicious: input.isSuspicious } : {}),
          ...(input?.search
            ? {
                OR: [
                  { jobTitle: { contains: input.search, mode: "insensitive" } },
                  { companyName: { contains: input.search, mode: "insensitive" } },
                  { location: { contains: input.search, mode: "insensitive" } },
                  { recruiterName: { contains: input.search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        include: {
          message: {
            include: { source: true },
          },
          jobDrive: { select: { id: true, title: true, slug: true, status: true } },
          verifiedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          changeProposals: true,
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  getExtractedJobById: requireRoleProcedure(authorizedRoles)
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return db.extractedHiringJob.findUnique({
        where: { id: input.id },
        include: {
          message: { include: { source: true } },
          jobDrive: { include: { company: true, recruiter: true } },
          verifiedBy: true,
          changeProposals: true,
        },
      });
    }),

  updateExtractedJob: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        id: z.string(),
        jobTitle: z.string().optional(),
        companyName: z.string().optional(),
        salaryPackage: z.string().optional(),
        location: z.string().optional(),
        workMode: z.string().optional(),
        experienceRequired: z.string().optional(),
        qualification: z.string().optional(),
        requiredSkills: z.array(z.string()).optional(),
        openingsCount: z.number().int().optional(),
        recruiterEmail: z.string().optional(),
        recruiterPhone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.extractedHiringJob.update({
        where: { id },
        data,
      });
    }),

  approveAndPublish: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        extractedJobId: z.string(),
        overrides: z
          .object({
            jobTitle: z.string().optional(),
            companyName: z.string().optional(),
            salaryPackage: z.string().optional(),
            location: z.string().optional(),
            openingsCount: z.number().int().optional(),
            deadline: z.date().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return HiringPublicationService.publishExtractedJobToCrm(
        asAuthUser(ctx.user),
        input.extractedJobId,
        input.overrides
      );
    }),

  rejectExtractedJob: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        extractedJobId: z.string(),
        rejectionReason: z.string().min(2),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db.extractedHiringJob.update({
        where: { id: input.extractedJobId },
        data: {
          status: "REJECTED",
          rejectionReason: input.rejectionReason,
          verifiedById: ctx.user.id,
          verifiedAt: new Date(),
        },
      });

      await db.incomingHiringMessage.update({
        where: { id: updated.messageId },
        data: { processingStatus: "REJECTED" },
      });

      return updated;
    }),

  retryExtraction: requireRoleProcedure(authorizedRoles)
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ input }) => {
      const msg = await db.incomingHiringMessage.findUnique({
        where: { id: input.messageId },
      });

      if (!msg) throw new Error("Message not found.");

      return HiringIngestionService.processIncomingMessage({
        sourceId: msg.sourceId || undefined,
        rawText: msg.rawText,
        senderPhone: msg.senderPhone || undefined,
        senderName: msg.senderName || undefined,
        providerMessageId: msg.providerMessageId || undefined,
        channel: msg.channel,
      });
    }),

  // ==========================================
  // 5. PROPOSALS & DUPLICATE MANAGEMENT
  // ==========================================
  listChangeProposals: requireRoleProcedure(authorizedRoles).query(async () => {
    return db.jobChangeProposal.findMany({
      include: {
        jobDrive: { include: { company: true } },
        extractedJob: { include: { message: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  reviewChangeProposal: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        proposalId: z.string(),
        action: z.enum(["APPROVE", "REJECT"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const prop = await db.jobChangeProposal.findUnique({
        where: { id: input.proposalId },
        include: { jobDrive: true },
      });

      if (!prop) throw new Error("Proposal not found.");

      if (input.action === "APPROVE") {
        const changes = prop.fieldChanges as Record<string, { old: any; new: any }>;
        const updateData: any = {};
        for (const [key, val] of Object.entries(changes)) {
          updateData[key] = val.new;
        }

        await db.jobDrive.update({
          where: { id: prop.jobDriveId },
          data: updateData,
        });

        return db.jobChangeProposal.update({
          where: { id: prop.id },
          data: {
            status: "APPROVED",
            reviewedById: ctx.user.id,
            reviewedAt: new Date(),
          },
        });
      }

      return db.jobChangeProposal.update({
        where: { id: prop.id },
        data: {
          status: "REJECTED",
          reviewedById: ctx.user.id,
          reviewedAt: new Date(),
        },
      });
    }),

  // ==========================================
  // 6. LOGS & SYSTEM SETTINGS
  // ==========================================
  listLogs: requireRoleProcedure(authorizedRoles)
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(50),
          level: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return db.hiringAutomationLog.findMany({
        where: {
          ...(input?.level ? { level: input.level } : {}),
        },
        include: {
          source: { select: { name: true } },
          message: { select: { rawText: true, senderPhone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit || 50,
      });
    }),

  getSettings: requireRoleProcedure(authorizedRoles).query(async () => {
    return HiringAutomationConfigService.getConfig();
  }),

  updateSettings: requireRoleProcedure(authorizedRoles)
    .input(
      z.object({
        trustPolicy: z.nativeEnum(HiringTrustPolicy).optional(),
        autoPublishMinScore: z.number().min(0.5).max(1.0).optional(),
        enableHinglishAi: z.boolean().optional(),
        rejectSuspicious: z.boolean().optional(),
        maxDailyIngestion: z.number().int().optional(),
        webhookSecret: z.string().min(8).optional(),
      })
    )
    .mutation(async ({ input }) => {
      return HiringAutomationConfigService.updateConfig(input);
    }),
});
