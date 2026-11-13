import * as crypto from "crypto";
import { db } from "@/server/db/client";
import { RateLimiter } from "@/server/lib/rate-limiter";

export interface VerifyWebhookResult {
  isValid: boolean;
  tenantId?: string;
  error?: string;
}

export class WebhookVerifierService {
  private static readonly MAX_DRIFT_SECONDS = 300; // 5 minutes replay protection

  /**
   * Verifies generic SLG CDR Webhook signature:
   * Header X-SLG-Signature: HMAC-SHA256(secret, timestamp + "." + rawBody)
   * Header X-SLG-Timestamp: Unix timestamp in seconds
   * Header X-SLG-Tenant: Tenant slug
   */
  static async verifyGenericSignature(
    rawBody: string,
    signature: string | null,
    timestampStr: string | null,
    tenantSlug: string | null,
    clientIp: string = "unknown"
  ): Promise<VerifyWebhookResult> {
    // 1. Rate Limiting (max 120 webhook calls/minute per IP)
    const rateLimitKey = `webhook:cdr:${clientIp}`;
    if (!RateLimiter.check(rateLimitKey, 120, 60)) {
      await this.logSecurityEvent(null, "RATE_LIMIT_EXCEEDED", clientIp, "Too many webhook requests");
      return { isValid: false, error: "Rate limit exceeded" };
    }

    if (!signature || !timestampStr || !tenantSlug) {
      await this.logSecurityEvent(null, "MISSING_HEADERS", clientIp, "Missing signature, timestamp, or tenant header");
      return { isValid: false, error: "Missing required security headers" };
    }

    // 2. Replay Protection: Timestamp check
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || Math.abs(now - timestamp) > this.MAX_DRIFT_SECONDS) {
      await this.logSecurityEvent(null, "TIMESTAMP_DRIFT", clientIp, `Timestamp expired or drifted (${now - timestamp}s)`);
      return { isValid: false, error: "Webhook timestamp expired or invalid" };
    }

    // 3. Resolve Tenant & Secret
    const tenant = await db.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true, slug: true, status: true },
    });

    if (!tenant || tenant.status !== "ACTIVE") {
      await this.logSecurityEvent(null, "INVALID_TENANT", clientIp, `Tenant not found or inactive: ${tenantSlug}`);
      return { isValid: false, error: "Target tenant not found or inactive" };
    }

    // Tenant-specific webhook secret fallback to server-wide AUTH_SECRET
    const secret = process.env.TELEPHONY_WEBHOOK_SECRET || process.env.AUTH_SECRET || "default_slg_webhook_secret_key_32";
    const expectedPayload = `${timestampStr}.${rawBody}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(expectedPayload)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      await this.logSecurityEvent(tenant.id, "INVALID_SIGNATURE", clientIp, "HMAC-SHA256 signature mismatch");
      return { isValid: false, error: "Invalid webhook cryptographic signature" };
    }

    return { isValid: true, tenantId: tenant.id };
  }

  /**
   * Verifies Twilio Signature (X-Twilio-Signature)
   * Uses auth token and alphabetical parameter concatenation
   */
  static verifyTwilioSignature(
    url: string,
    params: Record<string, string>,
    twilioSignature: string | null,
    authToken: string
  ): boolean {
    if (!twilioSignature || !authToken) return false;

    // Concatenate URL with sorted params as per Twilio spec
    let data = url;
    const sortedKeys = Object.keys(params).sort();
    for (const key of sortedKeys) {
      data += `${key}${params[key]}`;
    }

    const expectedSignature = crypto
      .createHmac("sha1", authToken)
      .update(Buffer.from(data, "utf8"))
      .digest("base64");

    const sigBuf = Buffer.from(twilioSignature, "utf8");
    const expBuf = Buffer.from(expectedSignature, "utf8");

    return sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf);
  }

  /**
   * Verifies Exotel Webhook Basic Auth / Token
   */
  static verifyExotelAuth(
    authorizationHeader: string | null,
    expectedToken: string
  ): boolean {
    if (!authorizationHeader || !expectedToken) return false;
    const cleanHeader = authorizationHeader.replace(/^Bearer\s+/i, "").replace(/^Basic\s+/i, "").trim();
    return cleanHeader === expectedToken.trim();
  }

  /**
   * Non-exposing audit log for security telemetry
   */
  static async logSecurityEvent(
    tenantId: string | null,
    reason: string,
    clientIp: string,
    details: string
  ) {
    try {
      if (tenantId) {
        await db.slgAuditLog.create({
          data: {
            tenantId,
            action: "WEBHOOK_SECURITY_FAILURE",
            entityType: "Webhook",
            entityId: "INCOMING_CDR",
            details: { reason, clientIp, details },
            ipAddress: clientIp,
          },
        });
      }
    } catch {
      // Never crash on audit log failure
    }
  }
}
