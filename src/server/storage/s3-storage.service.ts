import * as crypto from "crypto";

export interface PresignedUrlResult {
  available: boolean;
  downloadUrl?: string;
  expiresInSec?: number;
  message?: string;
}

export class S3StorageService {
  /**
   * Checks whether valid S3 / R2 storage credentials are configured in the environment.
   */
  static isConfigured(): boolean {
    const accessKey = process.env.STORAGE_ACCESS_KEY?.trim();
    const secretKey = process.env.STORAGE_SECRET_KEY?.trim();
    const bucket = process.env.STORAGE_BUCKET?.trim();

    if (!accessKey || !secretKey || !bucket) {
      return false;
    }

    // Ignore template placeholders
    if (
      accessKey === "YourStorageAccessKey" ||
      accessKey.startsWith("<") ||
      secretKey === "YourStorageSecretKey" ||
      secretKey.startsWith("<")
    ) {
      return false;
    }

    return true;
  }

  /**
   * Generates a short-lived (5-minute / 300s) AWS SigV4 presigned GET URL for private S3 / Cloudflare R2 assets.
   * If storage is unconfigured or credentials are placeholders, safely returns available: false.
   */
  static generatePresignedDownloadUrl(
    storageKey: string,
    fileName?: string,
    expiresInSec = 300
  ): PresignedUrlResult {
    if (!this.isConfigured()) {
      return {
        available: false,
        message: "Document storage service is not configured in this environment.",
      };
    }

    const accessKey = process.env.STORAGE_ACCESS_KEY!.trim();
    const secretKey = process.env.STORAGE_SECRET_KEY!.trim();
    const bucket = process.env.STORAGE_BUCKET!.trim();
    const region = process.env.STORAGE_REGION?.trim() || "auto";
    const endpoint = process.env.STORAGE_ENDPOINT?.trim();

    try {
      // Clean object key
      const cleanKey = storageKey.startsWith("/") ? storageKey.slice(1) : storageKey;
      const now = new Date();
      const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
      const dateStamp = amzDate.substring(0, 8);

      // Determine host and path
      let host: string;
      let urlPath: string;

      if (endpoint) {
        const parsedEndpoint = new URL(endpoint);
        host = parsedEndpoint.host;
        urlPath = `/${bucket}/${encodeURIComponent(cleanKey).replace(/%2F/g, "/")}`;
      } else {
        host = `${bucket}.s3.${region}.amazonaws.com`;
        urlPath = `/${encodeURIComponent(cleanKey).replace(/%2F/g, "/")}`;
      }

      const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;

      // Query parameters for presigned GET
      const queryParams: Record<string, string> = {
        "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
        "X-Amz-Credential": `${accessKey}/${credentialScope}`,
        "X-Amz-Date": amzDate,
        "X-Amz-Expires": expiresInSec.toString(),
        "X-Amz-SignedHeaders": "host",
      };

      if (fileName) {
        queryParams["response-content-disposition"] = `attachment; filename="${encodeURIComponent(fileName)}"`;
      }

      // Canonical query string
      const canonicalQueryString = Object.keys(queryParams)
        .sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
        .join("&");

      const canonicalHeaders = `host:${host}\n`;
      const signedHeaders = "host";
      const payloadHash = "UNSIGNED-PAYLOAD";

      const canonicalRequest = [
        "GET",
        urlPath,
        canonicalQueryString,
        canonicalHeaders,
        signedHeaders,
        payloadHash,
      ].join("\n");

      // String to sign
      const algorithm = "AWS4-HMAC-SHA256";
      const stringToSign = [
        algorithm,
        amzDate,
        credentialScope,
        crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
      ].join("\n");

      // Derive signing key
      const kDate = crypto.createHmac("sha256", "AWS4" + secretKey).update(dateStamp).digest();
      const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
      const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
      const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();

      // Signature
      const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

      const protocol = endpoint ? new URL(endpoint).protocol : "https:";
      const downloadUrl = `${protocol}//${host}${urlPath}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

      return {
        available: true,
        downloadUrl,
        expiresInSec,
      };
    } catch (err: any) {
      return {
        available: false,
        message: "Failed to generate authorized download token.",
      };
    }
  }

  /**
   * Validates permitted URL protocols for external reference links.
   * Rejects dangerous protocols such as javascript:, vbscript:, data:, file:.
   */
  static isSafeUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (trimmed.length === 0) return false;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }
}
