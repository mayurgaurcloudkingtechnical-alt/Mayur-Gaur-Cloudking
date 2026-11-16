import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/server/db/client";
import { LeadSource, LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STAFF_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
  "HR",
  "COUNSELOR",
  "TELECALLER",
];

const AUTHORITY_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"];

async function getAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !STAFF_ROLES.includes(String(token.roleCode || ""))) return null;
  return token;
}

interface ParsedLeadRow {
  fullName: string;
  phone: string;
  email: string;
  course: string;
  city: string;
  notes: string;
}

function fallbackSmartParse(rawText: string): ParsedLeadRow[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: ParsedLeadRow[] = [];
  const seenPhones = new Set<string>();

  for (const line of lines) {
    const phoneMatch = line.match(/(?:\+?91[\s-]?)?([6-9]\d{9})\b/);
    if (!phoneMatch) continue;
    const phone = phoneMatch[1];
    if (seenPhones.has(phone)) continue;
    seenPhones.add(phone);

    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : "";

    let cleaned = line
      .replace(phoneMatch[0], " ")
      .replace(email, " ")
      .replace(/[|,;\t]+/g, " | ")
      .trim();

    const parts = cleaned
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

    const fullName =
      parts[0]?.replace(/[^a-zA-Z\s.]/g, "").trim() || `Lead ${phone.slice(-4)}`;
    const course = parts[1] || "General Inquiry";
    const city = parts[2] || "Prayagraj";

    results.push({
      fullName: fullName.slice(0, 80),
      phone,
      email,
      course: course.slice(0, 80),
      city: city.slice(0, 50),
      notes: line.slice(0, 240),
    });
  }

  return results;
}

async function aiSmartParse(rawText: string): Promise<ParsedLeadRow[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && rawText.trim().length > 0) {
    try {
      const prompt = [
        "Extract all student/lead records from the following unstructured text (could be CSV, Excel paste, WhatsApp chats, JSON, or notes).",
        "Return ONLY a valid JSON array of objects with keys: fullName, phone (10-digit Indian number), email, course, city, notes.",
        "Skip entries without a valid 10-digit phone number. Do not include markdown fences.",
        "",
        rawText.slice(0, 12000),
      ].join("\n");

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
          }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        const jsonText = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        const parsed = JSON.parse(jsonText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid: ParsedLeadRow[] = [];
          const seen = new Set<string>();
          for (const r of parsed) {
            const phone = String(r.phone || "").replace(/\D/g, "").slice(-10);
            if (phone.length !== 10 || seen.has(phone)) continue;
            seen.add(phone);
            valid.push({
              fullName: String(r.fullName || `Lead ${phone.slice(-4)}`).trim(),
              phone,
              email: String(r.email || "").trim(),
              course: String(r.course || "General Inquiry").trim(),
              city: String(r.city || "Prayagraj").trim(),
              notes: String(r.notes || "").trim(),
            });
          }
          if (valid.length > 0) return valid;
        }
      }
    } catch {}
  }

  return fallbackSmartParse(rawText);
}

function mapRemarksToDisposition(rawNotes: string): {
  dispositionLabel: string;
  qualityScore: "HOT" | "WARM" | "COLD";
  nextFollowUp: Date | null;
} {
  const lower = (rawNotes || "").toLowerCase();
  let dispositionLabel = "New Enquiry";
  let qualityScore: "HOT" | "WARM" | "COLD" = "WARM";
  let nextFollowUp: Date | null = null;

  if (lower.includes("visit soon") || lower.includes("will visit") || lower.includes("campus visit")) {
    dispositionLabel = "Interested / Visit Planned";
    qualityScore = "HOT";
  } else if (lower.includes("searching") || lower.includes("looking for") || lower.includes("classes") || lower.includes("course")) {
    dispositionLabel = "Course Requirement Identified";
    qualityScore = "HOT";
  } else if (lower.includes("think about") || lower.includes("will think") || lower.includes("call back")) {
    dispositionLabel = "Thinking / Follow-up Required";
    qualityScore = "WARM";
  } else if (lower.includes("didn't receive") || lower.includes("not reachable") || lower.includes("no answer")) {
    dispositionLabel = "Not Connected";
    qualityScore = "WARM";
  } else if (lower.includes("cut the call") || lower.includes("disconnected")) {
    dispositionLabel = "Call Disconnected";
    qualityScore = "COLD";
  }

  const daysMatch = lower.match(/after\s+(\d+)\s+day/);
  if (daysMatch) {
    const days = Math.min(30, Math.max(1, parseInt(daysMatch[1], 10)));
    nextFollowUp = new Date(Date.now() + days * 24 * 3600 * 1000);
  }

  return { dispositionLabel, qualityScore, nextFollowUp };
}

