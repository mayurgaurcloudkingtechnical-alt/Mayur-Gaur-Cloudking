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
      const assignToId = hasAuthority && body.assignToId ? String(body.assignToId) : null;

      let created = 0;
      let skipped = 0;

      for (const r of rows) {
        const phone = String(r.phone || "").replace(/\D/g, "").slice(-10);
        if (phone.length !== 10) {
          skipped++;
          continue;
        }
        const exists = await db.lead.findFirst({
          where: { phone: { contains: phone } },
          select: { id: true },
        });
        if (exists) {
          skipped++;
          continue;
        }
        await db.lead.create({
          data: {
            fullName: String(r.fullName || `Lead ${phone.slice(-4)}`).slice(0, 100),
            phone,
            email: r.email || null,
            city: r.city || "Prayagraj",
            source: LeadSource.BULK_UPLOAD,
            status: requireApproval ? LeadStatus.ON_HOLD : LeadStatus.NEW,
            assignedToId,
            notes: `[AI Smart Import${requireApproval ? " - Awaiting Manager/Super Admin Approval" : ""}] Course: ${r.course || "General"} | ${r.notes || ""}`.slice(0, 500),
            campaignName: "AI_SMART_CAPTURE",
          },
        });
        created++;
      }

      return NextResponse.json({
        success: true,
        created,
        skipped,
        awaitingApproval: requireApproval,
        message: requireApproval
          ? `${created} leads captured & staged for Manager/Super Admin approval (${skipped} duplicates skipped).`
          : `${created} leads stored & activated (${skipped} duplicates skipped).`,
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
