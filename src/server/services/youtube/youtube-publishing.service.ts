import { db } from "@/server/db/client";
import { createHmac, randomBytes } from "crypto";
import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join } from "path";

const STATE_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "softlab-youtube-oauth-state-secret-2026";

export type YouTubeDiagnosticStatus =
  | "NOT_CONFIGURED"
  | "AUTHORIZATION_REQUIRED"
  | "CONNECTED"
  | "DEGRADED"
  | "ERROR";

export interface YouTubeOAuthConfig {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  channelId?: string;
  channelTitle?: string;
  channelThumbnailUrl?: string;
  defaultPrivacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
  autoPublishEnabled?: boolean;
  allowedCourseIds?: string[];
  redirectUri?: string;
  connectedAt?: string;
  connectedBy?: string;
  lastHealthCheck?: string;
  lastError?: string;
  isUploadReady?: boolean;
}

export interface YouTubeDetailedDiagnostics {
  status: YouTubeDiagnosticStatus;
  statusReason: string;
  diagnosticCategory: number;
  diagnosticCategoryDescription: string;
  isConfigured: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
  channelId: string | null;
  channelTitle: string;
  channelThumbnailUrl: string | null;
  defaultPrivacy: "PRIVATE" | "UNLISTED" | "PUBLIC";
  autoPublishEnabled: boolean;
  redirectUri: string;
  tokenRefreshStatus: "HEALTHY" | "INVALID_GRANT" | "INVALID_CLIENT" | "MISSING" | "ERROR";
  apiConnectivity: "HEALTHY" | "QUOTA_EXCEEDED" | "DISABLED" | "UNREACHABLE" | "PENDING";
  uploadCapability: boolean;
  lastHealthCheckAt: string | null;
  lastError: string | null;
  queueStats: {
    totalQueued: number;
    totalProcessing: number;
    totalPublished: number;
    totalFailed: number;
    totalBlockedPrivacy: number;
  };
}

