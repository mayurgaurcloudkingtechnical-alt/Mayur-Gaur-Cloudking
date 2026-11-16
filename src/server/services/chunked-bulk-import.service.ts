import { LeadSource, LeadStatus } from "@prisma/client";
import * as ExcelJS from "exceljs";
import { db } from "@/server/db/client";
import { crmEventBus } from "./crm-event-bus.service";

export interface ImportActor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ParsedBulkLeadInput {
  fullName: string;
  phone: string;
  email?: string;
  city?: string;
  qualification?: string;
  courseTitle?: string;
  source?: string;
  notes?: string;
  leadDate?: string;
  campaign?: string;
  originalOwner?: string;
  rawRow?: Record<string, unknown>;
}

export interface CreateChunkedImportInput {
  fileName?: string;
  source?: LeadSource;
  chunkSize?: number;
  targetStatus?: LeadStatus;
  captureMethod?: string;
  leads: ParsedBulkLeadInput[];
}

const activeBatchWorkers = new Set<string>();

export function normalizeIndianPhone(raw: string | undefined | null): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function normalizeHeaderKey(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function mapRowObjectToLead(row: Record<string, unknown>): ParsedBulkLeadInput {
  const normalizedMap = new Map<string, string>();
  for (const [k, v] of Object.entries(row)) {
    const val = v == null ? "" : String(v).trim();
    if (val) normalizedMap.set(normalizeHeaderKey(k), val);
  }

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const found = normalizedMap.get(k);
      if (found) return found;
    }
    return "";
  };

  return {
    fullName: pick("candidatename", "fullname", "name", "studentname", "leadname"),
    phone: pick("10digitphone", "phone", "phonenumber", "mobile", "mobilenumber", "contact", "contactnumber", "whatsapp"),
    email: pick("email", "emailaddress", "emailid", "mail") || undefined,
    courseTitle: pick("coursetitle", "course", "coursename", "program", "interestedcourse") || undefined,
    city: pick("city", "location", "place") || undefined,
    qualification: pick("qualification", "education", "degree") || undefined,
    source: pick("source", "leadsource", "channel") || undefined,
    notes: pick("remarks", "notes", "comments", "description", "remark") || undefined,
    leadDate: pick("leaddate", "date", "createddate", "inquirydate") || undefined,
    campaign: pick("campaign", "campaignname") || undefined,
    originalOwner: pick("originalowner", "owner", "assignedto", "counselor") || undefined,
    rawRow: row,
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvText(rawText: string): ParsedBulkLeadInput[] {
  const cleaned = rawText.replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];

  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delimiter = tabCount > commaCount && tabCount >= semiCount ? "\t" : semiCount > commaCount ? ";" : ",";

  const firstCells = parseCsvLine(firstLine, delimiter);
  const looksLikeHeader = firstCells.some((c) =>
    /name|phone|mobile|email|course|city|source|remark|date|campaign|owner/i.test(c)
  );

  const headers = looksLikeHeader
    ? firstCells.map((h, idx) => h.trim() || `col_${idx}`)
    : ["Candidate Name", "10-Digit Phone", "Email", "Course Title", "City", "Source", "Remarks", "Lead Date", "Campaign", "Original Owner"];

  const startIdx = looksLikeHeader ? 1 : 0;
  const parsed: ParsedBulkLeadInput[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i], delimiter);
    if (cells.every((c) => !c)) continue;
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = cells[j] ?? "";
    }
    parsed.push(mapRowObjectToLead(obj));
  }

  return parsed;
}

export function parseFreeformText(rawText: string): ParsedBulkLeadInput[] {
  const trimmed = rawText.trim();
  if (!trimmed) return [];

  // JSON array / object support
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed);
      const arr = Array.isArray(json)
        ? json
        : Array.isArray(json.leads)
          ? json.leads
          : Array.isArray(json.records)
            ? json.records
            : Array.isArray(json.data)
              ? json.data
              : null;
      if (arr) {
        return arr
          .filter((item: unknown) => item && typeof item === "object")
          .map((item: Record<string, unknown>) => mapRowObjectToLead(item));
      }
    } catch {
      // fall through to delimited/line parser
    }
  }

  // Delimited CSV/TSV
  if (trimmed.includes(",") || trimmed.includes("\t") || trimmed.includes(";")) {
    const csvParsed = parseCsvText(trimmed);
    if (csvParsed.length > 0 && csvParsed.some((r) => r.fullName || r.phone)) {
      return csvParsed;
    }
  }

  // Line-by-line regex extraction (TXT / PDF extracted text)
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results: ParsedBulkLeadInput[] = [];
  for (const line of lines) {
    const phoneMatch = line.match(/(?:\+?91[\s-]?)?([6-9]\d{9}|\d{10})/);
    const emailMatch = line.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (!phoneMatch && !emailMatch) continue;
    let namePart = line;
    if (phoneMatch) namePart = namePart.replace(phoneMatch[0], " ");
    if (emailMatch) namePart = namePart.replace(emailMatch[0], " ");
    namePart = namePart.replace(/[|,\-;:/]+/g, " ").replace(/\s+/g, " ").trim();
    results.push({
      fullName: namePart || "Imported Candidate",
      phone: phoneMatch ? phoneMatch[1] : "",
      email: emailMatch ? emailMatch[0] : undefined,
      notes: `Extracted from text line`,
      rawRow: { line },
    });
  }
  return results;
}

