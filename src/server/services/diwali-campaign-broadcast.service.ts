import { db } from "@/server/db/client";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { NotificationService } from "./notification.service";
import { DIWALI_CAMPAIGN_2026 } from "@/lib/constants/campaign";

export interface DiwaliBroadcastResult {
  totalUsersFound: number;
  notificationsCreated: number;
  broadcastTime: string;
  success: boolean;
  message: string;
}

export class DiwaliCampaignBroadcastService {
  /**
   * Broadcasts the Diwali Dhamaka 2026 festive campaign notification alert
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
      const title = `🪔 DIWALI DHAMAKA 2026: Up to 45% OFF on Every Course!`;
      const message = `Celebrate Diwali with a brighter future! SoftLab Global announces festive academic concessions up to 45% across all IT masterclasses, AI/ML programs, and university technical certifications. Limited-period offer valid until ${DIWALI_CAMPAIGN_2026.expiryDateFormatted}. Claim or share your concession voucher now!`;

      const notificationResult = await NotificationService.sendBulkNotifications(userIds, {
        title,
        message,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.HIGH,
        link: "/#diwali-offer",
      });

      console.log(
        `[DiwaliCampaignBroadcast] Successfully dispatched festive alerts to ${notificationResult.count} users.`
      );

      // 3. Try to broadcast announcement to WhatsApp sales/community group if configured
      try {
        const salesGroupService = (await import("./whatsapp-sales-group-notification.service")).WhatsAppSalesGroupNotificationService;
        const groupLink = salesGroupService.DEFAULT_SALES_GROUP_LINK;

        console.log(`[DiwaliCampaignBroadcast] WhatsApp Sales group link active: ${groupLink}`);
      } catch (whatsAppErr: any) {
        console.warn(`[DiwaliCampaignBroadcast] WhatsApp broadcast skipped or optional:`, whatsAppErr.message);
      }

      return {
        totalUsersFound: userIds.length,
        notificationsCreated: notificationResult.count,
        broadcastTime: nowIso,
        success: true,
        message: `Diwali Offer 2026 alert successfully broadcasted to ${notificationResult.count} users in Notification Center.`,
      };
    } catch (err: any) {
      console.error("[DiwaliCampaignBroadcast] Error broadcasting festive alerts:", err);
      return {
        totalUsersFound: 0,
        notificationsCreated: 0,
        broadcastTime: new Date().toISOString(),
        success: false,
        message: err.message || "Failed to broadcast Diwali campaign notifications.",
      };
    }
  }
}
