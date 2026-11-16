import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import ExcelJS from "exceljs";
import { db } from "@/server/db/client";
import { LeadSource, LeadStatus, UserRoleCode } from "@prisma/client";

export const dynamic = "force-dynamic";

const AUTHORITY_ROLES = ["SUPER_ADMIN", "DIRECTOR", "ADMIN", "MANAGER"];

async function getAuthorityAuth(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub) return { error: "Unauthorized", status: 401 as const, token: null };
  if (!AUTHORITY_ROLES.includes(String(token.roleCode || ""))) {
    return {
      error: "Forbidden: Enterprise Data Hub is restricted to Managers, Directors, and Super Admins.",
      status: 403 as const,
      token: null,
    };
  }
  return { error: null, status: 200 as const, token };
}

function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

interface ExtractedRow {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  courseOrCategory: string;
  notes: string;
}

function parseVcf(text: string): ExtractedRow[] {
  const cards = text.split(/BEGIN:VCARD/i).filter((c) => c.trim());
  const rows: ExtractedRow[] = [];
  for (const card of cards) {
    const fn = card.match(/^FN[^:]*:(.+)$/im)?.[1]?.trim() || card.match(/^N[^:]*:(.+)$/im)?.[1]?.replace(/;/g, " ").trim() || "Contact";
    const tel = card.match(/^TEL[^:]*:(.+)$/im)?.[1]?.trim() || "";
    const email = card.match(/^EMAIL[^:]*:(.+)$/im)?.[1]?.trim() || "";
    const org = card.match(/^ORG[^:]*:(.+)$/im)?.[1]?.trim() || "";
    const phone = normalizePhone(tel);
    if (phone.length >= 10 || email) {
      rows.push({
        fullName: fn,
        phone,
        email,
        city: "",
        courseOrCategory: org || "General",
        notes: "Imported from vCard (.vcf)",
      });
    }
  }
  return rows;
}

function parseDelimitedText(text: string): ExtractedRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const rows: ExtractedRow[] = [];
  const firstCols = lines[0].split(/[,\t|]/).map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));
  const hasHeader =
    firstCols.some((c) => ["name", "full_name", "fullname", "student", "phone", "mobile", "contact", "email"].includes(c));

  const startIdx = hasHeader ? 1 : 0;
  const idxMap = {
    name: firstCols.findIndex((c) => ["name", "full_name", "fullname", "student", "lead", "vendor"].includes(c)),
    phone: firstCols.findIndex((c) => ["phone", "mobile", "contact", "whatsapp", "tel"].includes(c)),
    email: firstCols.findIndex((c) => ["email", "mail", "email_id"].includes(c)),
    city: firstCols.findIndex((c) => ["city", "location", "state"].includes(c)),
    course: firstCols.findIndex((c) => ["course", "program", "category", "interested_course"].includes(c)),
  };

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(/[,\t|]/).map((c) => c.trim().replace(/^"|"$/g, ""));

    if (hasHeader && cols.length >= 2) {
      const phone = normalizePhone(idxMap.phone >= 0 ? cols[idxMap.phone] || "" : cols.find((c) => normalizePhone(c).length === 10) || "");
      const email = (idxMap.email >= 0 ? cols[idxMap.email] : cols.find((c) => c.includes("@"))) || "";
      const fullName = (idxMap.name >= 0 ? cols[idxMap.name] : cols[0]) || "Unknown";
      const city = idxMap.city >= 0 ? cols[idxMap.city] || "" : "";
      const courseOrCategory = idxMap.course >= 0 ? cols[idxMap.course] || "General" : "General";
      if (phone.length >= 10 || email.includes("@")) {
        rows.push({ fullName, phone, email, city, courseOrCategory, notes: `Row ${i + 1}` });
      }
    } else {
      const phoneMatch = line.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/);
      const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const phone = phoneMatch ? normalizePhone(phoneMatch[0]) : "";
      const email = emailMatch ? emailMatch[0] : "";
      if (phone.length >= 10 || email) {
        const cleaned = line
          .replace(phoneMatch?.[0] || "", "")
          .replace(email, "")
          .replace(/[,|\t-]+/g, " ")
          .trim();
        rows.push({
          fullName: cleaned.slice(0, 80) || "AI Extracted Contact",
          phone,
          email,
          city: "",
          courseOrCategory: "General",
          notes: "AI Unstructured Capture",
        });
      }
    }
  }

  return rows;
}

