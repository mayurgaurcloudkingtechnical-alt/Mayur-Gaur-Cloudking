import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { S3StorageService } from "@/server/storage/s3-storage.service";
import { TRPCError } from "@trpc/server";

export interface PlaybackAuthResult {
  recordingId: string;
  playbackUrl: string;
  durationSeconds: number;
  mimeType: string;
  storageProvider: string;
  isRealStorageConfigured: boolean;
}

export class SlgRecordingSecurityService {
  private static readonly TOKEN_EXPIRY_MS = 60 * 1000; // 60 seconds

  private static getSecret(): string {
    return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "default_slg_recording_secret_key_32";
  }

  /**
   * Generates a tamper-proof HMAC-SHA256 signed playback token
   */
  static generateStreamToken(recordingId: string, tenantId: string): { token: string; expiresAt: number } {
    const expiresAt = Date.now() + this.TOKEN_EXPIRY_MS;
    const payload = `${recordingId}:${tenantId}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", this.getSecret())
      .update(payload)
      .digest("hex");

    const token = Buffer.from(JSON.stringify({ recordingId, tenantId, expiresAt, sig: signature })).toString("base64url");
    return { token, expiresAt };
  }

  /**
   * Verifies an incoming playback stream token
   */
  static verifyStreamToken(tokenString: string): { isValid: boolean; recordingId?: string; tenantId?: string; error?: string } {
    try {
      const decoded = JSON.parse(Buffer.from(tokenString, "base64url").toString("utf8"));
      const { recordingId, tenantId, expiresAt, sig } = decoded;

      if (!recordingId || !tenantId || !expiresAt || !sig) {
        return { isValid: false, error: "Malformed streaming token" };
      }

      if (Date.now() > expiresAt) {
        return { isValid: false, error: "Streaming token expired" };
      }

      const expectedPayload = `${recordingId}:${tenantId}:${expiresAt}`;
      const expectedSignature = crypto
        .createHmac("sha256", this.getSecret())
        .update(expectedPayload)
        .digest("hex");

      const sigBuf = Buffer.from(sig, "utf8");
      const expBuf = Buffer.from(expectedSignature, "utf8");

      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return { isValid: false, error: "Invalid cryptographic signature" };
      }

      return { isValid: true, recordingId, tenantId };
    } catch {
      return { isValid: false, error: "Invalid token encoding" };
    }
  }

  /**
   * Dispenses secure playback URL with audit logging
   */
  static async getSecurePlaybackUrl(
    tenantId: string,
    actorUserId: string,
    recordingId: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<PlaybackAuthResult> {
    const recording = await db.slgCallRecording.findFirst({
      where: {
        id: recordingId,
        callLog: { tenantId },
      },
      include: { callLog: true },
    });

    if (!recording) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Call recording not found or unauthorized access." });
    }

    // Audit log
    await db.slgAuditLog.create({
      data: {
        tenantId,
        actorUserId,
        action: "CALL_RECORDING_LISTENED",
        entityType: "SlgCallRecording",
        entityId: recording.id,
        details: {
          callLogId: recording.callLogId,
          customerPhone: recording.callLog.customerPhone,
          contactName: recording.callLog.contactName,
          storageProvider: recording.storageProvider,
        },
        ipAddress: clientIp,
        userAgent,
      },
    });

    await db.slgCallRecording.update({
      where: { id: recording.id },
      data: { playbacksCount: { increment: 1 } },
    });

    // Check if Cloud Storage (S3 / Cloudflare R2) is actually configured
    const isS3Configured = S3StorageService.isConfigured();

    let playbackUrl: string;

    if (recording.storageKey.startsWith("http://") || recording.storageKey.startsWith("https://")) {
      // Direct external carrier audio URL
      playbackUrl = recording.storageKey;
    } else if (isS3Configured) {
      // Cloudflare R2 / AWS S3 presigned URL
      const presigned = S3StorageService.generatePresignedDownloadUrl(recording.storageKey, undefined, 300);
      playbackUrl = presigned.available && presigned.downloadUrl ? presigned.downloadUrl : "";
    } else {
      // Local streaming proxy route with HMAC-SHA256 signed token
      const { token } = this.generateStreamToken(recording.id, tenantId);
      playbackUrl = `/api/telephony/recordings/${recording.id}/stream?token=${token}`;
    }

    return {
      recordingId: recording.id,
      playbackUrl,
      durationSeconds: recording.durationSeconds,
      mimeType: recording.mimeType,
      storageProvider: recording.storageProvider,
      isRealStorageConfigured: isS3Configured,
    };
  }
}
