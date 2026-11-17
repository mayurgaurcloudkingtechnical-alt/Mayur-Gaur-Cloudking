import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { LeadSource, LeadStatus } from "@prisma/client";
import { db } from "@/server/db/client";
import {
  ChunkedBulkImportService,
  parseFreeformText,
  parseLeadFileBuffer,
  type ParsedBulkLeadInput,
} from "@/server/services/chunked-bulk-import.service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "ADMIN",
  "MANAGER",
  "HR",
  "COUNSELOR",
  "TELECALLER",
];

async function getActorFromRequest(req: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const token =
    (await getToken({ req, secret, secureCookie: true }).catch(() => null)) ||
    (await getToken({ req, secret, secureCookie: false }).catch(() => null));
  if (!token?.sub || !ALLOWED_ROLES.includes(String(token.roleCode || ""))) {
    return null;
  }
  const fullName = String(token.name || "Staff User").trim();
  const [firstName, ...rest] = fullName.split(/\s+/);
  return {
    id: String(token.sub),
    firstName: firstName || "Staff",
    lastName: rest.join(" ") || "",
    roleCode: String(token.roleCode || ""),
  };
}

function parseSource(raw?: string | null): LeadSource {
  if (!raw) return LeadSource.BULK_UPLOAD;
  const upper = raw.toUpperCase();
  if (upper in LeadSource) return LeadSource[upper as keyof typeof LeadSource];
  return LeadSource.BULK_UPLOAD;
}

function parseTargetStatus(raw?: string | null): LeadStatus {
  if (!raw) return LeadStatus.ON_HOLD;
  const upper = raw.toUpperCase();
  if (upper in LeadStatus) return LeadStatus[upper as keyof typeof LeadStatus];
  return LeadStatus.ON_HOLD;
}

export async function POST(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let leads: ParsedBulkLeadInput[] = [];
    let fileName = "bulk-leads-import.csv";
    let chunkSize = 500;
    let source: LeadSource = LeadSource.BULK_UPLOAD;
    let targetStatus: LeadStatus = LeadStatus.ON_HOLD;
    let captureMethod = "BULK_CSV_XLSX";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const rawText = formData.get("rawText");
      const cs = formData.get("chunkSize");
      const src = formData.get("source");
      const ts = formData.get("targetStatus");
      const cm = formData.get("captureMethod");

      if (cs) chunkSize = Number(cs) || 500;
      if (typeof src === "string") source = parseSource(src);
      if (typeof ts === "string") targetStatus = parseTargetStatus(ts);
      if (typeof cm === "string" && cm.trim()) captureMethod = cm.trim();

      if (file instanceof File) {
        fileName = file.name || fileName;
        const buffer = Buffer.from(await file.arrayBuffer());
        leads = await parseLeadFileBuffer(buffer, fileName);
      } else if (typeof rawText === "string" && rawText.trim()) {
        fileName = "smart-capture-raw.txt";
        leads = parseFreeformText(rawText);
      }
    } else {
      const body = await req.json();
      if (body.fileName) fileName = String(body.fileName);
      if (body.chunkSize) chunkSize = Number(body.chunkSize) || 500;
      if (body.source) source = parseSource(String(body.source));
      if (body.targetStatus) targetStatus = parseTargetStatus(String(body.targetStatus));
      if (body.captureMethod) captureMethod = String(body.captureMethod);

      if (Array.isArray(body.leads)) {
        leads = body.leads;
      } else if (typeof body.rawText === "string") {
        leads = parseFreeformText(body.rawText);
      }
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid lead records found in the uploaded file or payload." },
        { status: 400 }
      );
    }

    const batch = await ChunkedBulkImportService.createAndStartJob(actor, {
      fileName,
      source,
      chunkSize,
      targetStatus,
      captureMethod,
      leads,
    });

    return NextResponse.json({
      ok: true,
      batch: {
        ...batch,
        progressPercent: 0,
      },
      message: `Queued ${batch.totalRows} lead records across ${batch.totalChunks} chunks (chunk size ${batch.chunkSize}). All leads are preserved as-is in ${targetStatus} for review.`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Bulk import initialization failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const action = searchParams.get("action") || "status";

    if (action === "list") {
      const batches = await db.leadImportBatch.findMany({
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          uploader: { select: { firstName: true, lastName: true, email: true } },
        },
      });
      return NextResponse.json({ ok: true, batches });
    }

    if (!batchId) {
      return NextResponse.json({ ok: false, error: "batchId is required" }, { status: 400 });
    }

    if (action === "failed_csv") {
      const csv = await ChunkedBulkImportService.getFailedRowsCsv(batchId);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="failed-rows-${batchId}.csv"`,
        },
      });
    }

    const status = await ChunkedBulkImportService.getBatchStatus(batchId);
    if (!status) {
      return NextResponse.json({ ok: false, error: "Import batch not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, batch: status });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to fetch import batch" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const actor = await getActorFromRequest(req);
    if (!actor) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const batchId = String(body?.batchId || "");
    const action = String(body?.action || "").toUpperCase();

    if (!batchId) {
      return NextResponse.json({ ok: false, error: "batchId is required" }, { status: 400 });
    }

    let batch;
    if (action === "PAUSE") {
      batch = await ChunkedBulkImportService.pauseBatch(batchId);
    } else if (action === "RESUME") {
      batch = await ChunkedBulkImportService.resumeBatch(batchId, actor);
    } else if (action === "CANCEL") {
      batch = await ChunkedBulkImportService.cancelBatch(batchId);
    } else if (action === "RETRY_FAILED") {
      batch = await ChunkedBulkImportService.retryFailedRows(batchId, actor);
    } else {
      return NextResponse.json({ ok: false, error: `Unsupported action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, batch });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Failed to update import batch" },
      { status: 500 }
    );
  }
}