async function parseExcelBuffer(buf: ArrayBuffer): Promise<ExtractedRow[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headerRow: string[] = [];
  ws.getRow(1).eachCell((cell, colNumber) => {
    headerRow[colNumber] = String(cell.value ?? "").trim().toLowerCase();
  });

  const nameCol = headerRow.findIndex((h) => ["name", "full_name", "fullname", "student", "lead", "vendor"].includes(h));
  const phoneCol = headerRow.findIndex((h) => ["phone", "mobile", "contact", "whatsapp", "tel"].includes(h));
  const emailCol = headerRow.findIndex((h) => ["email", "mail", "email_id"].includes(h));
  const cityCol = headerRow.findIndex((h) => ["city", "location", "state"].includes(h));
  const courseCol = headerRow.findIndex((h) => ["course", "program", "category", "interested_course"].includes(h));

  const rows: ExtractedRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const vals: string[] = [];
    row.eachCell((cell, colNumber) => {
      vals[colNumber] = String(cell.value ?? "").trim();
    });
    const joined = vals.filter(Boolean).join(" ");
    const phone = normalizePhone(
      phoneCol > 0 ? vals[phoneCol] || "" : joined.match(/(?:\+?91[\s-]?)?[6-9]\d{9}/)?.[0] || ""
    );
    const email =
      (emailCol > 0 ? vals[emailCol] : joined.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0]) || "";
    const fullName = (nameCol > 0 ? vals[nameCol] : vals[1]) || "Excel Contact";
    const city = cityCol > 0 ? vals[cityCol] || "" : "";
    const courseOrCategory = courseCol > 0 ? vals[courseCol] || "General" : "General";

    if (phone.length >= 10 || email.includes("@")) {
      rows.push({
        fullName,
        phone,
        email,
        city,
        courseOrCategory,
        notes: `Excel Row ${rowNumber}`,
      });
    }
  });
  return rows;
}