export async function POST(req: NextRequest) {
  const token = await getAuth(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body.action || "parse";

    if (action === "parse") {
      const rawText = String(body.rawText || "");
      if (!rawText.trim()) {
        return NextResponse.json({ success: false, error: "Paste any text/CSV/chat data first." }, { status: 400 });
      }
      const rows = await aiSmartParse(rawText);
      const phones = rows.map((r) => String(r.phone || "").replace(/\D/g, "").slice(-10)).filter((p) => p.length === 10);
      const existingMatches = phones.length
        ? await db.lead.findMany({
            where: { phone: { in: phones } },
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
              createdAt: true,
              assignedTo: { select: { firstName: true, lastName: true } },
            },
          })
        : [];
      const matchByPhone = new Map(existingMatches.map((m) => [m.phone, m]));
      const seenInBatch = new Set<string>();
      let duplicateCount = 0;

      const enriched = rows.map((r, idx) => {
        const cleanPhone = String(r.phone || "").replace(/\D/g, "").slice(-10);
        const existing = matchByPhone.get(cleanPhone);
        const dupInBatch = cleanPhone.length === 10 && seenInBatch.has(cleanPhone);
        if (cleanPhone.length === 10) seenInBatch.add(cleanPhone);
        const isDuplicate = Boolean(existing || dupInBatch);
        if (isDuplicate) duplicateCount++;
        return {
          ...r,
          rowIndex: idx,
          isDuplicate,
          duplicateReason: existing
            ? "Matching phone in CRM"
            : dupInBatch
              ? "Duplicate phone in upload"
              : null,
          existingLead: existing
            ? {
                id: existing.id,
                fullName: existing.fullName,
                phone: existing.phone,
                email: existing.email,
                ownerName: existing.assignedTo
                  ? `${existing.assignedTo.firstName} ${existing.assignedTo.lastName}`.trim()
                  : "Unassigned",
                createdAt: existing.createdAt,
              }
            : null,
        };
      });

      return NextResponse.json({
        success: true,
        rows: enriched,
        count: enriched.length,
        summary: {
          totalSubmitted: enriched.length,
          validCount: enriched.filter((r) => String(r.phone || "").replace(/\D/g, "").slice(-10).length === 10).length,
          newCount: enriched.length - duplicateCount,
          duplicateCount,
          invalidCount: enriched.filter((r) => String(r.phone || "").replace(/\D/g, "").slice(-10).length !== 10).length,
        },
      });
    }

    if (action === "commit") {
      const rows: ParsedLeadRow[] = Array.isArray(body.rows) ? body.rows : [];
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "No parsed leads to store." }, { status: 400 });
      }

      const role = String(token.roleCode || "");
      const hasAuthority = AUTHORITY_ROLES.includes(role);
      const requireApproval = hasAuthority ? Boolean(body.requireApproval) : true;
      const skipIndices = new Set<number>(Array.isArray(body.skipIndices) ? body.skipIndices.map(Number) : []);

      let assignToId: string | null = null;
      if (hasAuthority && body.assignToId) {
        const candidate = await db.user.findFirst({
          where: { id: String(body.assignToId), status: "ACTIVE" },
          select: { id: true },
        });
        assignToId = candidate?.id || null;
      }

      let created = 0;
      let duplicatePreservedCount = 0;
      let skippedByUserCount = 0;
      let needsReviewCount = 0;
      const seenPhones = new Set<string>();
      const rowStatuses: Array<{ fullName: string; phone: string; status: string; disposition?: string }> = [];

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx];
        if (skipIndices.has(idx)) {
          skippedByUserCount++;
          rowStatuses.push({ fullName: r.fullName, phone: r.phone, status: "SKIPPED_BY_USER" });
          continue;
        }

        const phone = String(r.phone || "").replace(/\D/g, "").slice(-10);
        const isValidPhone = /^[6-9]\d{9}$/.test(phone);
        const existing = isValidPhone
          ? await db.lead.findFirst({ where: { phone }, select: { id: true } })
          : null;
        const dupInUpload = isValidPhone && seenPhones.has(phone);
        if (isValidPhone) seenPhones.add(phone);

        const isDup = Boolean(existing || dupInUpload);
        if (isDup) duplicatePreservedCount++;
        if (!isValidPhone) needsReviewCount++;

        const mapped = mapRemarksToDisposition(r.notes || "");
        const lead = await db.lead.create({
          data: {
            fullName: String(r.fullName || `Lead ${phone.slice(-4) || "Review"}`).slice(0, 100),
            phone: phone || "0000000000",
            email: r.email || `${phone || `rev${idx}`}@pending.softlabglobal.com`,
            city: r.city || "Prayagraj",
            source: LeadSource.BULK_UPLOAD,
            status: requireApproval ? LeadStatus.ON_HOLD : LeadStatus.NEW,
            qualityScore: mapped.qualityScore,
            nextFollowUp: mapped.nextFollowUp,
            assignedToId: assignToId,
            duplicateOfLeadId: existing?.id || null,
            duplicateStatus: isDup ? "DUPLICATE_REVIEW" : "NONE",
            duplicateReviewMeta: isDup
              ? { reason: existing ? "Matching phone in CRM" : "Duplicate phone in upload", preservedAt: new Date().toISOString() }
              : undefined,
            notes: `[AI Smart Import${requireApproval ? " - Awaiting Approval" : ""}${isDup ? " | DUPLICATE_REVIEW" : ""}] Disposition: ${mapped.dispositionLabel} | Course: ${r.course || "General"} | Original Remarks: ${r.notes || ""}`.slice(0, 500),
            campaignName: "AI_SMART_CAPTURE",
          },
        });
        created++;
        rowStatuses.push({
          fullName: lead.fullName,
          phone: lead.phone,
          status: isDup ? "DUPLICATE_PRESERVED" : !isValidPhone ? "NEEDS_REVIEW" : requireApproval ? "ON_HOLD" : "IMPORTED",
          disposition: mapped.dispositionLabel,
        });
      }

      const batchCode = `SLG-SMART-${Date.now().toString().slice(-6)}`;
      await db.leadImportBatch.create({
        data: {
          batchCode,
          uploaderId: String(token.sub),
          fileName: "AI_Smart_Capture",
          source: LeadSource.BULK_UPLOAD,
          totalRows: rows.length,
          createdCount: created,
          updatedCount: 0,
          failedCount: skippedByUserCount,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      await db.auditLog.create({
        data: {
          actorId: String(token.sub),
          action: "CRM_SMART_IMPORT_PRESERVED_ALL",
          resourceType: "LeadImportBatch",
          resourceId: batchCode,
          newData: { totalSubmitted: rows.length, created, duplicatePreservedCount, skippedByUserCount, needsReviewCount },
        },
      });

      return NextResponse.json({
        success: true,
        batchCode,
        totalSubmitted: rows.length,
        created,
        duplicatePreservedCount,
        skippedByUserCount,
        needsReviewCount,
        rowStatuses,
        message: `Uploaded ${created} of ${rows.length} lead(s) (${duplicatePreservedCount} duplicate(s) preserved, ${skippedByUserCount} skipped by user, ${needsReviewCount} flagged for review).`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Import failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const token = await getAuth(req);
  if (!token || !AUTHORITY_ROLES.includes(String(token.roleCode || ""))) {
    return NextResponse.json(
      { error: "Only Manager, Admin, Director, or Super Admin can approve or distribute leads." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const leadIds: string[] = Array.isArray(body.leadIds) ? body.leadIds.map(String) : [];
    if (leadIds.length === 0) {
      return NextResponse.json({ error: "Select at least one lead." }, { status: 400 });
    }

    const data: any = {};
    if (body.approve) data.status = LeadStatus.NEW;
    if (body.assignToId !== undefined) data.assignedToId = body.assignToId || null;

    const updated = await db.lead.updateMany({
      where: { id: { in: leadIds } },
      data,
    });

    return NextResponse.json({
      success: true,
      updatedCount: updated.count,
      message: `Updated ${updated.count} lead(s) successfully.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Update failed" }, { status: 500 });
  }
}