export async function parseLeadFileBuffer(buffer: Buffer, fileName: string): Promise<ParsedBulkLeadInput[]> {
  const ext = (fileName.split(".").pop() || "").toLowerCase();

  if (ext === "xlsx" || ext === "xls") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const headers: string[] = [];
    const rows: ParsedBulkLeadInput[] = [];

    worksheet.eachRow((row, rowNumber) => {
      const values = (row.values as unknown[]).slice(1).map((v) => {
        if (v && typeof v === "object" && "text" in (v as Record<string, unknown>)) {
          return String((v as Record<string, unknown>).text || "").trim();
        }
        if (v && typeof v === "object" && "result" in (v as Record<string, unknown>)) {
          return String((v as Record<string, unknown>).result || "").trim();
        }
        return v == null ? "" : String(v).trim();
      });

      if (rowNumber === 1) {
        values.forEach((v, idx) => headers.push(v || `col_${idx}`));
        return;
      }

      if (values.every((v) => !v)) return;
      const obj: Record<string, unknown> = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx] ?? "";
      });
      rows.push(mapRowObjectToLead(obj));
    });

    return rows;
  }

  if (ext === "pdf") {
    // Extract readable ASCII/UTF-8 text strings from PDF streams for phone/email/name capture
    const rawLatin = buffer.toString("latin1");
    const textChunks = rawLatin.match(/\(([^()\\]{3,200})\)/g)?.map((s) => s.slice(1, -1)) || [];
    const combined = textChunks.length > 0 ? textChunks.join("\n") : buffer.toString("utf8");
    return parseFreeformText(combined);
  }

  const utf8Text = buffer.toString("utf8");
  return parseFreeformText(utf8Text);
}

function resolveLeadSource(rawSource?: string, fallback: LeadSource = LeadSource.BULK_UPLOAD): LeadSource {
  if (!rawSource) return fallback;
  const upper = rawSource.toUpperCase().replace(/[^A-Z_]/g, "_");
  if (upper in LeadSource) {
    return LeadSource[upper as keyof typeof LeadSource];
  }
  if (upper.includes("WHATSAPP")) return LeadSource.WHATSAPP;
  if (upper.includes("REFERRAL")) return LeadSource.REFERRAL;
  if (upper.includes("WALK")) return LeadSource.WALK_IN;
  if (upper.includes("WEB")) return LeadSource.WEBSITE;
  return fallback;
}

