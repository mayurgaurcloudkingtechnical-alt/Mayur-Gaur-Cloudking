import { db } from "@/server/db/client";
import {
  LeadSource,
  LeadStatus,
  UserRoleCode,
  NotificationType,
  NotificationPriority,
} from "@prisma/client";
import { normalizePhone, normalizeEmail } from "./crm-lead.service";
import { OmnichannelInboxService } from "./omnichannel-inbox.service";
import { FollowUpAutomationService } from "./follow-up-automation.service";
import { crmEventBus } from "./crm-event-bus.service";
import { AuthenticatedUser } from "@/server/auth/rbac";

export interface UniversalLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  qualification?: string;
  source: LeadSource;
  captureMethod?:
    | "MANUAL_COUNSELOR"
    | "MANUAL_TELECALLER"
    | "BULK_CSV_XLSX"
    | "INBOUND_CALL"
    | "OUTBOUND_CALL"
    | "AI_VOICE"
    | "AI_CHATBOT"
    | "WEBSITE_FORM"
    | "WHATSAPP"
    | "META_ADS"
    | "GOOGLE_ADS"
    | "JUSTDIAL"
    | "API_WEBHOOK"
    | "FRANCHISE_INQUIRY"
    | string;
  actorId?: string;
  actorName?: string;
  actorRole?: UserRoleCode;
  aiAgentId?: string;
  importBatchId?: string;
  sourceEventId?: string;
  sourceEventTime?: Date | string | null;
  interestedCourseId?: string;
  interestedCourseName?: string;
  pipelineStage?: string;
  serviceCategory?: string;
  notes?: string;
  campaignName?: string;
  adsetName?: string;
  adCreativeName?: string;
  keywordSearch?: string;
  landingPageUrl?: string;
  assignedToId?: string;
  assignedCounselorId?: string;
  assignedTelecallerId?: string;
  nextFollowUp?: Date | null;
  qualityScore?: string;
  forceReassign?: boolean;
  rawPayload?: any;
}

export interface IngestLeadPayload extends UniversalLeadPayload {}

export interface BulkImportInput {
  leads: Array<{
    fullName: string;
    phone: string;
    email?: string;
    city?: string;
    qualification?: string;
    courseName?: string;
    source?: LeadSource;
    notes?: string;
  }>;
  fileName?: string;
  source?: LeadSource;
  campaignName?: string;
}

export interface CallIngestInput {
  contactName: string;
  contactPhone: string;
  callType?: "OUTGOING" | "INCOMING" | "MISSED" | "REJECTED";
  direction?: "INBOUND" | "OUTBOUND";
  callStatus?: "CONNECTED" | "BUSY" | "NO_ANSWER" | "FAILED" | "INITIATED";
  disposition: string;
  durationSeconds: number;
  notes?: string;
  nextFollowUpDate?: Date;
  leadId?: string;
  recordingUrl?: string;
  transcript?: any;
}

