import { NextRequest, NextResponse } from "next/server";
import { SlgRecordingSecurityService } from "@/server/services/slg-recording-security.service";
import { S3StorageService } from "@/server/storage/s3-storage.service";
import { db } from "@/server/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const recordingId = params.id;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Missing required streaming authorization token." },
      { status: 401 }
    );
  }

  // 1. Verify HMAC-SHA256 Signed Stream Token
  const verification = SlgRecordingSecurityService.verifyStreamToken(token);
  if (!verification.isValid || verification.recordingId !== recordingId || !verification.tenantId) {
    return NextResponse.json(
      { success: false, error: verification.error || "Invalid or expired streaming token." },
      { status: 403 }
    );
  }

  // 2. Fetch Recording with Tenant Isolation
  const recording = await db.slgCallRecording.findFirst({
    where: {
      id: recordingId,
      callLog: { tenantId: verification.tenantId },
    },
    include: { callLog: true },
  });

  if (!recording) {
    return NextResponse.json(
      { success: false, error: "Recording not found or access denied." },
      { status: 404 }
    );
  }

  // 3. Storage Availability Check
  if (recording.storageKey.startsWith("http://") || recording.storageKey.startsWith("https://")) {
    return NextResponse.redirect(recording.storageKey);
  }

  if (!S3StorageService.isConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Cloudflare R2 / S3 storage provider is unconfigured in this environment. Audio asset cannot be retrieved.",
        storageKey: recording.storageKey,
      },
      { status: 503 }
    );
  }

  const presigned = S3StorageService.generatePresignedDownloadUrl(recording.storageKey, undefined, 300);
  if (!presigned.available || !presigned.downloadUrl) {
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned storage URL." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(presigned.downloadUrl);
}
