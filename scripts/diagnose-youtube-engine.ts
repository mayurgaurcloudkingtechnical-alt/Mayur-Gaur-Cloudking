import { db } from "../src/server/db/client";
import { YouTubePublishingService } from "../src/server/services/youtube/youtube-publishing.service";

async function runDiagnostics() {
  console.log("==================================================================");
  console.log("SOFTLAB GLOBAL YOUTUBE PUBLISHING ENGINE — AUDIT & DIAGNOSTICS");
  console.log("==================================================================\n");

  // 1. Inspect Environment Variables
  const envStatus = {
    hasClientId: !!process.env.YOUTUBE_CLIENT_ID,
    clientIdLength: process.env.YOUTUBE_CLIENT_ID?.length || 0,
    hasClientSecret: !!process.env.YOUTUBE_CLIENT_SECRET,
    clientSecretLength: process.env.YOUTUBE_CLIENT_SECRET?.length || 0,
    hasRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
    refreshTokenLength: process.env.YOUTUBE_REFRESH_TOKEN?.length || 0,
    hasChannelId: !!process.env.YOUTUBE_CHANNEL_ID,
    channelIdValue: process.env.YOUTUBE_CHANNEL_ID || "(none)",
    hasRedirectUri: !!process.env.YOUTUBE_REDIRECT_URI,
    redirectUriValue: process.env.YOUTUBE_REDIRECT_URI || "(none)",
    nextAuthUrl: process.env.NEXTAUTH_URL || "(none)",
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "(none)",
  };
  console.log("1. Environment Variables Audit:", JSON.stringify(envStatus, null, 2));

  // 2. Inspect Database SystemSettings
  let dbConfig: any = null;
  try {
    const setting = await db.systemSetting.findUnique({
      where: { key: "youtube_oauth_config" },
    });
    if (setting) {
      const val = setting.value as any;
      dbConfig = {
        exists: true,
        isSecret: setting.isSecret,
        category: setting.category,
        updatedAt: setting.updatedAt,
        hasClientId: !!val?.clientId,
        hasClientSecret: !!val?.clientSecret,
        hasRefreshToken: !!val?.refreshToken,
        hasAccessToken: !!val?.accessToken,
        tokenExpiresAt: val?.tokenExpiresAt ? new Date(val.tokenExpiresAt).toISOString() : null,
        channelId: val?.channelId || "(none)",
        channelTitle: val?.channelTitle || "(none)",
        defaultPrivacy: val?.defaultPrivacy || "(none)",
        autoPublishEnabled: val?.autoPublishEnabled,
      };
    } else {
      dbConfig = { exists: false };
    }
  } catch (err: any) {
    dbConfig = { exists: false, error: err.message };
  }
  console.log("\n2. Database system_settings ('youtube_oauth_config'):", JSON.stringify(dbConfig, null, 2));

  // 3. Merged OAuth Config from Service
  const mergedConfig = await YouTubePublishingService.getOAuthConfig();
  console.log("\n3. Active Config in Service:", {
    hasClientId: !!mergedConfig.clientId,
    hasClientSecret: !!mergedConfig.clientSecret,
    hasRefreshToken: !!mergedConfig.refreshToken,
    channelId: mergedConfig.channelId,
    channelTitle: mergedConfig.channelTitle,
    defaultPrivacy: mergedConfig.defaultPrivacy,
    autoPublishEnabled: mergedConfig.autoPublishEnabled,
  });

  // 4. Publication Queue Health Check
  const queueStats = {
    totalQueued: await db.youTubePublishQueue.count({ where: { status: "QUEUED" } }),
    totalProcessing: await db.youTubePublishQueue.count({ where: { status: "PROCESSING" } }),
    totalPublished: await db.youTubePublishQueue.count({ where: { status: "PUBLISHED" } }),
    totalFailed: await db.youTubePublishQueue.count({ where: { status: "FAILED" } }),
    recentItems: await db.youTubePublishQueue.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        lectureTopic: true,
        status: true,
        attemptCount: true,
        errorMessage: true,
        youTubeVideoId: true,
        youTubeUrl: true,
        createdAt: true,
      },
    }),
  };
  console.log("\n4. Publication Queue State:", JSON.stringify(queueStats, null, 2));

  // 5. Determine Diagnostic Category (1 to 9)
  console.log("\n5. Root Cause Classification:");
  if (!mergedConfig.clientId || !mergedConfig.clientSecret) {
    console.log("   -> [STATUS: NOT_CONFIGURED]");
    console.log("   -> Category 1: Credentials missing.");
    console.log("   -> Reason: Neither YOUTUBE_CLIENT_ID nor YOUTUBE_CLIENT_SECRET is configured in .env or database system_settings.");
  } else if (!mergedConfig.refreshToken) {
    console.log("   -> [STATUS: AUTHORIZATION_REQUIRED]");
    console.log("   -> Category 3: OAuth authorization incomplete (Refresh token missing).");
    console.log("   -> Reason: Client ID & Secret configured, but OAuth grant flow has not been executed yet to acquire an authorized refresh token.");
  } else {
    // Both credentials and refresh token exist; test the token refresh!
    console.log("   -> Testing token refresh with Google OAuth2 API...");
    try {
      const resp = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: mergedConfig.clientId,
          client_secret: mergedConfig.clientSecret,
          refresh_token: mergedConfig.refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.log(`   -> [STATUS: ERROR] Google token refresh failed with code ${resp.status}`);
        console.log(`   -> Details: ${data.error} - ${data.error_description}`);
        if (data.error === "invalid_grant") {
          console.log("   -> Category 4: Refresh token missing, expired, or revoked.");
        } else if (data.error === "invalid_client") {
          console.log("   -> Category 2: OAuth client configuration invalid.");
        }
      } else {
        console.log("   -> Token refresh SUCCESS! Access token obtained.");
        // Test Channel identity
        const channelResp = await fetch(
          "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true",
          {
            headers: { Authorization: `Bearer ${data.access_token}` },
          }
        );
        const channelData = await channelResp.json();
        if (!channelResp.ok) {
          console.log(`   -> Category 6: YouTube Data API error: ${channelData.error?.message}`);
        } else if (!channelData.items || channelData.items.length === 0) {
          console.log("   -> Category 7: Connected Google account lacks a YouTube channel.");
        } else {
          const ch = channelData.items[0];
          console.log(`   -> [STATUS: CONNECTED] Official Channel: ${ch.snippet?.title} (ID: ${ch.id})`);
          console.log("   -> Category 9: OAuth connection valid and verified.");
        }
      }
    } catch (e: any) {
      console.log(`   -> Category 8: Network or service failure: ${e.message}`);
    }
  }

  console.log("\n==================================================================");
}

runDiagnostics()
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));