export class CrmIngestionService {
  /**
   * UNIVERSAL CENTRALIZED LEAD INGESTION PIPELINE
   * Handles all manual entries, bulk imports, webhooks, calls, and AI leads.
   */
  static async ingestUniversalLead(payload: UniversalLeadPayload) {
    const cleanPhone = normalizePhone(payload.phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error(`Invalid phone number: '${payload.phone}'. 10 digits required.`);
    }

    const cleanEmail =
      payload.email && payload.email.trim().length > 0
        ? normalizeEmail(payload.email)
        : `${cleanPhone}@lead.softlabglobal.com`;

    const fullName = payload.fullName?.trim() || "Prospect Inquiry";
    const city = payload.city?.trim() || null;
    const qualification = payload.qualification?.trim() || null;

    // Course resolution
    let matchedCourseId = payload.interestedCourseId || null;
    if (!matchedCourseId && payload.interestedCourseName) {
      const course = await db.course.findFirst({
        where: {
          OR: [
            { title: { contains: payload.interestedCourseName, mode: "insensitive" } },
            { courseCode: { contains: payload.interestedCourseName, mode: "insensitive" } },
            { slug: { contains: payload.interestedCourseName.toLowerCase().replace(/\s+/g, "-") } },
          ],
        },
        select: { id: true },
      });
      if (course) matchedCourseId = course.id;
    }

    // Capture and event timing
    const captureMethod = payload.captureMethod || "WEBSITE_FORM";
    const originalEventTime = payload.sourceEventTime ? new Date(payload.sourceEventTime) : null;
    const receiptTime = new Date();

    // 1. DEDUPLICATION CHECK
    const existingLead = await db.lead.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, ...(cleanEmail ? [{ email: cleanEmail }] : [])],
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (existingLead) {
      // FIX CRUCIAL BUG: Ensure the user who re-engaged the lead has visibility
      let updatedAssignedToId = existingLead.assignedToId;
      let updatedCounselorId = existingLead.assignedCounselorId;
      let updatedTelecallerId = existingLead.assignedTelecallerId;

      if (payload.actorRole === UserRoleCode.COUNSELOR && payload.actorId) {
        updatedCounselorId = payload.actorId;
        if (!updatedAssignedToId || payload.forceReassign) {
          updatedAssignedToId = payload.actorId;
        }
      } else if (payload.actorRole === UserRoleCode.TELECALLER && payload.actorId) {
        updatedTelecallerId = payload.actorId;
        if (!updatedAssignedToId || payload.forceReassign) {
          updatedAssignedToId = payload.actorId;
        }
      } else if (payload.assignedToId) {
        updatedAssignedToId = payload.assignedToId;
      }

      const updatedNotes = payload.notes
        ? `${existingLead.notes || ""}\n[Re-inquiry via ${payload.source} on ${receiptTime.toISOString()}]: ${payload.notes}`.trim()
        : existingLead.notes;

      const updated = await db.lead.update({
        where: { id: existingLead.id },
        data: {
          notes: updatedNotes,
          interestedCourseId: matchedCourseId || existingLead.interestedCourseId,
          campaignName: payload.campaignName || existingLead.campaignName,
          adsetName: payload.adsetName || existingLead.adsetName,
          adCreativeName: payload.adCreativeName || existingLead.adCreativeName,
          city: city || existingLead.city,
          qualification: qualification || existingLead.qualification,
          assignedToId: updatedAssignedToId,
          assignedCounselorId: updatedCounselorId,
          assignedTelecallerId: updatedTelecallerId,
          lastHandledById: payload.actorId || existingLead.lastHandledById,
          nextFollowUp: payload.nextFollowUp || existingLead.nextFollowUp,
          qualityScore: payload.qualityScore || existingLead.qualityScore,
        },
      });

      // Audit Log
      await db.leadActivity.create({
        data: {
          leadId: existingLead.id,
          userId: payload.actorId || null,
          activityType: "NOTE_ADDED",
          disposition: "RE_ENGAGED",
          notes: `Re-engaged via ${payload.source} (${captureMethod}). Actor: ${payload.actorName || "System"}. Notes: ${payload.notes || "None"}`.trim(),
        },
      });

      // Omnichannel Timeline Event
      await OmnichannelInboxService.recordTimelineEvent({
        leadId: existingLead.id,
        eventType: "LEAD_RE_ENGAGED",
        source: payload.source,
        title: `Lead Re-engaged via ${payload.source}`,
        summary: payload.notes || `Re-enquiry captured through ${captureMethod}`,
        metadata: {
          campaign: payload.campaignName,
          source: payload.source,
          captureMethod,
          originalEventTime: originalEventTime?.toISOString(),
        },
      });

      // Real-time Event Publication
      crmEventBus.publish({
        type: "LEAD_UPDATED",
        leadId: existingLead.id,
        actorId: payload.actorId,
        actorName: payload.actorName,
        recipientUserIds: [
          ...(updatedAssignedToId ? [updatedAssignedToId] : []),
          ...(updatedCounselorId ? [updatedCounselorId] : []),
          ...(updatedTelecallerId ? [updatedTelecallerId] : []),
          ...(payload.actorId ? [payload.actorId] : []),
        ],
        payload: {
          leadId: existingLead.id,
          fullName: existingLead.fullName,
          phone: cleanPhone,
          status: updated.status,
          source: payload.source,
          isNew: false,
          duplicateUpdated: true,
        },
      });

      // Broadcast alerts
      await this.broadcastLeadNotification({
        leadId: existingLead.id,
        fullName,
        phone: cleanPhone,
        courseName: payload.interestedCourseName,
        city,
        source: payload.source,
        isNew: false,
        assignedUserId: updatedAssignedToId,
      });

      return {
        isNew: false,
        isDuplicate: true,
        duplicateUpdated: true,
        leadId: existingLead.id,
        lead: updated,
        assignedToId: updatedAssignedToId,
      };
    }

