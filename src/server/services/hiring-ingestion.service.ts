import { db } from "@/server/db/client";
import crypto from "crypto";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { AiHiringExtractionService } from "./ai-hiring-extraction.service";
import { HiringDuplicateDetectionService } from "./hiring-duplicate-detection.service";
import { HiringPublicationService } from "./hiring-publication.service";
import { HiringAutomationConfigService } from "./hiring-automation-config.service";
import { HiringSourceType, HiringProcessingStatus, HiringTrustPolicy } from "@prisma/client";

export interface IngestMessageInput {
  sourceId?: string;
  rawText: string;
  senderPhone?: string;
  senderName?: string;
  providerMessageId?: string;
  channel?: string;
}

export class HiringIngestionService {
  /**
   * Generates SHA-256 content hash of normalized message
   */
  public static computeHash(text: string): string {
    const normalized = text.trim().toLowerCase().replace(/\s+/g, " ");
    return crypto.createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Validates HMAC-SHA256 signature from external webhook headers
   */
  public static verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    const cleanSig = signature.replace(/^sha256=/i, "").trim();
    const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(cleanSig), Buffer.from(computed));
  }

  /**
   * Primary ingestion pipeline for an incoming message
   */
  public static async processIncomingMessage(input: IngestMessageInput) {
    const rawText = input.rawText?.trim();
    if (!rawText || rawText.length < 15) {
      return { success: false, reason: "Message too short or empty." };
    }

    const contentHash = this.computeHash(rawText);

    // 1. Check for active/authorized source if sourceId provided
    let source = null;
    if (input.sourceId) {
      source = await db.hiringSource.findUnique({ where: { id: input.sourceId } });
      if (source && !source.isEnabled) {
        return { success: false, reason: `Source '${source.name}' is currently paused/disabled.` };
      }
    }

    // 2. Idempotency Check on providerMessageId
    if (input.providerMessageId) {
      const existing = await db.incomingHiringMessage.findUnique({
        where: { providerMessageId: input.providerMessageId },
      });
      if (existing) {
        return { success: true, messageId: existing.id, status: "ALREADY_PROCESSED" };
      }
    }

    // 3. Pre-evaluation: Is this recruitment content?
    const evalResult = AiHiringExtractionService.isRecruitmentContent(rawText);

    if (!evalResult.isJob) {
      const rejectedMsg = await db.incomingHiringMessage.create({
        data: {
          sourceId: source?.id,
          providerMessageId: input.providerMessageId,
          contentHash,
          rawText,
          senderPhone: input.senderPhone,
          senderName: input.senderName,
          channel: input.channel || "WHATSAPP",
          processingStatus: "REJECTED",
          errorMessage: evalResult.reason,
        },
      });

      if (source) {
        await db.hiringSource.update({
          where: { id: source.id },
          data: {
            totalReceived: { increment: 1 },
            lastMessageAt: new Date(),
          },
        });
      }

      await db.hiringAutomationLog.create({
        data: {
          sourceId: source?.id,
          messageId: rejectedMsg.id,
          level: "INFO",
          event: "NON_JOB_MESSAGE_IGNORED",
          details: { reason: evalResult.reason },
        },
      });

      return { success: true, messageId: rejectedMsg.id, status: "IGNORED_NON_JOB", reason: evalResult.reason };
    }

    // 4. Save message as AI_PROCESSING
    const message = await db.incomingHiringMessage.create({
      data: {
        sourceId: source?.id,
        providerMessageId: input.providerMessageId,
        contentHash,
        rawText,
        senderPhone: input.senderPhone,
        senderName: input.senderName,
        channel: input.channel || "WHATSAPP",
        processingStatus: "AI_PROCESSING",
      },
    });

    if (source) {
      await db.hiringSource.update({
        where: { id: source.id },
        data: {
          totalReceived: { increment: 1 },
          lastMessageAt: new Date(),
        },
      });
    }

    // 5. Extract structured job details
    const extractedData = await AiHiringExtractionService.extractJobDetails(rawText);

    // 6. Duplicate Detection
    const dupResult = await HiringDuplicateDetectionService.checkForDuplicates(extractedData, contentHash);

    if (dupResult.isDuplicate && !dupResult.hasProposedChanges) {
      // Mark message as duplicate
      await db.incomingHiringMessage.update({
        where: { id: message.id },
        data: {
          processingStatus: "DUPLICATE",
          duplicateOfId: dupResult.matchedExtractedJobId ? undefined : undefined,
        },
      });

      // Cross-link source reference if linked to an active JobDrive
      if (dupResult.matchedJobDriveId) {
        await db.jobSourceReference.create({
          data: {
            jobDriveId: dupResult.matchedJobDriveId,
            messageId: message.id,
            sourceId: source?.id,
          },
        });
      }

      await db.hiringAutomationLog.create({
        data: {
          sourceId: source?.id,
          messageId: message.id,
          level: "WARN",
          event: "DUPLICATE_MESSAGE_PREVENTED",
          details: {
            matchType: dupResult.matchType,
            matchedJobDriveId: dupResult.matchedJobDriveId,
            matchedCompany: dupResult.matchedCompanyName,
          },
        },
      });

      return {
        success: true,
        messageId: message.id,
        status: "DUPLICATE_PREVENTED",
        matchedJobDriveId: dupResult.matchedJobDriveId,
      };
    }

    // 7. Save Extracted Job
    const extractedJob = await db.extractedHiringJob.create({
      data: {
        messageId: message.id,
        jobDriveId: dupResult.matchedJobDriveId,
        jobTitle: extractedData.jobTitle,
        companyName: extractedData.companyName,
        recruiterName: extractedData.recruiterName,
        recruiterDesignation: extractedData.recruiterDesignation,
        recruiterEmail: extractedData.recruiterEmail,
        recruiterPhone: extractedData.recruiterPhone,
        jobDescription: extractedData.jobDescription,
        requiredSkills: extractedData.requiredSkills,
        qualification: extractedData.qualification,
        eligibleBranches: extractedData.eligibleBranches,
        experienceRequired: extractedData.experienceRequired,
        isFresher: extractedData.isFresher,
        openingsCount: extractedData.openingsCount,
        salaryPackage: extractedData.salaryPackage,
        minSalary: extractedData.minSalary,
        maxSalary: extractedData.maxSalary,
        salaryType: extractedData.salaryType,
        currency: extractedData.currency,
        location: extractedData.location,
        workMode: extractedData.workMode,
        employmentType: extractedData.employmentType,
        shift: extractedData.shift,
        deadline: extractedData.deadline,
        interviewDate: extractedData.interviewDate,
        applicationMethod: extractedData.applicationMethod,
        applicationEmail: extractedData.applicationEmail,
        applicationLink: extractedData.applicationLink,
        companyWebsite: extractedData.companyWebsite,
        requiredDocuments: extractedData.requiredDocuments,
        feesMentioned: extractedData.feesMentioned,
        feeDetails: extractedData.feeDetails,
        isSuspicious: extractedData.isSuspicious,
        suspicionReason: extractedData.suspicionReason,
        confidenceScore: extractedData.confidenceScore,
        missingFields: extractedData.missingFields,
        status: "PENDING_VERIFICATION",
      },
    });

    if (source) {
      await db.hiringSource.update({
        where: { id: source.id },
        data: { totalExtracted: { increment: 1 } },
      });
    }

    // 8. If duplicate with proposed changes, record JobChangeProposal
    if (dupResult.isDuplicate && dupResult.hasProposedChanges && dupResult.matchedJobDriveId) {
      await db.jobChangeProposal.create({
        data: {
          jobDriveId: dupResult.matchedJobDriveId,
          extractedJobId: extractedJob.id,
          fieldChanges: dupResult.proposedChanges as any,
          status: "PENDING",
        },
      });

      await db.incomingHiringMessage.update({
        where: { id: message.id },
        data: { processingStatus: "UPDATED" },
      });

      await db.hiringAutomationLog.create({
        data: {
          sourceId: source?.id,
          messageId: message.id,
          level: "INFO",
          event: "JOB_CHANGE_PROPOSAL_CREATED",
          details: dupResult.proposedChanges,
        },
      });

      return {
        success: true,
        messageId: message.id,
        extractedJobId: extractedJob.id,
        status: "UPDATE_PROPOSED",
        proposedChanges: dupResult.proposedChanges,
      };
    }

    // 9. Trust Policy Check: Auto-publish or Pending Verification
    const config = await HiringAutomationConfigService.getConfig();
    const canAutoPublish =
      config.trustPolicy === HiringTrustPolicy.CONTROLLED_AUTO_PUBLISH &&
      source?.autoPublishTrust === true &&
      extractedData.confidenceScore >= config.autoPublishMinScore &&
      !extractedData.isSuspicious;

    if (canAutoPublish) {
      // Find default super admin or system user
      const systemUser = await db.user.findFirst({
        where: { roleCode: "SUPER_ADMIN" },
      });

      if (systemUser) {
        await HiringPublicationService.publishExtractedJobToCrm(
          {
            id: systemUser.id,
            email: systemUser.email,
            roleCode: systemUser.roleCode,
            permissions: [],
            firstName: systemUser.firstName,
            lastName: systemUser.lastName,
          },
          extractedJob.id
        );

        return {
          success: true,
          messageId: message.id,
          extractedJobId: extractedJob.id,
          status: "AUTO_PUBLISHED",
        };
      }
    }

    // Default: Mark message as pending verification
    await db.incomingHiringMessage.update({
      where: { id: message.id },
      data: { processingStatus: "PENDING_VERIFICATION" },
    });

    await db.hiringAutomationLog.create({
      data: {
        sourceId: source?.id,
        messageId: message.id,
        level: "INFO",
        event: "JOB_EXTRACTED_PENDING_REVIEW",
        details: {
          title: extractedJob.jobTitle,
          company: extractedJob.companyName,
          confidence: extractedJob.confidenceScore,
          isSuspicious: extractedJob.isSuspicious,
        },
      },
    });

    return {
      success: true,
      messageId: message.id,
      extractedJobId: extractedJob.id,
      status: "PENDING_VERIFICATION",
      confidence: extractedJob.confidenceScore,
      isSuspicious: extractedJob.isSuspicious,
    };
  }

  /**
   * Splits and processes exported WhatsApp chat batch (.txt or pasted content)
   */
  public static async processBatchChatExport(rawBatchText: string, sourceId?: string) {
    const rawLines = rawBatchText.split(/\r?\n/);
    const messages: { sender?: string; text: string; date?: string }[] = [];

    // WhatsApp Export format:
    // [12/10/24, 2:30:15 PM] HR Name: Message body...
    // or: 12/10/24, 14:30 - HR Name: Message body...
    const msgRegex = /^(?:\[?(\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\]?\s*(?:-|:)?\s*)([^:]+):\s*(.*)$/;

    let currentMsg: { sender?: string; text: string; date?: string } | null = null;

    for (const line of rawLines) {
      const match = line.match(msgRegex);
      if (match) {
        if (currentMsg && currentMsg.text.trim()) {
          messages.push(currentMsg);
        }
        currentMsg = {
          date: match[1],
          sender: match[2]?.trim(),
          text: match[3] || "",
        };
      } else {
        if (currentMsg) {
          currentMsg.text += `\n${line}`;
        } else if (line.trim().length > 0) {
          currentMsg = { text: line };
        }
      }
    }

    if (currentMsg && currentMsg.text.trim()) {
      messages.push(currentMsg);
    }

    // Process each extracted message
    const results = [];
    for (const msg of messages) {
      if (msg.text.trim().length > 20) {
        const res = await this.processIncomingMessage({
          sourceId,
          rawText: msg.text.trim(),
          senderName: msg.sender,
          channel: "WHATSAPP_EXPORT",
        });
        results.push(res);
      }
    }

    return {
      totalMessagesParsed: messages.length,
      processedCount: results.length,
      results,
    };
  }
}