async function tryGeminiExtraction(rawText: string): Promise<ExtractedRow[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || rawText.trim().length < 15) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Extract all contacts/leads from this unstructured text into JSON array with keys: fullName, phone (10 digits), email, city, courseOrCategory, notes. Return ONLY valid JSON array.\n\n${rawText.slice(0, 12000)}`,
                },
              ],
            },
          ],
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((r: any) => ({
        fullName: String(r.fullName || "AI Contact").trim(),
        phone: normalizePhone(String(r.phone || "")),
        email: String(r.email || "").trim(),
        city: String(r.city || "").trim(),
        courseOrCategory: String(r.courseOrCategory || "General").trim(),
        notes: String(r.notes || "Gemini AI Extraction").trim(),
      }))
      .filter((r) => r.phone.length >= 10 || r.email.includes("@"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorityAuth(req);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const sp = req.nextUrl.searchParams;
  const tab = sp.get("tab") || "leads";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(sp.get("limit") || 20)));
  const skip = (page - 1) * limit;
  const search = (sp.get("search") || "").trim();
  const statusFilter = (sp.get("status") || "").trim();
  const sourceFilter = (sp.get("source") || "").trim();
  const exportFmt = (sp.get("export") || "").toLowerCase();

  const [
    leadsCount,
    studentsCount,
    staffCount,
    authoritiesCount,
    vendorsCount,
    partnersCount,
    pendingCount,
    approvedCount,
    distributedCount,
    rejectedCount,
    importHistoryCount,
    activityLogsCount,
    assignees,
  ] = await Promise.all([
    db.lead.count(),
    db.studentProfile.count(),
    db.user.count({ where: { roleCode: { not: UserRoleCode.STUDENT } } }),
    db.higherAuthorityRecipient.count(),
    db.vendor.count(),
    db.corporatePartner.count(),
    db.lead.count({ where: { status: LeadStatus.ON_HOLD } }),
    db.lead.count({ where: { status: { notIn: [LeadStatus.ON_HOLD, LeadStatus.LOST] } } }),
    db.lead.count({ where: { OR: [{ assignedToId: { not: null } }, { assignedCounselorId: { not: null } }, { assignedTelecallerId: { not: null } }] } }),
    db.lead.count({ where: { status: LeadStatus.LOST } }),
    db.leadImportBatch.count(),
    db.auditLog.count(),
    db.user.findMany({
      where: {
        status: "ACTIVE",
        roleCode: { in: [UserRoleCode.COUNSELOR, UserRoleCode.TELECALLER, UserRoleCode.MANAGER, UserRoleCode.ADMIN] },
      },
      select: { id: true, firstName: true, lastName: true, email: true, roleCode: true },
      orderBy: { firstName: "asc" },
    }).then((list) =>
      list.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), email: u.email, roleCode: u.roleCode }))
    ),
  ]);

  let items: any[] = [];
  let total = 0;

  if (["leads", "pending_approval", "approved", "distributed", "rejected", "duplicates"].includes(tab)) {
    const where: any = {};
    if (tab === "pending_approval") where.status = LeadStatus.ON_HOLD;
    if (tab === "approved") where.status = { notIn: [LeadStatus.ON_HOLD, LeadStatus.LOST] };
    if (tab === "distributed") {
      where.OR = [
        { assignedToId: { not: null } },
        { assignedCounselorId: { not: null } },
        { assignedTelecallerId: { not: null } },
      ];
    }
    if (tab === "rejected") where.status = LeadStatus.LOST;
    if (tab === "duplicates") {
      where.notes = { contains: "DUPLICATE", mode: "insensitive" };
    }
    if (statusFilter) where.status = statusFilter;
    if (sourceFilter) where.source = sourceFilter;
    if (search) {
      where.AND = [
        {
          OR: [
            { fullName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [rows, count] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          course: { select: { title: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, roleCode: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: exportFmt ? 0 : skip,
        take: exportFmt ? 500 : limit,
      }),
      db.lead.count({ where }),
    ]);

    items = rows.map((r) => ({
      id: r.id,
      name: r.fullName,
      phone: r.phone,
      email: r.email,
      city: r.city || "-",
      category: r.course?.title || r.qualification || "-",
      source: r.source,
      status: r.status,
      assignee: r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName} (${r.assignedTo.roleCode})` : "Unassigned",
      createdAt: r.createdAt,
      notes: r.notes || "",
    }));
    total = count;
  } else if (tab === "students") {
    const where: any = search
      ? {
          OR: [
            { studentId: { contains: search, mode: "insensitive" } },
            { user: { firstName: { contains: search, mode: "insensitive" } } },
            { user: { lastName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};
    const [rows, count] = await Promise.all([
      db.studentProfile.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true, phone: true, status: true } } },
        orderBy: { studentId: "desc" },
        skip: exportFmt ? 0 : skip,
        take: exportFmt ? 500 : limit,
      }),
      db.studentProfile.count({ where }),
    ]);
    items = rows.map((s) => ({
      id: s.id,
      name: s.user ? `${s.user.firstName} ${s.user.lastName}`.trim() : "-",
      phone: s.whatsappNumber || s.user?.phone || "-",
      email: s.user?.email || "-",
      city: s.city || "-",
      category: s.universityProgram || s.educationProvider || "SoftLab Global",
      source: s.studentId,
      status: s.user?.status || "ACTIVE",
      assignee: s.center || "-",
      createdAt: s.dateOfBirth || new Date(),
    }));
    total = count;
  } else if (tab === "staff") {
    const where: any = {
      roleCode: { not: UserRoleCode.STUDENT },
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [rows, count] = await Promise.all([
      db.user.findMany({
        where,
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, roleCode: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        skip: exportFmt ? 0 : skip,
        take: exportFmt ? 500 : limit,
      }),
      db.user.count({ where }),
    ]);
    items = rows.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      phone: u.phone || "-",
      email: u.email,
      city: "-",
      category: u.roleCode,
      source: "STAFF_DIRECTORY",
      status: u.status,
      assignee: u.roleCode,
      createdAt: u.createdAt,
    }));
    total = count;
  } else if (tab === "authorities") {
    const rows = await db.higherAuthorityRecipient.findMany({ orderBy: { priority: "asc" } });
    items = rows.map((a) => ({
      id: a.id,
      name: a.name,
      phone: a.whatsappNumber || "Not Configured",
      email: a.officialEmail,
      city: a.department,
      category: a.designation,
      source: `Priority P${a.priority}`,
      status: a.isActive ? "ACTIVE" : "INACTIVE",
      assignee: a.notifyWhatsApp ? "WhatsApp + Email" : "Email Only",
      createdAt: a.createdAt,
    }));
    total = rows.length;
  } else if (tab === "vendors") {
    const where: any = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { vendorCode: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const [rows, count] = await Promise.all([
      db.vendor.findMany({ where, orderBy: { createdAt: "desc" }, skip: exportFmt ? 0 : skip, take: exportFmt ? 500 : limit }),
      db.vendor.count({ where }),
    ]);
    items = rows.map((v) => ({
      id: v.id,
      name: v.name,
      phone: v.whatsappNumber || v.phone || "-",
      email: v.email || "-",
      city: v.city || "-",
      category: v.category,
      source: v.vendorCode,
      status: v.isActive ? "ACTIVE" : "PENDING_APPROVAL",
      assignee: v.verificationStatus,
      createdAt: v.createdAt,
    }));
    total = count;
  } else if (tab === "partners") {
    const where: any = search ? { name: { contains: search, mode: "insensitive" } } : {};
    const [rows, count] = await Promise.all([
      db.corporatePartner.findMany({ where, orderBy: { createdAt: "desc" }, skip: exportFmt ? 0 : skip, take: exportFmt ? 500 : limit }),
      db.corporatePartner.count({ where }),
    ]);
    items = rows.map((p) => ({
      id: p.id,
      name: p.name,
      phone: p.contactPhone || "-",
      email: p.contactEmail || "-",
      city: p.city || "-",
      category: p.industry || "Corporate",
      source: p.contactPerson || "-",
      status: p.isActive ? "ACTIVE" : "PENDING_APPROVAL",
      assignee: "Placement Desk",
      createdAt: p.createdAt,
    }));
    total = count;
  } else if (tab === "import_history") {
    const [rows, count] = await Promise.all([
      db.leadImportBatch.findMany({
        include: { uploader: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: exportFmt ? 0 : skip,
        take: exportFmt ? 500 : limit,
      }),
      db.leadImportBatch.count(),
    ]);
    items = rows.map((b) => ({
      id: b.id,
      name: b.fileName || b.batchCode,
      phone: `${b.totalRows} rows`,
      email: b.uploader?.email || "-",
      city: `Created: ${b.createdCount}`,
      category: b.source,
      source: b.batchCode,
      status: b.status,
      assignee: b.uploader ? `${b.uploader.firstName} ${b.uploader.lastName}`.trim() : "System",
      createdAt: b.createdAt,
    }));
    total = count;
  } else if (tab === "activity_logs") {
    const [rows, count] = await Promise.all([
      db.auditLog.findMany({
        include: { actor: { select: { firstName: true, lastName: true, email: true, roleCode: true } } },
        orderBy: { createdAt: "desc" },
        skip: exportFmt ? 0 : skip,
        take: exportFmt ? 500 : limit,
      }),
      db.auditLog.count(),
    ]);
    items = rows.map((l) => ({
      id: l.id,
      name: l.action,
      phone: l.resourceType,
      email: l.actor?.email || "System",
      city: l.resourceId,
      category: l.actor?.roleCode || "-",
      source: l.ipAddress || "-",
      status: "LOGGED",
      assignee: l.actor ? `${l.actor.firstName} ${l.actor.lastName}`.trim() : "System",
      createdAt: l.createdAt,
    }));
    total = count;
  }

  if (exportFmt === "csv" || exportFmt === "xlsx") {
    if (exportFmt === "xlsx") {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`Data-${tab}`);
      ws.columns = [
        { header: "ID", key: "id", width: 26 },
        { header: "Name / Title", key: "name", width: 28 },
        { header: "Phone / Metric", key: "phone", width: 18 },
        { header: "Email", key: "email", width: 28 },
        { header: "City / Dept", key: "city", width: 18 },
        { header: "Category / Role", key: "category", width: 22 },
        { header: "Source / Code", key: "source", width: 20 },
        { header: "Status", key: "status", width: 16 },
        { header: "Assigned / Info", key: "assignee", width: 24 },
      ];
      ws.getRow(1).font = { bold: true };
      items.forEach((item) => ws.addRow(item));
      const buf = await wb.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(buf), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="softlab-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        },
      });
    }

    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csvLines = [
      ["ID", "Name", "Phone", "Email", "City", "Category", "Source", "Status", "Assigned"].map(esc).join(","),
      ...items.map((i) =>
        [i.id, i.name, i.phone, i.email, i.city, i.category, i.source, i.status, i.assignee].map(esc).join(",")
      ),
    ];
    return new NextResponse(csvLines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="softlab-${tab}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({
    summary: {
      leads: leadsCount,
      students: studentsCount,
      staff: staffCount,
      authorities: authoritiesCount,
      vendors: vendorsCount,
      partners: partnersCount,
      pendingApproval: pendingCount,
      approved: approvedCount,
      distributed: distributedCount,
      rejected: rejectedCount,
      importHistory: importHistoryCount,
      activityLogs: activityLogsCount,
    },
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    assignees,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthorityAuth(req);
  if (auth.error || !auth.token) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let fileName = "AI_Smart_Paste.txt";
  let recordType: "LEAD" | "VENDOR" | "PARTNER" = "LEAD";
  let extracted: ExtractedRow[] = [];

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawText = String(formData.get("text") || "");
    recordType = (String(formData.get("recordType") || "LEAD").toUpperCase() as any) || "LEAD";

    if (file) {
      fileName = file.name;
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".xlsx")) {
        extracted = await parseExcelBuffer(await file.arrayBuffer());
      } else {
        const text = await file.text();
        if (lower.endsWith(".vcf")) {
          extracted = parseVcf(text);
        } else if (lower.endsWith(".json")) {
          try {
            const parsed = JSON.parse(text);
            const arr = Array.isArray(parsed) ? parsed : [parsed];
            extracted = arr
              .map((r: any) => ({
                fullName: String(r.fullName || r.name || "JSON Contact"),
                phone: normalizePhone(String(r.phone || r.mobile || "")),
                email: String(r.email || ""),
                city: String(r.city || ""),
                courseOrCategory: String(r.course || r.category || "General"),
                notes: "JSON Import",
              }))
              .filter((r) => r.phone.length >= 10 || r.email.includes("@"));
          } catch {
            extracted = parseDelimitedText(text);
          }
        } else if (lower.endsWith(".docx")) {
          try {
            const JSZip = require("jszip");
            const zip = await JSZip.loadAsync(await file.arrayBuffer());
            const xml = (await zip.file("word/document.xml")?.async("text")) || "";
            const plain = xml.replace(/<w:p[^>]*>/g, "\n").replace(/<[^>]+>/g, " ").replace(/\s+\n/g, "\n");
            extracted = (await tryGeminiExtraction(plain)) || parseDelimitedText(plain);
          } catch {
            extracted = parseDelimitedText(text);
          }
        } else if (lower.endsWith(".pdf")) {
          const buf = Buffer.from(await file.arrayBuffer());
          const rawAscii = buf.toString("latin1").replace(/[^\x20-\x7E\r\n]/g, " ");
          const parenText = Array.from(rawAscii.matchAll(/\(([^()]{3,200})\)/g))
            .map((m) => m[1])
            .join(" ");
          const combined = `${parenText}\n${rawAscii}`;
          extracted = (await tryGeminiExtraction(combined)) || parseDelimitedText(combined);
        } else {
          extracted = (await tryGeminiExtraction(text)) || parseDelimitedText(text);
        }
      }
    } else if (rawText.trim()) {
      extracted = (await tryGeminiExtraction(rawText)) || parseDelimitedText(rawText);
    }
  } else {
    const body = await req.json();
    fileName = String(body.fileName || "AI_Smart_Paste.txt");
    recordType = (String(body.recordType || "LEAD").toUpperCase() as any) || "LEAD";
    const rawText = String(body.text || "");
    if (Array.isArray(body.rows)) {
      extracted = body.rows;
    } else if (rawText.trim()) {
      extracted = (await tryGeminiExtraction(rawText)) || parseDelimitedText(rawText);
    }
  }

  if (extracted.length === 0) {
    return NextResponse.json(
      { error: "No valid contacts with a 10-digit phone number or email were extracted." },
      { status: 400 }
    );
  }

  const batchCode = `SLG-AI-${Date.now().toString().slice(-6)}`;
  let stagedCount = 0;
  let duplicateCount = 0;
  let invalidCount = 0;
  const stagedIds: string[] = [];
  const duplicates: any[] = [];

  if (recordType === "VENDOR") {
    for (const row of extracted) {
      const existing = await db.vendor.findFirst({
        where: {
          OR: [
            ...(row.phone ? [{ phone: row.phone }] : []),
            ...(row.email ? [{ email: row.email }] : []),
          ],
        },
      });
      if (existing) {
        duplicateCount++;
        duplicates.push({ name: row.fullName, phone: row.phone, existingId: existing.id });
        continue;
      }
      const created = await db.vendor.create({
        data: {
          vendorCode: `VND-AI-${Date.now().toString().slice(-5)}-${stagedCount + 1}`,
          name: row.fullName,
          phone: row.phone || null,
          whatsappNumber: row.phone || null,
          email: row.email || null,
          city: row.city || null,
          category: row.courseOrCategory || "General Vendor",
          isActive: false,
          notes: `[AI-STAGED-PENDING | ${batchCode}] ${row.notes}`,
        },
      });
      stagedCount++;
      stagedIds.push(created.id);
    }
  } else if (recordType === "PARTNER") {
    for (const row of extracted) {
      const existing = await db.corporatePartner.findFirst({
        where: {
          OR: [
            ...(row.phone ? [{ contactPhone: row.phone }] : []),
            ...(row.email ? [{ contactEmail: row.email }] : []),
          ],
        },
      });
      if (existing) {
        duplicateCount++;
        duplicates.push({ name: row.fullName, phone: row.phone, existingId: existing.id });
        continue;
      }
      const created = await db.corporatePartner.create({
        data: {
          name: row.fullName,
          contactPhone: row.phone || null,
          contactEmail: row.email || null,
          city: row.city || null,
          industry: row.courseOrCategory || "Corporate",
          isActive: false,
          notes: `[AI-STAGED-PENDING | ${batchCode}] ${row.notes}`,
        },
      });
      stagedCount++;
      stagedIds.push(created.id);
    }
  } else {
    const seenPhones = new Set<string>();
    for (let idx = 0; idx < extracted.length; idx++) {
      const row = extracted[idx];
      const cleanPhone = normalizePhone(row.phone);
      const validPhone = /^[6-9]\d{9}$/.test(cleanPhone);
      if (!validPhone) {
        invalidCount++;
      }
      const existing = validPhone
        ? await db.lead.findFirst({ where: { phone: cleanPhone }, select: { id: true } })
        : null;
      const dupInUpload = validPhone && seenPhones.has(cleanPhone);
      if (validPhone) seenPhones.add(cleanPhone);

      const isDup = Boolean(existing || dupInUpload);
      if (isDup) {
        duplicateCount++;
        duplicates.push({
          name: row.fullName,
          phone: cleanPhone,
          existingId: existing?.id || null,
          reason: existing ? "Matching phone in CRM (Preserved)" : "Duplicate phone in upload (Preserved)",
        });
      }

      const created = await db.lead.create({
        data: {
          fullName: row.fullName,
          phone: cleanPhone || "0000000000",
          email: row.email || `${cleanPhone || `rev${idx}`}@pending.softlabglobal.com`,
          city: row.city || null,
          qualification: row.courseOrCategory || null,
          source: LeadSource.BULK_UPLOAD,
          status: LeadStatus.ON_HOLD,
          duplicateOfLeadId: existing?.id || null,
          duplicateStatus: isDup ? "DUPLICATE_REVIEW" : "NONE",
          duplicateReviewMeta: isDup
            ? { reason: existing ? "Matching phone in CRM" : "Duplicate phone in upload", preservedAt: new Date().toISOString() }
            : undefined,
          notes: `[AI-IMPORT-PENDING | Batch: ${batchCode}${isDup ? " | DUPLICATE_REVIEW" : ""}] ${row.notes}`,
        },
      });
      stagedCount++;
      stagedIds.push(created.id);
    }

    await db.leadImportBatch.create({
      data: {
        batchCode,
        uploaderId: String(auth.token.sub),
        fileName,
        source: LeadSource.BULK_UPLOAD,
        totalRows: extracted.length,
        createdCount: stagedCount,
        updatedCount: 0,
        failedCount: duplicateCount + invalidCount,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  await db.auditLog.create({
    data: {
      actorId: String(auth.token.sub),
      action: "ENTERPRISE_AI_DATA_IMPORT",
      resourceType: recordType,
      resourceId: batchCode,
      newData: { fileName, totalExtracted: extracted.length, stagedCount, duplicateCount, invalidCount },
    },
  });

  return NextResponse.json({
    success: true,
    batchCode,
    recordType,
    totalExtracted: extracted.length,
    stagedCount,
    duplicateCount,
    invalidCount,
    stagedIds,
    duplicates,
    previewRows: extracted.slice(0, 25),
    message: `${stagedCount} records staged as PENDING APPROVAL (ON_HOLD). ${duplicateCount} duplicates skipped.`,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthorityAuth(req);
  if (auth.error || !auth.token) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
  const action = String(body.action || "").toUpperCase();
  const leadIds: string[] = Array.isArray(body.leadIds) ? body.leadIds : [];
  const assigneeId: string | undefined = body.assigneeId || undefined;
  const targetRole: string | undefined = body.targetRole || undefined;

  if (leadIds.length === 0) {
    return NextResponse.json({ error: "Select at least one record." }, { status: 400 });
  }

  if (action === "APPROVE") {
    const updated = await db.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: LeadStatus.NEW },
    });
    await db.auditLog.create({
      data: {
        actorId: String(auth.token.sub),
        action: "DATA_HUB_APPROVE_LEADS",
        resourceType: "Lead",
        resourceId: leadIds[0],
        newData: { count: updated.count, leadIds },
      },
    });
    return NextResponse.json({ success: true, action, updatedCount: updated.count });
  }

  if (action === "REJECT") {
    const updated = await db.lead.updateMany({
      where: { id: { in: leadIds } },
      data: { status: LeadStatus.LOST, lostReason: "Rejected during Enterprise Data Hub review" },
    });
    await db.auditLog.create({
      data: {
        actorId: String(auth.token.sub),
        action: "DATA_HUB_REJECT_LEADS",
        resourceType: "Lead",
        resourceId: leadIds[0],
        newData: { count: updated.count, leadIds },
      },
    });
    return NextResponse.json({ success: true, action, updatedCount: updated.count });
  }

  if (action === "DISTRIBUTE") {
    let targetUsers: { id: string; name: string; roleCode: UserRoleCode }[] = [];
    if (assigneeId) {
      const u = await db.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, firstName: true, lastName: true, roleCode: true },
      });
      if (u) targetUsers = [{ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), roleCode: u.roleCode }];
    } else {
      const roleFilter =
        targetRole && ["COUNSELOR", "TELECALLER"].includes(targetRole)
          ? [targetRole as UserRoleCode]
          : [UserRoleCode.COUNSELOR, UserRoleCode.TELECALLER];
      const users = await db.user.findMany({
        where: { status: "ACTIVE", roleCode: { in: roleFilter } },
        select: { id: true, firstName: true, lastName: true, roleCode: true },
        orderBy: { firstName: "asc" },
      });
      targetUsers = users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}`.trim(), roleCode: u.roleCode }));
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No active target staff found for distribution." }, { status: 400 });
    }

    let distributedCount = 0;
    for (let i = 0; i < leadIds.length; i++) {
      const staff = targetUsers[i % targetUsers.length];
      await db.lead.update({
        where: { id: leadIds[i] },
        data: {
          status: LeadStatus.NEW,
          assignedToId: staff.id,
          ...(staff.roleCode === UserRoleCode.COUNSELOR ? { assignedCounselorId: staff.id } : {}),
          ...(staff.roleCode === UserRoleCode.TELECALLER ? { assignedTelecallerId: staff.id } : {}),
        },
      });
      await db.leadActivity.create({
        data: {
          leadId: leadIds[i],
          userId: String(auth.token.sub),
          activityType: "ASSIGNED",
          notes: `Approved & distributed to ${staff.name} (${staff.roleCode}) via Enterprise Data Hub`,
        },
      });
      distributedCount++;
    }

    await db.auditLog.create({
      data: {
        actorId: String(auth.token.sub),
        action: "DATA_HUB_DISTRIBUTE_LEADS",
        resourceType: "Lead",
        resourceId: leadIds[0],
        newData: { distributedCount, targetStaff: targetUsers.map((u) => u.name) },
      },
    });

    return NextResponse.json({
      success: true,
      action,
      distributedCount,
      assignedTo: targetUsers.map((u) => u.name).join(", "),
    });
  }

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
