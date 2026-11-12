import { db } from "@/server/db/client";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { CHHATH_PUJA_CAMPAIGN_2026, DIWALI_CAMPAIGN_2026 } from "@/lib/constants/campaign";

export interface DiwaliBroadcastResult {
  totalUsersFound: number;
  notificationsCreated: number;
  broadcastTime: string;
  success: boolean;
  message: string;
}

export class DiwaliCampaignBroadcastService {
  /**
   * Broadcasts the Chhath Puja Special Offer 2026 festive campaign notification alert
   * to all active users across LMS, CRM, student portals, and staff teams.
   */
  public static async broadcastToAllUsers(): Promise<DiwaliBroadcastResult> {
    try {
      // 1. Fetch all registered active users across all roles
      const users = await db.user.findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
        select: {
          id: true,
          email: true,
          phone: true,
          roleCode: true,
        },
      });

      const userIds = users.map((u) => u.id);
      const nowIso = new Date().toISOString();

      if (!userIds.length) {
        return {
          totalUsersFound: 0,
          notificationsCreated: 0,
          broadcastTime: nowIso,
          success: true,
          message: "No active users found to broadcast to.",
        };
      }

      // 2. Dispatch in-app festive notification in bulk via NotificationService
      const title = `🌅 छठ पूजा SPECIAL OFFER 2026: Flat 35% OFF on Every Course!`;
      const message = `आप सभी को छठ पूजा की हार्दिक शुभकामनाएं! SoftLab Global announces festive concession: Flat 35% Discount on all IT & Software courses (AI/ML, Cloud, Cyber Security, Full Stack, Data Science). Limited-period offer valid until ${CHHATH_PUJA_CAMPAIGN_2026.expiryDateFormatted}. Enrol now and save 35%!`;

      const notificationResult = await NotificationService.sendBulkNotifications(userIds, {
        title,
        message,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        link: "/#diwali-offer",
      });

      console.log(
        `[ChhathCampaignBroadcast] Successfully dispatched festive alerts to ${notificationResult.count} users.`
      );

      // 3. Try to broadcast announcement to WhatsApp sales/community group if configured
      try {
        const salesGroupService = (await import("./whatsapp-sales-group-notification.service")).WhatsAppSalesGroupNotificationService;
        const groupLink = salesGroupService.DEFAULT_SALES_GROUP_LINK;

        console.log(`[ChhathCampaignBroadcast] WhatsApp Sales group link active: ${groupLink}`);
      } catch (whatsAppErr: any) {
        console.warn(`[ChhathCampaignBroadcast] WhatsApp broadcast skipped or optional:`, whatsAppErr.message);
      }

      return {
        totalUsersFound: userIds.length,
        notificationsCreated: notificationResult.count,
        broadcastTime: nowIso,
        success: true,
        message: `Chhath Puja Offer 2026 alert successfully broadcasted to ${notificationResult.count} users in Notification Center.`,
      };
    } catch (err: any) {
      console.error("[ChhathCampaignBroadcast] Error broadcasting festive alerts:", err);
      return {
        totalUsersFound: 0,
        notificationsCreated: 0,
        broadcastTime: new Date().toISOString(),
        success: false,
        message: err.message || "Failed to broadcast Chhath Puja campaign notifications.",
      };
    }
  }
}
