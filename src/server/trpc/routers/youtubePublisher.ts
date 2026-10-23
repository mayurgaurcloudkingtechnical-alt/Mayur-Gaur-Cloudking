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
   * Get queue summary telemetry & status
   */
  getPublishingStatus: requireRoleProcedure(ADMIN_ROLES).query(async () => {
    const config = await YouTubePublishingService.getOAuthConfig();

    const [totalQueued, totalPublished, totalFailed, totalBlockedPrivacy] = await Promise.all([
      db.youTubePublishQueue.count({ where: { status: { in: ["QUEUED", "PROCESSING"] } } }),
      db.youTubePublishQueue.count({ where: { status: "PUBLISHED" } }),
      db.youTubePublishQueue.count({ where: { status: "FAILED" } }),
      db.classRecording.count({ where: { youTubePublishStatus: "BLOCKED_PRIVACY" } }),
    ]);

    const isConnected = !!(config.clientId && config.refreshToken);

    return {
      isConnected,
      channelId: config.channelId || "Not Connected",
      channelTitle: config.channelTitle,
      defaultPrivacy: config.defaultPrivacy || "UNLISTED",
      autoPublishEnabled: config.autoPublishEnabled,
      stats: {
        totalQueued,
        totalPublished,
        totalFailed,
        totalBlockedPrivacy,
      },
    };
  }),

  /**
   * List recent queue items
   */
  listQueueItems: requireRoleProcedure(ADMIN_ROLES)
    .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ input }) => {
      return db.youTubePublishQueue.findMany({
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  /**
   * Trigger immediate processing of queued recordings
   */
  processQueueNow: requireRoleProcedure(ADMIN_ROLES).mutation(async () => {
    return YouTubePublishingService.processPublishQueue(5);
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
   * Save or update YouTube OAuth2 configuration in system settings
   */
  saveOAuthConfig: requireRoleProcedure([UserRoleCode.SUPER_ADMIN, UserRoleCode.ADMIN])
    .input(
      z.object({
        clientId: z.string().optional(),
        clientSecret: z.string().optional(),
        refreshToken: z.string().optional(),
        channelId: z.string().optional(),
        channelTitle: z.string().optional(),
        defaultPrivacy: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]).default("UNLISTED"),
        autoPublishEnabled: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.systemSetting.findUnique({
        where: { key: "youtube_oauth_config" },
      });

      const currentVal = typeof existing?.value === "object" ? existing.value : {};
      const merged = {
        ...currentVal,
        ...input,
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

      return { success: true, channelTitle: input.channelTitle };
    }),
});
