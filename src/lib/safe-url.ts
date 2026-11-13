import { type NextRequest } from "next/server";

/**
 * Normalizes and sanitizes redirect URLs so that they never redirect to
 * 0.0.0.0, non-routable IPs, or invalid hosts, which cause ERR_ADDRESS_INVALID in Chromium.
 * 
 * In production behind Nginx reverse-proxy, enforces canonical host and HTTPS.
 * In local development, safely falls back to localhost:3000 / 127.0.0.1:3000.
 */
export function getSafeRedirectUrl(targetPath: string, req: NextRequest | Request): URL {
  const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  let host = hostHeader.toLowerCase().trim();

  // If host is empty or contains 0.0.0.0 or is invalid
  const isInvalidHost = !host || host.includes("0.0.0.0") || host.startsWith("0.0.0.0:");

  const protoHeader = req.headers.get("x-forwarded-proto") || "";
  const isExplicitHttps = protoHeader.toLowerCase() === "https";
  const isProduction = process.env.NODE_ENV === "production";

  let resolvedOrigin: string;

  if (isInvalidHost) {
    if (isProduction) {
      const configuredUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://lms.softlabglobal.com";
      try {
        const parsed = new URL(configuredUrl);
        resolvedOrigin = parsed.origin;
      } catch {
        resolvedOrigin = "https://lms.softlabglobal.com";
      }
    } else {
      resolvedOrigin = "http://localhost:3000";
    }
  } else {
    const isHttps = isExplicitHttps || (isProduction && !host.includes("localhost") && !host.includes("127.0.0.1"));
    const proto = isHttps ? "https" : "http";
    resolvedOrigin = `${proto}://${host}`;
  }

  // Ensure targetPath starts with /
  const path = targetPath.startsWith("/") ? targetPath : `/${targetPath}`;
  return new URL(path, resolvedOrigin);
}