export class YouTubePublishingService {
  /**
   * Retrieves active YouTube OAuth configuration merged from database system_settings and env
   */
  public static async getOAuthConfig(): Promise<YouTubeOAuthConfig> {
    let storedConfig: any = {};
    try {
      const setting = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });
      if (setting && typeof setting.value === "object") {
        storedConfig = setting.value;
      }
    } catch {}

    const clientId = storedConfig.clientId || process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = storedConfig.clientSecret || process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = storedConfig.refreshToken || process.env.YOUTUBE_REFRESH_TOKEN;
    const channelId = storedConfig.channelId || process.env.YOUTUBE_CHANNEL_ID;
    const redirectUri =
      storedConfig.redirectUri ||
      process.env.YOUTUBE_REDIRECT_URI ||
      "https://lms.softlabglobal.com/api/auth/youtube/callback";

    return {
      clientId: clientId ? String(clientId).trim() : undefined,
      clientSecret: clientSecret ? String(clientSecret).trim() : undefined,
      refreshToken: refreshToken ? String(refreshToken).trim() : undefined,
      accessToken: storedConfig.accessToken,
      tokenExpiresAt: storedConfig.tokenExpiresAt,
      channelId: channelId ? String(channelId).trim() : undefined,
      channelTitle: storedConfig.channelTitle || "SoftLab Global Official",
      channelThumbnailUrl: storedConfig.channelThumbnailUrl,
      defaultPrivacy: storedConfig.defaultPrivacy || "PRIVATE", // Enforce PRIVATE by default per policy
      autoPublishEnabled: storedConfig.autoPublishEnabled ?? true,
      allowedCourseIds: storedConfig.allowedCourseIds || [],
      redirectUri,
      connectedAt: storedConfig.connectedAt,
      connectedBy: storedConfig.connectedBy,
      lastHealthCheck: storedConfig.lastHealthCheck,
      lastError: storedConfig.lastError,
      isUploadReady: storedConfig.isUploadReady ?? false,
    };
  }

  /**
   * Generates cryptographic state token for Google OAuth CSRF protection
   */
  public static createOAuthStateToken(userId: string): string {
    const payload = JSON.stringify({
      userId,
      ts: Date.now(),
      nonce: randomBytes(8).toString("hex"),
    });
    const b64 = Buffer.from(payload).toString("base64url");
    const sig = createHmac("sha256", STATE_SECRET).update(b64).digest("base64url");
    return `${b64}.${sig}`;
  }

  /**
   * Verifies state token received from Google OAuth redirect
   */
  public static verifyOAuthStateToken(state: string): { userId: string } | null {
    try {
      const [b64, sig] = state.split(".");
      if (!b64 || !sig) return null;
      const expectedSig = createHmac("sha256", STATE_SECRET).update(b64).digest("base64url");
      if (sig !== expectedSig) return null;
      const data = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
      // State valid for 20 minutes
      if (Date.now() - data.ts > 20 * 60 * 1000) return null;
      return { userId: data.userId };
    } catch {
      return null;
    }
  }

  /**
   * Generates Google OAuth 2.0 consent URL for connecting the official YouTube channel
   */
  public static async generateOAuthAuthorizationUrl(params: {
    origin?: string;
    userId: string;
  }): Promise<{ authUrl: string; redirectUri: string }> {
    const config = await this.getOAuthConfig();
    if (!config.clientId) {
      throw new Error("YOUTUBE_CLIENT_ID is not configured. Please enter credentials in Settings.");
    }

    const redirectUri =
      process.env.YOUTUBE_REDIRECT_URI ||
      (params.origin ? `${params.origin}/api/auth/youtube/callback` : config.redirectUri!);

    const stateToken = this.createOAuthStateToken(params.userId);

    const queryParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube.readonly",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: stateToken,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${queryParams.toString()}`;
    return { authUrl, redirectUri };
  }

  /**
   * Completes OAuth authorization code flow from callback
   */
  public static async handleOAuthCallback(params: {
    code: string;
    state: string;
    redirectUri: string;
  }): Promise<{
    success: boolean;
    channelTitle: string;
    channelId: string;
  }> {
    const statePayload = this.verifyOAuthStateToken(params.state);
    if (!statePayload) {
      throw new Error("Invalid or expired OAuth state token. Please restart authorization.");
    }

    const config = await this.getOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error("YouTube OAuth client credentials missing on server.");
    }

    // Exchange code with Google OAuth2 token endpoint
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: params.code,
        redirect_uri: params.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      throw new Error(
        `Google token exchange failed: ${tokenData.error_description || tokenData.error || "Unknown error"}`
      );
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token || config.refreshToken;

    if (!refreshToken) {
      throw new Error(
        "Google did not return a refresh token. Please re-authorize and select 'Allow' on consent screen."
      );
    }

    // Verify channel identity via YouTube Data API v3
    const channelResp = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const channelData = await channelResp.json();
    if (!channelResp.ok || !channelData.items || channelData.items.length === 0) {
      throw new Error(
        `Failed to retrieve YouTube channel info: ${channelData.error?.message || "No channel found on this Google account"}`
      );
    }

    const channelItem = channelData.items[0];
    const channelId = channelItem.id;
    const channelTitle = channelItem.snippet?.title || "SoftLab Global Official";
    const channelThumbnailUrl = channelItem.snippet?.thumbnails?.default?.url;

    // Persist verified config in DB systemSetting
    const existing = await db.systemSetting.findUnique({
      where: { key: "youtube_oauth_config" },
    });
    const existingVal = typeof existing?.value === "object" ? (existing.value as any) : {};

    const updatedConfig = {
      ...existingVal,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken,
      accessToken,
      tokenExpiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
      channelId,
      channelTitle,
      channelThumbnailUrl,
      redirectUri: params.redirectUri,
      connectedAt: new Date().toISOString(),
      connectedBy: statePayload.userId,
      isUploadReady: true,
      lastHealthCheck: new Date().toISOString(),
      lastError: null,
    };

    await db.systemSetting.upsert({
      where: { key: "youtube_oauth_config" },
      create: {
        key: "youtube_oauth_config",
        category: "INTEGRATIONS",
        value: updatedConfig,
        isSecret: true,
        updatedBy: statePayload.userId,
      },
      update: {
        value: updatedConfig,
        updatedBy: statePayload.userId,
      },
    });

    // Record in AuditLog
    await db.auditLog.create({
      data: {
        actorId: statePayload.userId,
        action: "CONNECT_YOUTUBE_CHANNEL",
        resourceType: "YOUTUBE_INTEGRATION",
        resourceId: channelId,
        newData: { channelId, channelTitle, redirectUri: params.redirectUri },
      },
    });

    return {
      success: true,
      channelTitle,
      channelId,
    };
  }

  /**
   * Refreshes access token using stored refresh token
   */
  public static async refreshAccessToken(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const config = await this.getOAuthConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Missing Google OAuth2 Client ID or Client Secret.");
    }
    if (!config.refreshToken) {
      throw new Error("Missing YouTube OAuth Refresh Token. Channel authorization required.");
    }

    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || "Token refresh failed";
      // Update systemSetting with last error
      await this.recordLastError(errMsg);
      throw new Error(`Google OAuth token refresh failed: ${errMsg}`);
    }

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 3600,
    };
  }

  /**
   * Safe live connection test to Google OAuth2 and YouTube Data API v3
   */
  public static async testConnection(): Promise<{
    success: boolean;
    status: YouTubeDiagnosticStatus;
    channelTitle: string;
    channelId: string | null;
    channelThumbnailUrl?: string;
    error?: string;
  }> {
    const config = await this.getOAuthConfig();

    if (!config.clientId || !config.clientSecret) {
      return {
        success: false,
        status: "NOT_CONFIGURED",
        channelTitle: config.channelTitle || "Official Channel",
        channelId: null,
        error: "Google OAuth Client ID or Client Secret is missing. Configure in settings.",
      };
    }

    if (!config.refreshToken) {
      return {
        success: false,
        status: "AUTHORIZATION_REQUIRED",
        channelTitle: config.channelTitle || "Official Channel",
        channelId: config.channelId || null,
        error: "OAuth authorization incomplete. Please click 'Connect YouTube Channel'.",
      };
    }

    try {
      const { accessToken } = await this.refreshAccessToken();

      // Query YouTube Data API for authentic channel identity
      const channelResp = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const channelData = await channelResp.json();
      if (!channelResp.ok) {
        const errorMsg = channelData.error?.message || "YouTube API error";
        await this.recordLastError(errorMsg);
        return {
          success: false,
          status: errorMsg.toLowerCase().includes("quota") ? "DEGRADED" : "ERROR",
          channelTitle: config.channelTitle || "Official Channel",
          channelId: config.channelId || null,
          error: errorMsg,
        };
      }

      if (!channelData.items || channelData.items.length === 0) {
        const err = "Connected Google account lacks an active YouTube channel.";
        await this.recordLastError(err);
        return {
          success: false,
          status: "ERROR",
          channelTitle: "No Channel Found",
          channelId: null,
          error: err,
        };
      }

      const item = channelData.items[0];
      const verifiedChannelId = item.id;
      const verifiedTitle = item.snippet?.title || "SoftLab Global Official";
      const verifiedThumbnail = item.snippet?.thumbnails?.default?.url;

      // Update health check in database
      const existing = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });
      if (existing && typeof existing.value === "object") {
        await db.systemSetting.update({
          where: { key: "youtube_oauth_config" },
          data: {
            value: {
              ...(existing.value as any),
              channelId: verifiedChannelId,
              channelTitle: verifiedTitle,
              channelThumbnailUrl: verifiedThumbnail,
              lastHealthCheck: new Date().toISOString(),
              lastError: null,
              isUploadReady: true,
            },
          },
        });
      }

      return {
        success: true,
        status: "CONNECTED",
        channelTitle: verifiedTitle,
        channelId: verifiedChannelId,
        channelThumbnailUrl: verifiedThumbnail,
      };
    } catch (err: any) {
      await this.recordLastError(err.message);
      const isGrantError = err.message.includes("invalid_grant") || err.message.includes("revoked");
      return {
        success: false,
        status: isGrantError ? "DEGRADED" : "ERROR",
        channelTitle: config.channelTitle || "Official Channel",
        channelId: config.channelId || null,
        error: err.message,
      };
    }
  }

  /**
   * Disconnects official YouTube channel and clears tokens
   */
  public static async disconnectChannel(actorId: string): Promise<{ success: boolean }> {
    const existing = await db.systemSetting.findUnique({
      where: { key: "youtube_oauth_config" },
    });
    if (existing && typeof existing.value === "object") {
      const val = existing.value as any;
      const updated = {
        ...val,
        refreshToken: undefined,
        accessToken: undefined,
        isUploadReady: false,
        disconnectedAt: new Date().toISOString(),
        disconnectedBy: actorId,
      };
      await db.systemSetting.update({
        where: { key: "youtube_oauth_config" },
        data: { value: updated, updatedBy: actorId },
      });
    }

    await db.auditLog.create({
      data: {
        actorId,
        action: "DISCONNECT_YOUTUBE_CHANNEL",
        resourceType: "YOUTUBE_INTEGRATION",
        resourceId: "channel",
        newData: { disconnectedAt: new Date().toISOString() },
      },
    });

    return { success: true };
  }

  /**
   * Comprehensive diagnostic analysis covering the 9 root cause categories
   */
  public static async getDetailedDiagnostics(): Promise<YouTubeDetailedDiagnostics> {
    const config = await this.getOAuthConfig();

    const [totalQueued, totalProcessing, totalPublished, totalFailed, totalBlockedPrivacy] =
      await Promise.all([
        db.youTubePublishQueue.count({ where: { status: "QUEUED" } }),
        db.youTubePublishQueue.count({ where: { status: "PROCESSING" } }),
        db.youTubePublishQueue.count({ where: { status: "PUBLISHED" } }),
        db.youTubePublishQueue.count({ where: { status: "FAILED" } }),
        db.classRecording.count({ where: { youTubePublishStatus: "BLOCKED_PRIVACY" } }),
      ]);

    const queueStats = {
      totalQueued,
      totalProcessing,
      totalPublished,
      totalFailed,
      totalBlockedPrivacy,
    };

    const hasClientId = !!config.clientId;
    const hasClientSecret = !!config.clientSecret;
    const hasRefreshToken = !!config.refreshToken;
    const isConfigured = hasClientId && hasClientSecret;

    // Evaluate diagnostic category (1 through 9)
    if (!hasClientId || !hasClientSecret) {
      return {
        status: "NOT_CONFIGURED",
        statusReason: "Google Cloud OAuth credentials missing on server.",
        diagnosticCategory: 1,
        diagnosticCategoryDescription:
          "Credentials missing: YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET is not configured.",
        isConfigured: false,
        hasClientId,
        hasClientSecret,
        hasRefreshToken,
        channelId: config.channelId || null,
        channelTitle: config.channelTitle || "SoftLab Global Official",
        channelThumbnailUrl: config.channelThumbnailUrl || null,
        defaultPrivacy: config.defaultPrivacy || "PRIVATE",
        autoPublishEnabled: config.autoPublishEnabled ?? true,
        redirectUri: config.redirectUri!,
        tokenRefreshStatus: "MISSING",
        apiConnectivity: "PENDING",
        uploadCapability: false,
        lastHealthCheckAt: config.lastHealthCheck || null,
        lastError: config.lastError || null,
        queueStats,
      };
    }

    if (!hasRefreshToken) {
      return {
        status: "AUTHORIZATION_REQUIRED",
        statusReason: "OAuth client configured, but channel authorization has not been granted.",
        diagnosticCategory: 3,
        diagnosticCategoryDescription:
          "OAuth authorization incomplete: Refresh token missing. Click 'Connect Official Channel'.",
        isConfigured: true,
        hasClientId,
        hasClientSecret,
        hasRefreshToken: false,
        channelId: config.channelId || null,
        channelTitle: config.channelTitle || "SoftLab Global Official",
        channelThumbnailUrl: config.channelThumbnailUrl || null,
        defaultPrivacy: config.defaultPrivacy || "PRIVATE",
        autoPublishEnabled: config.autoPublishEnabled ?? true,
        redirectUri: config.redirectUri!,
        tokenRefreshStatus: "MISSING",
        apiConnectivity: "PENDING",
        uploadCapability: false,
        lastHealthCheckAt: config.lastHealthCheck || null,
        lastError: config.lastError || null,
        queueStats,
      };
    }

    // Both credentials and refresh token exist: evaluate health
    if (config.lastError && (config.lastError.includes("invalid_grant") || config.lastError.includes("revoked"))) {
      return {
        status: "DEGRADED",
        statusReason: "OAuth refresh token is expired or revoked by Google account security.",
        diagnosticCategory: 4,
        diagnosticCategoryDescription:
          "Refresh token missing, expired, or revoked. Please reconnect the channel.",
        isConfigured: true,
        hasClientId,
        hasClientSecret,
        hasRefreshToken: true,
        channelId: config.channelId || null,
        channelTitle: config.channelTitle || "SoftLab Global Official",
        channelThumbnailUrl: config.channelThumbnailUrl || null,
        defaultPrivacy: config.defaultPrivacy || "PRIVATE",
        autoPublishEnabled: config.autoPublishEnabled ?? true,
        redirectUri: config.redirectUri!,
        tokenRefreshStatus: "INVALID_GRANT",
        apiConnectivity: "DISABLED",
        uploadCapability: false,
        lastHealthCheckAt: config.lastHealthCheck || null,
        lastError: config.lastError,
        queueStats,
      };
    }

    if (config.lastError && config.lastError.toLowerCase().includes("quota")) {
      return {
        status: "DEGRADED",
        statusReason: "YouTube Data API daily quota limit reached.",
        diagnosticCategory: 6,
        diagnosticCategoryDescription: "YouTube Data API quota exceeded.",
        isConfigured: true,
        hasClientId,
        hasClientSecret,
        hasRefreshToken: true,
        channelId: config.channelId || null,
        channelTitle: config.channelTitle || "SoftLab Global Official",
        channelThumbnailUrl: config.channelThumbnailUrl || null,
        defaultPrivacy: config.defaultPrivacy || "PRIVATE",
        autoPublishEnabled: config.autoPublishEnabled ?? true,
        redirectUri: config.redirectUri!,
        tokenRefreshStatus: "HEALTHY",
        apiConnectivity: "QUOTA_EXCEEDED",
        uploadCapability: false,
        lastHealthCheckAt: config.lastHealthCheck || null,
        lastError: config.lastError,
        queueStats,
      };
    }

    if (config.lastError) {
      return {
        status: "ERROR",
        statusReason: config.lastError,
        diagnosticCategory: 8,
        diagnosticCategoryDescription: `Database, recording storage, or queue worker error: ${config.lastError}`,
        isConfigured: true,
        hasClientId,
        hasClientSecret,
        hasRefreshToken: true,
        channelId: config.channelId || null,
        channelTitle: config.channelTitle || "SoftLab Global Official",
        channelThumbnailUrl: config.channelThumbnailUrl || null,
        defaultPrivacy: config.defaultPrivacy || "PRIVATE",
        autoPublishEnabled: config.autoPublishEnabled ?? true,
        redirectUri: config.redirectUri!,
        tokenRefreshStatus: "ERROR",
        apiConnectivity: "UNREACHABLE",
        uploadCapability: false,
        lastHealthCheckAt: config.lastHealthCheck || null,
        lastError: config.lastError,
        queueStats,
      };
    }

    // Fully verified connection
    return {
      status: "CONNECTED",
      statusReason: "Official YouTube Channel connected and verified with active OAuth grant.",
      diagnosticCategory: 9,
      diagnosticCategoryDescription: "OAuth connection valid and upload capability verified.",
      isConfigured: true,
      hasClientId,
      hasClientSecret,
      hasRefreshToken: true,
      channelId: config.channelId || null,
      channelTitle: config.channelTitle || "SoftLab Global Official",
      channelThumbnailUrl: config.channelThumbnailUrl || null,
      defaultPrivacy: config.defaultPrivacy || "PRIVATE",
      autoPublishEnabled: config.autoPublishEnabled ?? true,
      redirectUri: config.redirectUri!,
      tokenRefreshStatus: "HEALTHY",
      apiConnectivity: "HEALTHY",
      uploadCapability: config.isUploadReady ?? true,
      lastHealthCheckAt: config.lastHealthCheck || new Date().toISOString(),
      lastError: null,
      queueStats,
    };
  }

  /**
   * Generates standard professional title for lecture
   * Format: [Course Name] | [Module Name] — [Lecture Topic] | SoftLab Global
   */
  public static generateTitle(courseTitle: string, moduleTitle: string, topicTitle: string): string {
    const brand = " | SoftLab Global";
    const maxContentLength = 100 - brand.length; // 83 characters max
    const cleanCourse = courseTitle.trim();
    const cleanModule = moduleTitle ? ` | ${moduleTitle.trim()}` : "";
    const cleanTopic = topicTitle.trim();

    let content = `${cleanCourse}${cleanModule} — ${cleanTopic}`;
    if (content.length > maxContentLength) {
      content = `${content.slice(0, maxContentLength - 3)}...`;
    }
    return `${content}${brand}`;
  }

  /**
   * Generates comprehensive SEO and institutional description
   */
  public static generateDescription(params: {
    courseTitle: string;
    moduleTitle: string;
    lectureTopic: string;
    trainerName: string;
    batchCode: string;
  }): string {
    return [
      `🎓 ${params.lectureTopic}`,
      `Course: ${params.courseTitle}`,
      params.moduleTitle ? `Module: ${params.moduleTitle}` : "",
      `Faculty: ${params.trainerName} | Batch: ${params.batchCode}`,
      ``,
      `=========================================`,
      `ABOUT SOFTLAB GLOBAL`,
      `SoftLab Global is an industry-leading software training institute & IT development center providing practical hands-on engineering, cloud computing, and AI certifications.`,
      ``,
      `🏢 Main Campus: SoftLab Global, 4th Floor, 211/C/59, Tata Motors Building, M.G Road, Civil Lines, Prayagraj, Uttar Pradesh - 211011`,
      `🌐 Official Portal: https://www.softlabglobal.com`,
      `🎓 LMS & Student Hub: https://lms.softlabglobal.com`,
      `📞 Helpline: +91 9196596979`,
      ``,
      `=========================================`,
      `PROGRAM HIGHLIGHTS`,
      `• 100% Practical Hands-on Labs & Capstone Projects`,
      `• 1,200+ Corporate Hiring Partners & Dedicated Placement Cell`,
      `• Official ISO & University Certification`,
      ``,
      `DISCLAIMER: This educational session is recorded for authorized enrolled learners of SoftLab Global. Unauthorized reproduction, distribution or re-uploading without written consent is strictly prohibited.`,
      ``,
      `#SoftLabGlobal #SoftwareEngineering #TechEducation #FullStack #AI #Prayagraj`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Generates an SVG thumbnail with SoftLab Global branding
   */
  public static generateThumbnailSvg(params: {
    courseTitle: string;
    lectureTopic: string;
    trainerName: string;
  }): string {
    const safeCourse = params.courseTitle.replace(/&/g, "&amp;").slice(0, 45);
    const safeTopic = params.lectureTopic.replace(/&/g, "&amp;").slice(0, 60);
    const safeTrainer = params.trainerName.replace(/&/g, "&amp;").slice(0, 30);

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#020617" />
            <stop offset="40%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1e1b4b" />
          </linearGradient>
          <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fbbf24" />
            <stop offset="100%" stop-color="#f59e0b" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#bg)" />
        <circle cx="1150" cy="100" r="300" fill="#4338ca" opacity="0.15" />
        <circle cx="100" cy="650" r="250" fill="#d97706" opacity="0.1" />

        <rect x="80" y="70" width="8" height="42" fill="#fbbf24" rx="4" />
        <text x="105" y="102" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="800" fill="#ffffff" letter-spacing="2">
          SOFTLAB GLOBAL
        </text>
        <text x="365" y="102" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#fbbf24">
          ACADEMIC MASTERCLASS
        </text>

        <rect x="80" y="160" width="700" height="48" fill="#1e293b" rx="8" stroke="#334155" stroke-width="1.5" />
        <text x="105" y="192" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#38bdf8">
          ${safeCourse}
        </text>

        <text x="80" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="900" fill="#ffffff">
          ${safeTopic}
        </text>

        <g transform="translate(80, 560)">
          <rect width="400" height="70" fill="#0f172a" rx="12" stroke="#4338ca" stroke-width="2" />
          <text x="25" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#94a3b8">
            SESSION INSTRUCTOR
          </text>
          <text x="25" y="54" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="800" fill="#ffffff">
            ${safeTrainer}
          </text>
        </g>

        <text x="1200" y="660" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#64748b" text-anchor="end">
          Civil Lines, Prayagraj • lms.softlabglobal.com
        </text>
      </svg>
    `.trim();
  }

  /**
   * Enqueues a finalized class recording into the YouTube publication queue with strict privacy filter
   */
  public static async enqueueRecordingForPublishing(
    recordingId: string,
    options?: {
      targetPrivacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
      approved?: boolean;
      actorId?: string;
    }
  ): Promise<{
    queued: boolean;
    reason?: string;
    queueItem?: any;
  }> {
    const recording = await db.classRecording.findUnique({
      where: { id: recordingId },
      include: {
        class: {
          include: {
            batch: {
              include: { course: true },
            },
            module: true,
            trainer: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!recording) return { queued: false, reason: "Recording not found" };

    // --- STRICT PRIVACY RULE ---
    // Recruiter interviews, student mock interviews, and assessment recordings
    // must NEVER be automatically or accidentally published to YouTube.
    const isExplicitClass = !!recording.class;
    if (!isExplicitClass) {
      await db.classRecording.update({
        where: { id: recording.id },
        data: { youTubePublishStatus: "BLOCKED_PRIVACY" },
      });
      return { queued: false, reason: "Recording blocked: private interview/assessment session." };
    }

    const { scheduledClass } = { scheduledClass: recording.class };
    const course = scheduledClass.batch.course;
    const moduleTitle = scheduledClass.module?.title || "Curriculum Session";
    const trainerName = scheduledClass.trainer
      ? `${scheduledClass.trainer.user.firstName} ${scheduledClass.trainer.user.lastName}`
      : "Assigned Faculty";

    // Deduplication check: check if already in queue
    const existingQueueItem = await db.youTubePublishQueue.findUnique({
      where: { recordingId },
    });

    if (existingQueueItem) {
      return { queued: true, queueItem: existingQueueItem };
    }

    const config = await this.getOAuthConfig();
    const title = this.generateTitle(course.title, moduleTitle, scheduledClass.title);
    const description = this.generateDescription({
      courseTitle: course.title,
      moduleTitle,
      lectureTopic: scheduledClass.title,
      trainerName,
      batchCode: scheduledClass.batch.code,
    });

    const targetPrivacy = options?.targetPrivacy || config.defaultPrivacy || "PRIVATE";
    const isApproved = options?.approved ?? true;

    const queueItem = await db.youTubePublishQueue.create({
      data: {
        recordingId,
        classId: scheduledClass.id,
        courseTitle: course.title,
        moduleTitle,
        lectureTopic: scheduledClass.title,
        trainerName,
        targetPrivacy,
        status: "QUEUED",
        isApproved,
        approvedById: options?.actorId,
        videoTitle: title,
        videoDescription: description,
        tags: [
          "SoftLab Global",
          course.title,
          "Computer Science",
          "Coding Lecture",
          "Prayagraj",
          "Practical IT Training",
        ],
      },
    });

    await db.classRecording.update({
      where: { id: recordingId },
      data: { youTubePublishStatus: "QUEUED", youTubePrivacy: targetPrivacy },
    });

    return { queued: true, queueItem };
  }

  /**
   * Updates metadata or privacy for a queued item with audit logging
   */
  public static async updateQueueItem(params: {
    itemId: string;
    videoTitle?: string;
    videoDescription?: string;
    tags?: string[];
    targetPrivacy?: "PRIVATE" | "UNLISTED" | "PUBLIC";
    isApproved?: boolean;
    actorId: string;
  }): Promise<{ success: boolean; item: any }> {
    const existing = await db.youTubePublishQueue.findUnique({
      where: { id: params.itemId },
    });

    if (!existing) {
      throw new Error("Queue item not found");
    }

    if (existing.status === "PUBLISHED") {
      throw new Error("Cannot edit metadata of an already published video");
    }

    const updated = await db.youTubePublishQueue.update({
      where: { id: params.itemId },
      data: {
        ...(params.videoTitle ? { videoTitle: params.videoTitle.trim() } : {}),
        ...(params.videoDescription ? { videoDescription: params.videoDescription } : {}),
        ...(params.tags ? { tags: params.tags } : {}),
        ...(params.targetPrivacy ? { targetPrivacy: params.targetPrivacy } : {}),
        ...(params.isApproved !== undefined
          ? { isApproved: params.isApproved, approvedById: params.actorId }
          : {}),
      },
    });

    await db.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "UPDATE_YOUTUBE_QUEUE_ITEM",
        resourceType: "YOUTUBE_PUBLISH_QUEUE",
        resourceId: params.itemId,
        previousData: {
          videoTitle: existing.videoTitle,
          targetPrivacy: existing.targetPrivacy,
          isApproved: existing.isApproved,
        },
        newData: {
          videoTitle: updated.videoTitle,
          targetPrivacy: updated.targetPrivacy,
          isApproved: updated.isApproved,
        },
      },
    });

    return { success: true, item: updated };
  }

  /**
   * Resolves physical or local recording media buffer
   */
  public static async resolveRecordingMedia(
    recording: any
  ): Promise<{ buffer: Buffer; mimeType: string } | null> {
    // 1. Try local filesystem paths
    const candidates = [
      join(process.cwd(), "public", "uploads", "recordings", `${recording.id}.mp4`),
      join(process.cwd(), "public", "uploads", "recordings", `${recording.id}.webm`),
      recording.storageKey ? join(process.cwd(), "public", recording.storageKey) : null,
      recording.storageKey ? join(process.cwd(), recording.storageKey) : null,
      recording.videoUrl?.startsWith("/")
        ? join(process.cwd(), "public", recording.videoUrl)
        : null,
    ].filter(Boolean) as string[];

    for (const filePath of candidates) {
      if (existsSync(filePath)) {
        try {
          const buffer = await readFile(filePath);
          return { buffer, mimeType: filePath.endsWith(".webm") ? "video/webm" : "video/mp4" };
        } catch {}
      }
    }

    // 2. Try remote URL fetch if videoUrl is absolute HTTP/HTTPS
    if (recording.videoUrl && /^https?:\/\//i.test(recording.videoUrl)) {
      try {
        const resp = await fetch(recording.videoUrl);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuf),
            mimeType: resp.headers.get("content-type") || "video/mp4",
          };
        }
      } catch {}
    }

    return null;
  }

  /**
   * Generates a compliant minimal MP4 video container buffer for synthetic test uploads
   */
  public static generateTestVideoBuffer(): Buffer {
    // Standard minimal MP4 ftyp + moov container
    const hexData =
      "000000186674797069736f6d0000020069736f6d69736f32617663310000000866726565000000206d646174000000000000000000000000000000000000000000000000";
    return Buffer.from(hexData, "hex");
  }

  /**
   * Performs resumable video upload protocol using official YouTube Data API v3
   */
  public static async uploadVideoToYouTube(params: {
    item: any;
    videoBuffer: Buffer;
    mimeType?: string;
    accessToken: string;
  }): Promise<{
    videoId: string;
    videoUrl: string;
  }> {
    const { item, videoBuffer, accessToken } = params;
    const mime = params.mimeType || "video/mp4";

    // Step 1: Initiate Resumable Upload Session
    const initiateResp = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": mime,
          "X-Upload-Content-Length": videoBuffer.length.toString(),
        },
        body: JSON.stringify({
          snippet: {
            title: item.videoTitle || item.lectureTopic,
            description: item.videoDescription || "",
            tags: item.tags || ["SoftLab Global"],
            categoryId: "27", // Education category
            defaultLanguage: "en",
          },
          status: {
            privacyStatus: (item.targetPrivacy || "PRIVATE").toLowerCase(),
            selfDeclaredMadeForKids: false,
            embeddable: true,
          },
        }),
      }
    );

    if (!initiateResp.ok) {
      const initErr = await initiateResp.json().catch(() => ({}));
      throw new Error(
        `Failed to initiate YouTube upload session: ${initErr.error?.message || initiateResp.statusText}`
      );
    }

    const uploadUrl = initiateResp.headers.get("location");
    if (!uploadUrl) {
      throw new Error("YouTube API did not return resumable upload session location.");
    }

    // Step 2: Upload Media Stream / Buffer to Resumable URL
    const uploadResp = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": mime,
        "Content-Length": videoBuffer.length.toString(),
      },
      body: new Uint8Array(videoBuffer),
    });

    const uploadData = await uploadResp.json().catch(() => ({}));

    if (!uploadResp.ok || !uploadData.id) {
      throw new Error(
        `YouTube video transfer failed: ${uploadData.error?.message || uploadResp.statusText}`
      );
    }

    const videoId = uploadData.id;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    return { videoId, videoUrl };
  }

  /**
   * Processes pending queue items with bounded exponential backoff, resumable upload, and idempotency
   */
  public static async processPublishQueue(
    maxItems = 3,
    options?: { allowSyntheticForTesting?: boolean }
  ): Promise<{
    processed: number;
    published: number;
    failed: number;
    details: Array<{ id: string; status: string; videoId?: string; error?: string }>;
  }> {
    const config = await this.getOAuthConfig();
    const details: Array<{ id: string; status: string; videoId?: string; error?: string }> = [];

    // Check worker pause
    if (config.autoPublishEnabled === false) {
      return {
        processed: 0,
        published: 0,
        failed: 0,
        details: [{ id: "WORKER", status: "PAUSED", error: "Queue processing paused by admin." }],
      };
    }

    const items = await db.youTubePublishQueue.findMany({
      where: {
        status: { in: ["QUEUED", "FAILED"] },
        attemptCount: { lt: 5 },
        isApproved: true,
      },
      orderBy: { createdAt: "asc" },
      take: maxItems,
      include: { recording: true },
    });

    if (items.length === 0) {
      return { processed: 0, published: 0, failed: 0, details: [] };
    }

    let published = 0;
    let failed = 0;

    // Check credentials upfront
    if (!config.clientId || !config.refreshToken) {
      const err = "YouTube OAuth credentials not configured (missing Client ID or Refresh Token).";
      for (const item of items) {
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: { status: "FAILED", errorMessage: err, lastAttemptAt: new Date() },
        });
        failed++;
        details.push({ id: item.id, status: "FAILED", error: err });
      }
      return { processed: items.length, published, failed, details };
    }

    // Refresh access token
    let accessToken: string;
    try {
      const tokenResult = await this.refreshAccessToken();
      accessToken = tokenResult.accessToken;
    } catch (tokenErr: any) {
      for (const item of items) {
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            errorMessage: `Token refresh failed: ${tokenErr.message}`,
            lastAttemptAt: new Date(),
          },
        });
        failed++;
        details.push({ id: item.id, status: "FAILED", error: tokenErr.message });
      }
      return { processed: items.length, published, failed, details };
    }

    // Process each item
    for (const item of items) {
      // Exponential backoff check: if item failed before, ensure required cooldown has elapsed
      if (item.status === "FAILED" && item.lastAttemptAt && item.attemptCount > 0) {
        const cooldownSeconds = Math.min(300, Math.pow(2, item.attemptCount) * 15); // 30s, 60s, 120s, 240s...
        const elapsedSeconds = (Date.now() - new Date(item.lastAttemptAt).getTime()) / 1000;
        if (elapsedSeconds < cooldownSeconds) {
          details.push({
            id: item.id,
            status: "COOLDOWN",
            error: `Backoff cooldown active (${Math.ceil(cooldownSeconds - elapsedSeconds)}s remaining)`,
          });
          continue;
        }
      }

      await db.youTubePublishQueue.update({
        where: { id: item.id },
        data: {
          status: "PROCESSING",
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          uploadProgressPercent: 10,
        },
      });

      try {
        // Resolve media
        let media = await this.resolveRecordingMedia(item.recording);

        // If in explicit test mode and media file does not exist, use test video buffer
        if (!media && options?.allowSyntheticForTesting) {
          media = {
            buffer: this.generateTestVideoBuffer(),
            mimeType: "video/mp4",
          };
        }

        if (!media) {
          const err =
            "Lecture recording media file missing or inaccessible on storage provider. Finalize recording before upload.";
          await db.youTubePublishQueue.update({
            where: { id: item.id },
            data: { status: "FAILED", errorMessage: err, uploadProgressPercent: 0 },
          });
          await db.classRecording.update({
            where: { id: item.recordingId },
            data: { youTubePublishStatus: "FAILED" },
          });
          failed++;
          details.push({ id: item.id, status: "FAILED", error: err });
          continue;
        }

        // Upload to YouTube via Resumable API
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: { status: "UPLOADING", uploadProgressPercent: 50 },
        });

        const uploadResult = await this.uploadVideoToYouTube({
          item,
          videoBuffer: media.buffer,
          mimeType: media.mimeType,
          accessToken,
        });

        // Success: update records
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: {
            status: "PUBLISHED",
            youTubeVideoId: uploadResult.videoId,
            youTubeUrl: uploadResult.videoUrl,
            publishedAt: new Date(),
            errorMessage: null,
            uploadProgressPercent: 100,
          },
        });

        await db.classRecording.update({
          where: { id: item.recordingId },
          data: {
            isPublishedToYouTube: true,
            youTubePublishStatus: "PUBLISHED",
            youTubeVideoId: uploadResult.videoId,
            youTubeUrl: uploadResult.videoUrl,
          },
        });

        published++;
        details.push({
          id: item.id,
          status: "PUBLISHED",
          videoId: uploadResult.videoId,
        });
      } catch (uploadErr: any) {
        const errMsg = uploadErr.message || "Upload failed";
        await db.youTubePublishQueue.update({
          where: { id: item.id },
          data: {
            status: "FAILED",
            errorMessage: errMsg,
            uploadProgressPercent: 0,
          },
        });
        await db.classRecording.update({
          where: { id: item.recordingId },
          data: { youTubePublishStatus: "FAILED" },
        });
        failed++;
        details.push({ id: item.id, status: "FAILED", error: errMsg });
      }
    }

    return { processed: items.length, published, failed, details };
  }

  private static async recordLastError(error: string) {
    try {
      const existing = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });
      if (existing && typeof existing.value === "object") {
        await db.systemSetting.update({
          where: { key: "youtube_oauth_config" },
          data: {
            value: {
              ...(existing.value as any),
              lastError: error,
              lastHealthCheck: new Date().toISOString(),
            },
          },
        });
      }
    } catch {}
  }
}
