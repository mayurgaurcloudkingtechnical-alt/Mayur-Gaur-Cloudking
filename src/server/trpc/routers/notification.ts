import { router, protectedProcedure } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "@/server/services/notification.service";
import { DiwaliCampaignBroadcastService } from "@/server/services/diwali-campaign-broadcast.service";
import { CentralNotificationEngine } from "@/server/services/central-notification-engine.service";
import { HigherAuthorityService } from "@/server/services/higher-authority.service";
import { EmailService } from "@/server/services/email.service";
import { WhatsAppBusinessService } from "@/server/services/whatsapp-business.service";
import { UserRoleCode } from "@prisma/client";

function ensureAuthorized(user: any) {
  const allowed = [
    UserRoleCode.SUPER_ADMIN,
    UserRoleCode.DIRECTOR,
    UserRoleCode.ADMIN,
    UserRoleCode.HR,
  ];
  if (!allowed.includes(user.roleCode)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access restricted to Executive Directorate, Administrators and HR.",
    });
  }
}

export const notificationRouter = router({
  // ============================================================================
  // USER NOTIFICATIONS (NAVBAR NOTIFICATION BELL & IN-APP ALERTS)
  // ============================================================================

  /**
   * Retrieves paginated notifications and unread badge count for current session user
   */
  getMyNotifications: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(50).default(20),
          onlyUnread: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      return NotificationService.listUserNotifications(ctx.user.id, input ?? {});
    }),

  /**
   * Marks a single notification as read, enforcing tenant isolation
   */
  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return NotificationService.markAsRead(ctx.user.id, input.notificationId);
    }),

  /**
   * Marks all unread notifications for current user as read
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    return NotificationService.markAllAsRead(ctx.user.id);
  }),

  /**
   * Registers a mobile device push notification token foundation
   */
  registerPushToken: protectedProcedure
    .input(
      z.object({
        pushToken: z.string().min(1),
        deviceId: z.string().optional(),
        platform: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.sessionId) {
        try {
          await ctx.db.userDeviceSession.update({
            where: { id: ctx.sessionId },
            data: {
              deviceId: input.deviceId ?? undefined,
              platform: input.platform ?? undefined,
              lastUsedAt: new Date(),
            },
          });
        } catch {
          // Fault tolerance if session id not found
        }
      }

      return {
        success: true,
        registered: true,
        pushToken: input.pushToken,
      };
    }),

  /**
   * Broadcasts the Diwali Offer 2026 alert to all active platform users
   */
  broadcastDiwaliOfferAlert: protectedProcedure.mutation(async () => {
    return DiwaliCampaignBroadcastService.broadcastToAllUsers();
  }),

  // ============================================================================
  // ENTERPRISE HIGHER AUTHORITY & COMMUNICATION ENGINE (ADMIN DISPATCH)
  // ============================================================================

  getDeliveryStats: protectedProcedure.query(async ({ ctx }) => {
    ensureAuthorized(ctx.user);
    return CentralNotificationEngine.getDeliveryStats();
  }),

  listDeliveryLogs: protectedProcedure
    .input(
      z.object({
        page: z.number().optional().default(1),
        limit: z.number().optional().default(20),
        eventType: z.string().optional(),
        channel: z.string().optional(),
        status: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return CentralNotificationEngine.listDeliveryLogs(input);
    }),

  retryNotification: protectedProcedure
    .input(z.object({ logId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return CentralNotificationEngine.retryNotification(input.logId);
    }),

  listHigherAuthorities: protectedProcedure
    .input(z.object({ search: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return HigherAuthorityService.listHigherAuthorities(input?.search);
    }),

  createHigherAuthority: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        designation: z.string().min(2),
        department: z.string().optional(),
        roleCode: z.nativeEnum(UserRoleCode).optional(),
        officialEmail: z.string().email(),
        personalEmail: z.string().email().optional().or(z.literal("")),
        whatsappNumber: z.string().optional().or(z.literal("")),
        isActive: z.boolean().optional(),
        notifyEmail: z.boolean().optional(),
        notifyPersonalEmail: z.boolean().optional(),
        notifyWhatsApp: z.boolean().optional(),
        receiveDailyReports: z.boolean().optional(),
        receiveEscalations: z.boolean().optional(),
        receiveOnboarding: z.boolean().optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return HigherAuthorityService.createHigherAuthority({
        ...input,
        personalEmail: input.personalEmail || undefined,
        whatsappNumber: input.whatsappNumber || undefined,
      });
    }),

  updateHigherAuthority: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        designation: z.string().optional(),
        department: z.string().optional(),
        roleCode: z.nativeEnum(UserRoleCode).optional(),
        officialEmail: z.string().email().optional(),
        personalEmail: z.string().email().optional().or(z.literal("")),
        whatsappNumber: z.string().optional().or(z.literal("")),
        isActive: z.boolean().optional(),
        notifyEmail: z.boolean().optional(),
        notifyPersonalEmail: z.boolean().optional(),
        notifyWhatsApp: z.boolean().optional(),
        receiveDailyReports: z.boolean().optional(),
        receiveEscalations: z.boolean().optional(),
        receiveOnboarding: z.boolean().optional(),
        priority: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return HigherAuthorityService.updateHigherAuthority({
        ...input,
        personalEmail: input.personalEmail || undefined,
        whatsappNumber: input.whatsappNumber || undefined,
      });
    }),

  toggleHigherAuthorityStatus: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);
      return HigherAuthorityService.toggleStatus(input.id);
    }),

  sendTestNotification: protectedProcedure
    .input(
      z.object({
        channel: z.enum(["OFFICIAL_EMAIL", "PERSONAL_EMAIL", "WHATSAPP"]),
        address: z.string().min(3),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      ensureAuthorized(ctx.user);

      if (input.channel === "OFFICIAL_EMAIL" || input.channel === "PERSONAL_EMAIL") {
        const res = await EmailService.sendEmail({
          to: input.address,
          subject: "Test Dispatch — SOFTLAB GLOBAL Notification Engine",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
              <h2 style="color: #0284c7; margin-top: 0;">SOFTLAB GLOBAL — System Verification Test</h2>
              <p>Hello,</p>
              <p>This is a real-time verification email sent from the SoftLab Global Enterprise Communication Engine.</p>
              <p>Custom payload: <strong>${input.message || "Standard integration heartbeat test."}</strong></p>
              <p style="font-size: 12px; color: #64748b; margin-top: 24px;">Timestamp: ${new Date().toISOString()}</p>
            </div>
          `,
        });

        return {
          success: res.sent,
          channel: input.channel,
          recipient: input.address,
          status: res.sent ? "SENT" : "FAILED",
          error: res.reason,
        };
      } else {
        const res = await WhatsAppBusinessService.sendMessage({
          toPhone: input.address,
          text: `🔔 *SOFTLAB GLOBAL — TEST NOTIFICATION*\n\nThis is a real-time system test message triggered by Admin (${ctx.user.email}).\n\nStatus: Active & Verified\nTimestamp: ${new Date().toLocaleTimeString("en-IN")}`,
        });

        return {
          success: res.success,
          channel: "WHATSAPP",
          recipient: input.address,
          status: res.success ? "SENT" : (res.messageId === "NOT_CONFIGURED" ? "SIMULATED" : "FAILED"),
          messageId: res.messageId,
          error: res.error,
        };
      }
    }),
});