export class ChunkedBulkImportService {
  static async createAndStartJob(actor: ImportActor, input: CreateChunkedImportInput) {
    if (!input.leads || input.leads.length === 0) {
      throw new Error("No lead records provided for bulk import.");
    }

    const chunkSize = Math.min(1000, Math.max(100, input.chunkSize ?? 500));
    const totalRows = input.leads.length;
    const totalChunks = Math.ceil(totalRows / chunkSize);
    const batchCode = `SLG-IMP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    const batch = await db.leadImportBatch.create({
      data: {
        batchCode,
        uploaderId: actor.id,
        fileName: input.fileName || "bulk-leads-import.csv",
        source: input.source || LeadSource.BULK_UPLOAD,
        totalRows,
        processedRows: 0,
        createdCount: 0,
        updatedCount: 0,
        failedCount: 0,
        duplicateCount: 0,
        stagedOnHoldCount: 0,
        chunkSize,
        currentChunk: 0,
        totalChunks,
        status: "QUEUED",
      },
    });

    // Stage LeadImportRow records & run chunked processor asynchronously so POST returns immediately even for 100,000+ rows
    this.scheduleStagingAndWorker(batch.id, actor, input.leads, {
      targetStatus: input.targetStatus ?? LeadStatus.ON_HOLD,
      captureMethod: input.captureMethod || "BULK_CSV_XLSX",
      defaultSource: input.source ?? LeadSource.BULK_UPLOAD,
    });

    return batch;
  }

  static scheduleStagingAndWorker(
    batchId: string,
    actor: ImportActor,
    leads: ParsedBulkLeadInput[],
    options?: { targetStatus?: LeadStatus; captureMethod?: string; defaultSource?: LeadSource }
  ) {
    if (activeBatchWorkers.has(batchId)) return;
    activeBatchWorkers.add(batchId);

    setImmediate(async () => {
      try {
        await db.leadImportBatch.update({
          where: { id: batchId },
          data: { status: "PROCESSING", isPaused: false },
        });

        const STAGE_SIZE = 2000;
        for (let offset = 0; offset < leads.length; offset += STAGE_SIZE) {
          const slice = leads.slice(offset, offset + STAGE_SIZE);
          await db.leadImportRow.createMany({
            data: slice.map((item, idx) => {
              const rowIndex = offset + idx + 1;
              return {
                batchId,
                rowIndex,
                idempotencyKey: `${batchId}:${rowIndex}`,
                rawPayload: item as unknown as object,
                normalizedPhone: normalizeIndianPhone(item.phone),
                status: "PENDING",
              };
            }),
            skipDuplicates: true,
          });
        }

        await this.processLoop(batchId, actor, options);
      } catch (err) {
        await db.leadImportBatch.update({
          where: { id: batchId },
          data: {
            status: "FAILED",
            lastError: err instanceof Error ? err.message : "Staging/chunk worker crashed",
            completedAt: new Date(),
          },
        });
      } finally {
        activeBatchWorkers.delete(batchId);
      }
    });
  }

  static scheduleWorker(
    batchId: string,
    actor: ImportActor,
    options?: { targetStatus?: LeadStatus; captureMethod?: string; defaultSource?: LeadSource }
  ) {
    if (activeBatchWorkers.has(batchId)) return;
    activeBatchWorkers.add(batchId);

    setImmediate(() => {
      this.processLoop(batchId, actor, options)
        .catch(async (err) => {
          await db.leadImportBatch.update({
            where: { id: batchId },
            data: {
              status: "FAILED",
              lastError: err instanceof Error ? err.message : "Chunk worker crashed",
              completedAt: new Date(),
            },
          });
        })
        .finally(() => {
          activeBatchWorkers.delete(batchId);
        });
    });
  }

  private static async processLoop(
    batchId: string,
    actor: ImportActor,
    options?: { targetStatus?: LeadStatus; captureMethod?: string; defaultSource?: LeadSource }
  ) {
    const targetStatus = options?.targetStatus ?? LeadStatus.ON_HOLD;
    const captureMethod = options?.captureMethod || "BULK_CSV_XLSX";

    await db.leadImportBatch.update({
      where: { id: batchId },
      data: { status: "PROCESSING", isPaused: false },
    });

    while (true) {
      const batch = await db.leadImportBatch.findUnique({ where: { id: batchId } });
      if (!batch) break;

      if (batch.isCancelled) {
        await db.leadImportBatch.update({
          where: { id: batchId },
          data: { status: "CANCELLED", completedAt: new Date() },
        });
        break;
      }

      if (batch.isPaused) {
        await db.leadImportBatch.update({
          where: { id: batchId },
          data: { status: "PAUSED" },
        });
        break;
      }

      const pendingRows = await db.leadImportRow.findMany({
        where: { batchId, status: "PENDING" },
        orderBy: { rowIndex: "asc" },
        take: batch.chunkSize || 500,
      });

      if (pendingRows.length === 0) {
        const finalStatus =
          batch.failedCount > 0 && batch.createdCount === 0
            ? "FAILED"
            : batch.failedCount > 0
              ? "COMPLETED_WITH_ERRORS"
              : "COMPLETED";

        const completedBatch = await db.leadImportBatch.update({
          where: { id: batchId },
          data: {
            status: finalStatus,
            completedAt: new Date(),
          },
        });

        crmEventBus.publish({
          type: "BULK_IMPORT_COMPLETED",
          actorId: actor.id,
          actorName: `${actor.firstName} ${actor.lastName}`.trim(),
          payload: {
            batchId: completedBatch.id,
            batchCode: completedBatch.batchCode,
            totalRows: completedBatch.totalRows,
            createdCount: completedBatch.createdCount,
            duplicateCount: completedBatch.duplicateCount,
            failedCount: completedBatch.failedCount,
          },
        });
        break;
      }

      // 1. Validate & normalize chunk rows
      const phonesInChunk = Array.from(
        new Set(
          pendingRows
            .map((r) => normalizeIndianPhone((r.rawPayload as unknown as ParsedBulkLeadInput)?.phone))
            .filter((p) => p.length === 10)
        )
      );

      // 2. Single batch query for existing CRM leads matching any phone in this chunk
      const existingMatches = phonesInChunk.length
        ? await db.lead.findMany({
            where: { phone: { in: phonesInChunk } },
            select: { id: true, phone: true },
            orderBy: { createdAt: "asc" },
          })
        : [];

      const existingPhoneMap = new Map<string, string>();
      for (const m of existingMatches) {
        if (!existingPhoneMap.has(m.phone)) {
          existingPhoneMap.set(m.phone, m.id);
        }
      }

      const validInsertRows: Array<{
        rowId: string;
        rowIndex: number;
        isDuplicate: boolean;
        leadData: {
          fullName: string;
          phone: string;
          email: string;
          city: string | null;
          qualification: string | null;
          source: LeadSource;
          captureMethod: string;
          importBatchId: string;
          status: LeadStatus;
          duplicateOfLeadId: string | null;
          duplicateStatus: string;
          duplicateReviewMeta: object | undefined;
          notes: string;
        };
      }> = [];

      const failedRowUpdates: Array<{ id: string; reason: string; row: number; phone: string; name: string }> = [];

      for (const row of pendingRows) {
        const item = row.rawPayload as unknown as ParsedBulkLeadInput;
        const fullName = (item?.fullName || "").trim();
        const phone10 = normalizeIndianPhone(item?.phone);

        if (!fullName) {
          failedRowUpdates.push({
            id: row.id,
            row: row.rowIndex,
            phone: item?.phone || "N/A",
            name: "Empty Name",
            reason: "Candidate Name is required",
          });
          continue;
        }

        if (phone10.length !== 10) {
          failedRowUpdates.push({
            id: row.id,
            row: row.rowIndex,
            phone: item?.phone || "N/A",
            name: fullName,
            reason: "Valid 10-digit phone number is required",
          });
          continue;
        }

        const duplicateOfId = existingPhoneMap.get(phone10) || null;
        const isDuplicate = Boolean(duplicateOfId);
        // Mark intra-batch subsequent occurrences as duplicates too, without skipping!
        if (!duplicateOfId) {
          existingPhoneMap.set(phone10, `PENDING_BATCH:${batch.batchCode}`);
        }

        const noteParts: string[] = [];
        if (item.courseTitle) noteParts.push(`Course: ${item.courseTitle}`);
        if (item.campaign) noteParts.push(`Campaign: ${item.campaign}`);
        if (item.leadDate) noteParts.push(`Lead Date: ${item.leadDate}`);
        if (item.originalOwner) noteParts.push(`Original Owner: ${item.originalOwner}`);
        if (item.notes) noteParts.push(item.notes);
        if (isDuplicate) noteParts.push(`[DUPLICATE_REVIEW - preserved in ON_HOLD]`);

        validInsertRows.push({
          rowId: row.id,
          rowIndex: row.rowIndex,
          isDuplicate,
          leadData: {
            fullName,
            phone: phone10,
            email: item.email?.trim() || `${phone10}_${batch.batchCode}_${row.rowIndex}@pending.softlabglobal.com`,
            city: item.city?.trim() || null,
            qualification: item.qualification?.trim() || null,
            source: resolveLeadSource(item.source, options?.defaultSource ?? batch.source),
            captureMethod,
            importBatchId: batch.id,
            status: targetStatus,
            duplicateOfLeadId: duplicateOfId && !duplicateOfId.startsWith("PENDING_BATCH:") ? duplicateOfId : null,
            duplicateStatus: isDuplicate ? "DUPLICATE_REVIEW" : "NONE",
            duplicateReviewMeta: isDuplicate
              ? {
                  reason: duplicateOfId?.startsWith("PENDING_BATCH:")
                    ? "Repeated phone within same upload batch"
                    : "Matching phone in CRM",
                  matchedRef: duplicateOfId,
                  preservedAt: new Date().toISOString(),
                }
              : undefined,
            notes: noteParts.join(" | ") || `Bulk imported via batch ${batch.batchCode}`,
          },
        });
      }

      // 3. Commit valid chunk in a single fast createMany transaction
      let chunkCreated = 0;
      let chunkDuplicates = 0;

      if (validInsertRows.length > 0) {
        await db.$transaction(
          async (tx) => {
            const inserted = await tx.lead.createMany({
              data: validInsertRows.map((v) => v.leadData),
            });
            chunkCreated = inserted.count;

            const nonDupIds = validInsertRows.filter((v) => !v.isDuplicate).map((v) => v.rowId);
            const dupIds = validInsertRows.filter((v) => v.isDuplicate).map((v) => v.rowId);
            chunkDuplicates = dupIds.length;

            if (nonDupIds.length > 0) {
              await tx.leadImportRow.updateMany({
                where: { id: { in: nonDupIds } },
                data: { status: "STAGED" },
              });
            }
            if (dupIds.length > 0) {
              await tx.leadImportRow.updateMany({
                where: { id: { in: dupIds } },
                data: { status: "DUPLICATE_REVIEW" },
              });
            }
          },
          { timeout: 60000, maxWait: 15000 }
        );
      }

      if (failedRowUpdates.length > 0) {
        for (const f of failedRowUpdates) {
          await db.leadImportRow.update({
            where: { id: f.id },
            data: { status: "FAILED", errorReason: f.reason },
          });
        }
      }

      const existingErrors = Array.isArray(batch.errorSummary)
        ? (batch.errorSummary as Array<{ row: number; phone: string; name: string; reason: string }>)
        : [];
      const mergedErrors = existingErrors.concat(
        failedRowUpdates.slice(0, Math.max(0, 500 - existingErrors.length)).map((f) => ({
          row: f.row,
          phone: f.phone,
          name: f.name,
          reason: f.reason,
        }))
      );

      await db.leadImportBatch.update({
        where: { id: batchId },
        data: {
          currentChunk: { increment: 1 },
          processedRows: { increment: pendingRows.length },
          createdCount: { increment: chunkCreated },
          duplicateCount: { increment: chunkDuplicates },
          stagedOnHoldCount: { increment: targetStatus === LeadStatus.ON_HOLD ? chunkCreated : 0 },
          failedCount: { increment: failedRowUpdates.length },
          errorSummary: mergedErrors,
        },
      });
    }
  }

  static async getBatchStatus(batchId: string) {
    const batch = await db.leadImportBatch.findUnique({ where: { id: batchId } });
    if (!batch) return null;
    const progressPercent = batch.totalRows > 0 ? Math.min(100, Math.round((batch.processedRows / batch.totalRows) * 100)) : 100;
    return {
      ...batch,
      progressPercent,
    };
  }

  static async pauseBatch(batchId: string) {
    return db.leadImportBatch.update({
      where: { id: batchId },
      data: { isPaused: true, status: "PAUSED" },
    });
  }

  static async resumeBatch(batchId: string, actor: ImportActor) {
    const updated = await db.leadImportBatch.update({
      where: { id: batchId },
      data: { isPaused: false, isCancelled: false, status: "PROCESSING" },
    });
    this.scheduleWorker(batchId, actor);
    return updated;
  }

  static async cancelBatch(batchId: string) {
    return db.leadImportBatch.update({
      where: { id: batchId },
      data: { isCancelled: true, status: "CANCELLED", completedAt: new Date() },
    });
  }

  static async retryFailedRows(batchId: string, actor: ImportActor) {
    const reset = await db.leadImportRow.updateMany({
      where: { batchId, status: "FAILED" },
      data: { status: "PENDING", errorReason: null },
    });
    if (reset.count === 0) {
      return this.getBatchStatus(batchId);
    }
    await db.leadImportBatch.update({
      where: { id: batchId },
      data: {
        status: "PROCESSING",
        isPaused: false,
        isCancelled: false,
        failedCount: { decrement: reset.count },
        processedRows: { decrement: reset.count },
        completedAt: null,
      },
    });
    this.scheduleWorker(batchId, actor);
    return this.getBatchStatus(batchId);
  }

  static async getFailedRowsCsv(batchId: string): Promise<string> {
    const failedRows = await db.leadImportRow.findMany({
      where: { batchId, status: "FAILED" },
      orderBy: { rowIndex: "asc" },
    });
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = ["Row", "Candidate Name", "Phone", "Email", "Course Title", "City", "Error Reason"].join(",");
    const lines = failedRows.map((r) => {
      const p = r.rawPayload as unknown as ParsedBulkLeadInput;
      return [
        r.rowIndex,
        escape(p?.fullName || ""),
        escape(p?.phone || ""),
        escape(p?.email || ""),
        escape(p?.courseTitle || ""),
        escape(p?.city || ""),
        escape(r.errorReason || ""),
      ].join(",");
    });
    return [header, ...lines].join("\n");
  }
}