    // 2. NEW LEAD PERSISTENCE
    // Determine intelligent assignments
    const [telecallers, counselors] = await Promise.all([
      db.user.findMany({
        where: { roleCode: UserRoleCode.TELECALLER, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { updatedAt: "asc" },
      }),
      db.user.findMany({
        where: { roleCode: UserRoleCode.COUNSELOR, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { updatedAt: "asc" },
      }),
    ]);

    let assignedTelecallerId = payload.assignedTelecallerId || null;
    let assignedCounselorId = payload.assignedCounselorId || null;
    let primaryAssignedId = payload.assignedToId || null;

    if (payload.actorRole === UserRoleCode.COUNSELOR && payload.actorId) {
      assignedCounselorId = payload.actorId;
      if (!primaryAssignedId) primaryAssignedId = payload.actorId;
    } else if (payload.actorRole === UserRoleCode.TELECALLER && payload.actorId) {
      assignedTelecallerId = payload.actorId;
      if (!primaryAssignedId) primaryAssignedId = payload.actorId;
    }

    // Auto-assignment round-robin if unassigned
    if (!assignedTelecallerId && telecallers.length > 0) {
      assignedTelecallerId = telecallers[Math.floor(Math.random() * telecallers.length)].id;
      if (!primaryAssignedId) primaryAssignedId = assignedTelecallerId;
    }
    if (!assignedCounselorId && counselors.length > 0) {
      assignedCounselorId = counselors[Math.floor(Math.random() * counselors.length)].id;
      if (!primaryAssignedId) primaryAssignedId = assignedCounselorId;
    }

    // Fallback: Default to admin if still unassigned
    if (!primaryAssignedId) {
      const defaultAdmin = await db.user.findFirst({
        where: { roleCode: UserRoleCode.SUPER_ADMIN, status: "ACTIVE" },
        select: { id: true },
      });
      if (defaultAdmin) primaryAssignedId = defaultAdmin.id;
    }

    // Create Brand New Lead
    const newLead = await db.lead.create({
      data: {
        fullName,
        email: cleanEmail,
        phone: cleanPhone,
        city,
        qualification,
        source: payload.source,
        status: LeadStatus.NEW,
        qualityScore: payload.qualityScore || "WARM",
        temperature: payload.qualityScore === "HOT" ? "HOT" : "WARM",
        leadScore: payload.qualityScore === "HOT" ? 80 : 50,
        interestedCourseId: matchedCourseId,
        notes: payload.notes || `Captured via ${payload.source} (${captureMethod})`,
        campaignName: payload.campaignName || null,
        adsetName: payload.adsetName || null,
        adCreativeName: payload.adCreativeName || null,
        keywordSearch: payload.keywordSearch || null,
        landingPageUrl: payload.landingPageUrl || null,
        pipelineStage: payload.pipelineStage || "COURSE_ADMISSIONS",
        serviceCategory: payload.serviceCategory || "SOFTWARE",
        assignedToId: primaryAssignedId,
        assignedCounselorId,
        assignedTelecallerId,
        createdById: payload.actorId || null,
        captureMethod,
        importBatchId: payload.importBatchId || null,
        originalEventTime,
        aiAgentId: payload.aiAgentId || null,
        lastHandledById: payload.actorId || null,
        nextFollowUp: payload.nextFollowUp || null,
      },
      include: {
        course: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Create Audit Activity
    await db.leadActivity.create({
      data: {
        leadId: newLead.id,
        userId: payload.actorId || null,
        activityType: "WEBHOOK_INGESTED",
        disposition: "NEW_LEAD",
        notes: `New lead captured from ${payload.source} (${captureMethod}). Actor: ${payload.actorName || "System"}. Assigned to staff.`.trim(),
      },
    });

    // Record Unified Timeline Event
    await OmnichannelInboxService.recordTimelineEvent({
      leadId: newLead.id,
      eventType: "LEAD_CAPTURED",
      source: payload.source,
      title: `New Lead Captured via ${payload.source}`,
      summary: `Initial inquiry captured via ${captureMethod}. Lead ID: ${newLead.id}`,
      metadata: {
        campaign: payload.campaignName,
        source: payload.source,
        captureMethod,
        originalEventTime: originalEventTime?.toISOString(),
      },
    });

    // Schedule initial follow-up if date passed
    if (payload.nextFollowUp && payload.actorId) {
      await db.followUpHistory.create({
        data: {
          leadId: newLead.id,
          type: "CALL",
          notes: payload.notes || "Initial follow-up scheduled upon lead entry.",
          nextFollowUpDate: new Date(payload.nextFollowUp),
          performedById: payload.actorId,
        },
      }).catch(() => null);
    }

    // Auto-enroll in follow-up automation sequence
    try {
      await FollowUpAutomationService.enrollLeadInSequence(newLead.id);
    } catch (_) {}

    // Real-Time Event Publication
    crmEventBus.publish({
      type: "LEAD_CREATED",
      leadId: newLead.id,
      actorId: payload.actorId,
      actorName: payload.actorName,
      recipientUserIds: [
        ...(primaryAssignedId ? [primaryAssignedId] : []),
        ...(assignedCounselorId ? [assignedCounselorId] : []),
        ...(assignedTelecallerId ? [assignedTelecallerId] : []),
        ...(payload.actorId ? [payload.actorId] : []),
      ],
      payload: {
        leadId: newLead.id,
        fullName: newLead.fullName,
        phone: cleanPhone,
        status: newLead.status,
        source: payload.source,
        captureMethod,
        isNew: true,
      },
    });

    // Broadcast Alerts
    await this.broadcastLeadNotification({
      leadId: newLead.id,
      fullName,
      phone: cleanPhone,
      courseName: payload.interestedCourseName,
      city,
      source: payload.source,
      isNew: true,
      assignedUserId: primaryAssignedId,
    });

    return {
      isNew: true,
      isDuplicate: false,
      duplicateUpdated: false,
      leadId: newLead.id,
      lead: newLead,
      assignedToId: primaryAssignedId,
    };
  }

  /**
   * BULK LEAD INGESTION WITH COMPLETE AUDIT & ROW-LEVEL TRACKING
   */
  static async ingestBulkLeads(actor: AuthenticatedUser, input: BulkImportInput) {
    if (!input.leads || input.leads.length === 0) {
      throw new Error("No lead records provided for bulk import.");
    }

    if (input.leads.length > 2000) {
      throw new Error("Batch size limit exceeded. Maximum 2000 records permitted per upload batch.");
    }

    const batchCode = `SLG-IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    const batch = await db.leadImportBatch.create({
      data: {
        batchCode,
        uploaderId: actor.id,
        fileName: input.fileName || "bulk-leads-import.csv",
        source: input.source || LeadSource.BULK_UPLOAD,
        totalRows: input.leads.length,
        status: "PROCESSING",
      },
    });

    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;
    const errors: Array<{ row: number; phone: string; name: string; reason: string }> = [];

    for (let i = 0; i < input.leads.length; i++) {
      const item = input.leads[i];
      const rowNum = i + 1;

      try {
        if (!item.fullName || !item.fullName.trim()) {
          errors.push({
            row: rowNum,
            phone: item.phone || "N/A",
            name: "Empty Name",
            reason: "Lead full name is required",
          });
          failedCount++;
          continue;
        }

        const cleanPhone = normalizePhone(item.phone || "");
        if (!cleanPhone || cleanPhone.length < 10) {
          errors.push({
            row: rowNum,
            phone: item.phone || "Invalid",
            name: item.fullName,
            reason: "Mobile number must be at least 10 valid digits",
          });
          failedCount++;
          continue;
        }

        const res = await this.ingestUniversalLead({
          fullName: item.fullName.trim(),
          phone: cleanPhone,
          email: item.email?.trim() || undefined,
          city: item.city?.trim() || undefined,
          qualification: item.qualification?.trim() || undefined,
          interestedCourseName: item.courseName?.trim() || undefined,
          source: input.source || LeadSource.BULK_UPLOAD,
          captureMethod: "BULK_CSV_XLSX",
          actorId: actor.id,
          actorName: `${actor.firstName} ${actor.lastName}`.trim(),
          actorRole: actor.roleCode,
          importBatchId: batch.id,
          notes: item.notes?.trim() || `Bulk imported via batch ${batchCode}`,
        });

        if (res.isNew) {
          createdCount++;
        } else {
          updatedCount++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          phone: item.phone || "N/A",
          name: item.fullName || "N/A",
          reason: err.message || "Failed to process lead record",
        });
        failedCount++;
      }
    }

    // Finalize Batch Record
    const finalBatch = await db.leadImportBatch.update({
      where: { id: batch.id },
      data: {
        createdCount,
        updatedCount,
        failedCount,
        errorSummary: errors,
        status: failedCount === input.leads.length ? "FAILED" : "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Publish Batch Completion Event
    crmEventBus.publish({
      type: "BULK_IMPORT_COMPLETED",
      actorId: actor.id,
      actorName: `${actor.firstName} ${actor.lastName}`.trim(),
      payload: {
        batchId: finalBatch.id,
        batchCode: finalBatch.batchCode,
        totalRows: input.leads.length,
        createdCount,
        updatedCount,
        failedCount,
      },
    });

    return {
      success: true,
      batchId: finalBatch.id,
      batchCode: finalBatch.batchCode,
      totalRows: input.leads.length,
      createdCount,
      updatedCount,
      failedCount,
      errors,
      rowErrors: errors,
    };
  }

  /**
   * INBOUND & OUTBOUND CALL EVENT INGESTION & AUTO-MATCHING
   */
  static async ingestCallEvent(actor: AuthenticatedUser, input: CallIngestInput) {
    const cleanPhone = normalizePhone(input.contactPhone);
    const user = await db.user.findUnique({
      where: { id: actor.id },
      include: { staffProfile: true },
    });
    if (!user) throw new Error("Staff user not found");

    // Match or create lead
    let leadId = input.leadId || null;
    let isNewLead = false;

    if (!leadId && cleanPhone) {
      const existing = await db.lead.findFirst({
        where: { phone: { contains: cleanPhone.slice(-10) } },
        select: { id: true },
      });
      if (existing) {
        leadId = existing.id;
      }
    }

    // If caller does not exist and it's an incoming call or meaningful connected call, auto-ingest lead
    if (!leadId && cleanPhone.length >= 10) {
      const callSource = input.callType === "INCOMING" ? LeadSource.INBOUND_CALL : LeadSource.OUTBOUND_CALL;
      const res = await this.ingestUniversalLead({
        fullName: input.contactName?.trim() || "Inbound Phone Prospect",
        phone: cleanPhone,
        source: callSource,
        captureMethod: input.callType === "INCOMING" ? "INBOUND_CALL" : "OUTBOUND_CALL",
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`,
        actorRole: actor.roleCode,
        notes: `Call Logged: ${input.callType || "CALL"} (${input.disposition}). ${input.notes || ""}`.trim(),
        nextFollowUp: input.nextFollowUpDate,
      });
      leadId = res.leadId;
      isNewLead = res.isNew;
    }

    // Create StaffCallLog
    const callLog = await db.staffCallLog.create({
      data: {
        userId: actor.id,
        staffProfileId: user.staffProfile?.id || null,
        leadId,
        contactName: input.contactName.trim(),
        contactPhone: input.contactPhone.trim(),
        callType: input.callType || "OUTGOING",
        callStatus: input.callStatus || "CONNECTED",
        disposition: input.disposition,
        durationSeconds: Math.max(0, input.durationSeconds || 0),
        notes: input.notes?.trim() || null,
        nextFollowUpDate: input.nextFollowUpDate || null,
        roleCode: user.roleCode,
        recordingUrl: input.recordingUrl || null,
        transcript: input.transcript ? (typeof input.transcript === "string" ? JSON.parse(input.transcript) : input.transcript) : undefined,
      },
    });

    // Update lead activity & interaction date
    if (leadId) {
      await db.lead.update({
        where: { id: leadId },
        data: {
          lastInteraction: new Date(),
          callCount: { increment: 1 },
          lastHandledById: actor.id,
          ...(input.nextFollowUpDate ? { nextFollowUp: input.nextFollowUpDate } : {}),
        },
      });

      await db.leadActivity.create({
        data: {
          leadId,
          userId: actor.id,
          activityType: "CALL_CONNECTED",
          disposition: input.disposition,
          notes: `[Call Log: ${input.durationSeconds}s / ${input.callType}]: ${input.notes || input.disposition}`.trim(),
        },
      });

      if (input.nextFollowUpDate) {
        await db.followUpHistory.create({
          data: {
            leadId,
            type: "CALL",
            notes: input.notes?.trim() || `Follow-up scheduled from call disposition: ${input.disposition}`,
            nextFollowUpDate: input.nextFollowUpDate,
            performedById: actor.id,
          },
        }).catch(() => null);
      }
    }

    // Real-Time Event Publication
    crmEventBus.publish({
      type: "CALL_LOGGED",
      leadId: leadId || undefined,
      actorId: actor.id,
      actorName: `${actor.firstName} ${actor.lastName}`.trim(),
      payload: {
        callLogId: callLog.id,
        leadId,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        callType: input.callType,
        disposition: input.disposition,
        durationSeconds: input.durationSeconds,
        isNewLead,
      },
    });

    const finalLead = leadId
      ? await db.lead.findUnique({ where: { id: leadId } })
      : null;

    return { callLog, leadId, isNewLead, lead: finalLead };
  }

  /**
   * Backward-compatible delegation method for existing webhooks
   */
  static async ingestLead(payload: IngestLeadPayload) {
    return this.ingestUniversalLead(payload);
  }

  /**
   * Broadcasts lead alerts to Counselor, Director, Admin, and Super Admin
   */
  private static async broadcastLeadNotification(params: {
    leadId: string;
    fullName: string;
    phone: string;
    courseName?: string;
    city?: string | null;
    source: LeadSource;
    isNew: boolean;
    assignedUserId?: string | null;
  }) {
    try {
      const activeStakeholders = await db.user.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            {
              roleCode: {
                in: [
                  UserRoleCode.SUPER_ADMIN,
                  UserRoleCode.DIRECTOR,
                  UserRoleCode.ADMIN,
                  UserRoleCode.COUNSELOR,
                  UserRoleCode.TELECALLER,
                  UserRoleCode.MANAGER,
                ],
              },
            },
            ...(params.assignedUserId ? [{ id: params.assignedUserId }] : []),
          ],
        },
        select: { id: true, roleCode: true },
      });

      if (!activeStakeholders.length) return;

      let sourceLabel = params.source.replace(/_/g, " ");
      if (params.source === LeadSource.GOOGLE_ADS) {
        sourceLabel = "Google Ads";
      } else if (params.source === LeadSource.META_ADS_FB) {
        sourceLabel = "Meta Facebook Ads";
      } else if (params.source === LeadSource.META_ADS_IG) {
        sourceLabel = "Instagram Ads";
      } else if (params.source === LeadSource.META) {
        sourceLabel = "Meta Lead Ads";
      } else if (params.source === LeadSource.INBOUND_CALL) {
        sourceLabel = "Inbound Phone Call";
      }

      const title = params.isNew
        ? `🔥 [${sourceLabel}] New Lead: ${params.fullName}`
        : `🔄 [${sourceLabel}] Lead Re-Engaged: ${params.fullName}`;

      const courseText = params.courseName ? ` | Course: ${params.courseName}` : "";
      const cityText = params.city ? ` | City: ${params.city}` : "";
      const message = `${params.fullName} (${params.phone})${courseText}${cityText}. Immediate follow-up required!`;

      const uniqueUserMap = new Map<string, UserRoleCode>();
      for (const u of activeStakeholders) {
        uniqueUserMap.set(u.id, u.roleCode);
      }

      const notifications = Array.from(uniqueUserMap.entries()).map(([userId, roleCode]) => {
        const isStaff =
          roleCode === UserRoleCode.COUNSELOR || roleCode === UserRoleCode.TELECALLER;
        return {
          userId,
          title,
          message,
          type: NotificationType.ADMISSION,
          priority: params.isNew ? NotificationPriority.URGENT : NotificationPriority.HIGH,
          link: isStaff ? `/counselor/leads/${params.leadId}` : `/admin/leads`,
        };
      });

      await db.notification.createMany({
        data: notifications,
      });
    } catch (err) {
      console.error("[CrmIngestionService] Failed to broadcast lead notifications:", err);
    }
  }
}
