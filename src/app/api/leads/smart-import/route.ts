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
      return NextResponse.json({ success: true, rows, count: rows.length });
    }

    if (action === "commit") {
      const rows: ParsedLeadRow[] = Array.isArray(body.rows) ? body.rows : [];
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "No parsed leads to store." }, { status: 400 });
      }

      const role = String(token.roleCode || "");
      const hasAuthority = AUTHORITY_ROLES.includes(role);
      const requireApproval = hasAuthority ? Boolean(body.requireApproval) : true;

      let assignToId: string | null = null;
      if (hasAuthority && body.assignToId) {
        const candidate = await db.user.findFirst({
          where: { id: String(body.assignToId), status: "ACTIVE" },
          select: { id: true },
        });
        assignToId = candidate?.id || null;
      }

      let created = 0;
      let duplicateCount = 0;
      let needsReviewCount = 0;
      const seenPhones = new Set<string>();
      const rowStatuses: Array<{ fullName: string; phone: string; status: string; disposition?: string }> = [];

      for (const r of rows) {
        const phone = String(r.phone || "").replace(/\D/g, "").slice(-10);
        if (!/^[6-9]\d{9}$/.test(phone)) {
          needsReviewCount++;
          rowStatuses.push({ fullName: r.fullName || "Unknown", phone, status: "NEEDS_REVIEW" });
          continue;
        }
        // Phone-number-only duplicate detection (within upload & CRM)
        if (seenPhones.has(phone)) {
          duplicateCount++;
          rowStatuses.push({ fullName: r.fullName, phone, status: "DUPLICATE" });
          continue;
        }
        seenPhones.add(phone);

        const exists = await db.lead.findFirst({
          where: { phone },
          select: { id: true },
        });
        if (exists) {
          duplicateCount++;
          rowStatuses.push({ fullName: r.fullName, phone, status: "DUPLICATE" });
          continue;
        }

        const mapped = mapRemarksToDisposition(r.notes || "");
        const lead = await db.lead.create({
          data: {
            fullName: String(r.fullName || `Lead ${phone.slice(-4)}`).slice(0, 100),
            phone,
            email: r.email || `${phone}@pending.softlabglobal.com`,
            city: r.city || "Prayagraj",
            source: LeadSource.BULK_UPLOAD,
            status: requireApproval ? LeadStatus.ON_HOLD : LeadStatus.NEW,
            qualityScore: mapped.qualityScore,
            nextFollowUp: mapped.nextFollowUp,
            assignedToId: assignToId,
            notes: `[AI Smart Import${requireApproval ? " - Awaiting Manager/Super Admin Approval" : ""}] Disposition: ${mapped.dispositionLabel} | Course: ${r.course || "General"} | Original Remarks: ${r.notes || ""}`.slice(0, 500),
            campaignName: "AI_SMART_CAPTURE",
          },
        });
        created++;
        rowStatuses.push({
          fullName: lead.fullName,
          phone,
          status: requireApproval ? "ON_HOLD" : "IMPORTED",
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
          failedCount: duplicateCount + needsReviewCount,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        batchCode,
        created,
        skipped: duplicateCount + needsReviewCount,
        duplicateCount,
        needsReviewCount,
        rowStatuses,
        message: `${created} lead(s) stored (${requireApproval ? "ON_HOLD" : "NEW"}). ${duplicateCount} duplicate(s), ${needsReviewCount} needs review.`,
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
