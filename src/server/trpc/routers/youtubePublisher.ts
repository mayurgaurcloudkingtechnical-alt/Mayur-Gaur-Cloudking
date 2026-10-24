import { z } from "zod";
import { router, requireRoleProcedure } from "../init";
import { UserRoleCode } from "@prisma/client";
import { YouTubePublishingService } from "@/server/services/youtube/youtube-publishing.service";
import { db } from "@/server/db/client";

const ADMIN_ROLES = [
  UserRoleCode.SUPER_ADMIN,
  UserRoleCode.DIRECTOR,
  UserRoleCode.ADMIN,
  UserRoleCode.MANAGER,
];

export const youtubePublisherRouter = router({
  /**
   * Get queue summary telemetry & detailed connection diagnostics
   */
  getPublishingStatus: requireRoleProcedure(ADMIN_ROLES).query(async () => {
    const diagnostics = await YouTubePublishingService.getDetailedDiagnostics();

    return {
      isConnected: diagnostics.status === "CONNECTED",
      status: diagnostics.status,
      statusReason: diagnostics.statusReason,
      diagnosticCategory: diagnostics.diagnosticCategory,
      diagnosticCategoryDescription: diagnostics.diagnosticCategoryDescription,
      channelId: diagnostics.channelId || "Not Connected",
      channelTitle: diagnostics.channelTitle,
      channelThumbnailUrl: diagnostics.channelThumbnailUrl,
      defaultPrivacy: diagnostics.defaultPrivacy,
      autoPublishEnabled: diagnostics.autoPublishEnabled,
      redirectUri: diagnostics.redirectUri,
      tokenRefreshStatus: diagnostics.tokenRefreshStatus,
      apiConnectivity: diagnostics.apiConnectivity,
      uploadCapability: diagnostics.uploadCapability,
      lastHealthCheckAt: diagnostics.lastHealthCheckAt,
      lastError: diagnostics.lastError,
      hasClientId: diagnostics.hasClientId,
      hasClientSecret: diagnostics.hasClientSecret,
      hasRefreshToken: diagnostics.hasRefreshToken,
      stats: diagnostics.queueStats,
    };
  }),

  /**
   * Generates Google OAuth 2.0 authorization URL for official channel consent
   */
  getOAuthConnectUrl: requireRoleProcedure([
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
  ])
    .input(z.object({ origin: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      return YouTubePublishingService.generateOAuthAuthorizationUrl({
        origin: input?.origin,
        userId: ctx.user.id,
      });
    }),

  /**
   * Safely tests live Google OAuth token refresh and YouTube Channel connectivity
   */
  testConnection: requireRoleProcedure(ADMIN_ROLES).mutation(async () => {
    return YouTubePublishingService.testConnection();
  }),

  /**
   * Disconnects official YouTube channel and clears tokens
   */
  disconnectChannel: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN]).mutation(
    async ({ ctx }) => {
      return YouTubePublishingService.disconnectChannel(ctx.user.id);
    }
  ),

  /**
   * List recent queue items with optional status filtering
   */
  listQueueItems: requireRoleProcedure(ADMIN_ROLES)
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const where: any = {};
      if (input.status && input.status !== "ALL") {
        where.status = input.status;
      }
      return db.youTubePublishQueue.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Updates metadata or privacy setting for a queued video
   */
  updateQueueItem: requireRoleProcedure(ADMIN_ROLES)
    .input(
      z.object({
        itemId: z.string(),
        videoTitle: z.string().min(5).max(100).optional(),
        videoDescription: z.string().max(5000).optional(),
        tags: z.array(z.string()).optional(),
        targetPrivacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).optional(),
        isApproved: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return YouTubePublishingService.updateQueueItem({
        ...input,
        actorId: ctx.user.id,
      });
    }),

  /**
   * Trigger immediate processing of queued recordings
   */
  processQueueNow: requireRoleProcedure(ADMIN_ROLES).mutation(async () => {
    return YouTubePublishingService.processPublishQueue(5);
  }),

  /**
   * Toggle pause/resume on background queue processing
   */
  toggleQueueWorker: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN])
    .input(z.object({ paused: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });
      const currentVal = typeof existing?.value === "object" ? (existing.value as any) : {};
      const updated = {
        ...currentVal,
        autoPublishEnabled: !input.paused,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user.id,
      };

      await db.systemSetting.upsert({
        where: { key: "youtube_oauth_config" },
        create: {
          key: "youtube_oauth_config",
          category: "INTEGRATIONS",
          value: updated,
          isSecret: true,
          updatedBy: ctx.user.id,
        },
        update: {
          value: updated,
          updatedBy: ctx.user.id,
        },
      });

      return { success: true, autoPublishEnabled: !input.paused };
    }),

  /**
   * Manually retry a failed item
   */
  retryItem: requireRoleProcedure(ADMIN_ROLES)
    .input(z.object({ itemId: z.string() }))
    .mutation(async ({ input }) => {
      await db.youTubePublishQueue.update({
        where: { id: input.itemId },
        data: { status: "QUEUED", attemptCount: 0, errorMessage: null },
      });
      return { success: true };
    }),

  /**
   * Save or update YouTube OAuth2 configuration in database system settings
   */
  saveOAuthConfig: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN])
    .input(
      z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        refreshToken: z.string().optional(),
        channelId: z.string().optional(),
        channelTitle: z.string().optional(),
        defaultPrivacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).default("PRIVATE"),
        autoPublishEnabled: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });

      const currentVal = typeof existing?.value === "object" ? (existing.value as any) : {};
      const merged = {
        ...currentVal,
        ...(input.clientId ? { clientId: input.clientId.trim() } : {}),
        ...(input.clientSecret ? { clientSecret: input.clientSecret.trim() } : {}),
        ...(input.refreshToken ? { refreshToken: input.refreshToken.trim() } : {}),
        ...(input.channelId ? { channelId: input.channelId.trim() } : {}),
        ...(input.channelTitle ? { channelTitle: input.channelTitle.trim() } : {}),
        defaultPrivacy: input.defaultPrivacy,
        autoPublishEnabled: input.autoPublishEnabled,
        updatedAt: new Date().toISOString(),
        updatedBy: ctx.user.id,
      };

      await db.systemSetting.upsert({
        where: { key: "youtube_oauth_config" },
        create: {
          key: "youtube_oauth_config",
          category: "INTEGRATIONS",
          value: merged,
          isSecret: true,
          updatedBy: ctx.user.id,
        },
        update: {
          value: merged,
          updatedBy: ctx.user.id,
        },
      });

      return { success: true, channelTitle: merged.channelTitle };
    }),
});
