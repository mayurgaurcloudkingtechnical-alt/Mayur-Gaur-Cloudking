import { db } from "@/server/db/client";
import { NotificationType, NotificationPriority, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export interface SendNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  onlyUnread?: boolean;
}

export class NotificationService {
  /**
   * Dispatches an in-app notification with fault tolerance.
   * Wrapped in try-catch so notification failure never aborts primary transactions.
   */
  static async sendNotification(input: SendNotificationInput) {
    try {
      return await db.notification.create({
        data: {
          userId: input.userId,
          title: input.title.trim(),
          message: input.message.trim(),
          type: input.type ?? NotificationType.SYSTEM,
          priority: input.priority ?? NotificationPriority.NORMAL,
          link: input.link?.trim() || null,
          metadata: input.metadata ?? undefined,
        },
      });
    } catch (err) {
      console.error(`[NotificationService] Failed to send notification to user ${input.userId}:`, err);
      return null;
    }
  }

  /**
   * Broadcasts notifications to multiple recipients with fault tolerance
   */
  static async sendBulkNotifications(
    userIds: string[],
    input: Omit<SendNotificationInput, "userId">
  ) {
    if (!userIds.length) return { count: 0 };
    try {
      const records = userIds.map((userId) => ({
        userId,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type ?? NotificationType.SYSTEM,
        priority: input.priority ?? NotificationPriority.NORMAL,
        link: input.link?.trim() || null,
      }));

      const result = await db.notification.createMany({
        data: records,
      });
      return { count: result.count };
    } catch (err) {
      console.error("[NotificationService] Bulk notification dispatch failed:", err);
      return { count: 0 };
    }
  }

  /**
   * Retrieves paginated notifications and total unread badge count for session user
   */
  static async listUserNotifications(userId: string, params: ListNotificationsParams = {}) {
    const { page = 1, limit = 20, onlyUnread = false } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(onlyUnread ? { isRead: false } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Marks a single notification as read enforcing strict tenant isolation
   */
  static async markAsRead(userId: string, notificationId: string) {
    const notification = await db.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Notification not found.",
      });
    }

    if (notification.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied. Cannot modify another user's notification.",
      });
    }

    return db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications for a user as read
   */
  static async markAllAsRead(userId: string) {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  }

  // ============================================================================
  // Integration Notification Hooks
  // ============================================================================

  static async notifyAdmission(userId: string, studentName: string, stage: string, link = "/student/dashboard") {
    return this.sendNotification({
      userId,
      title: "Admission Application Status Update",
      message: `Your admission application for ${studentName} has been updated to ${stage}.`,
      type: NotificationType.ADMISSION,
      priority: NotificationPriority.HIGH,
      link,
    });
  }

  static async notifyPaymentReceived(userId: string, amountPaise: number, receiptRef: string, link = "/student/payments") {
    const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amountPaise / 100);
    return this.sendNotification({
      userId,
      title: "Payment Receipt Confirmed",
      message: `Tuition payment of ${formatted} confirmed. Reference: ${receiptRef}.`,
      type: NotificationType.FEE_PAYMENT,
      priority: NotificationPriority.NORMAL,
      link,
    });
  }

  static async notifyCertificateIssued(userId: string, courseTitle: string, certNumber: string, link?: string) {
    return this.sendNotification({
      userId,
      title: "Verified Digital Certificate Issued!",
      message: `Congratulations! Your certificate for ${courseTitle} has been issued (${certNumber}).`,
      type: NotificationType.CERTIFICATE,
      priority: NotificationPriority.HIGH,
      link: link || `/verify/certificate/${certNumber}`,
    });
  }

  static async notifyPlacementDrive(userIds: string[], jobTitle: string, companyName: string, link = "/student/placements") {
    return this.sendBulkNotifications(userIds, {
      title: `New Placement Drive: ${companyName}`,
      message: `A new placement drive for '${jobTitle}' at ${companyName} is open for eligible applications.`,
      type: NotificationType.PLACEMENT,
      priority: NotificationPriority.HIGH,
      link,
    });
  }

  static async notifyPayrollDisbursed(userId: string, slipNumber: string, netSalaryPaise: number, link = "/staff/leaves") {
    const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(netSalaryPaise / 100);
    return this.sendNotification({
      userId,
      title: "Monthly Salary Disbursed",
      message: `Your salary slip ${slipNumber} for ${formatted} has been processed and disbursed.`,
      type: NotificationType.PAYROLL,
      priority: NotificationPriority.HIGH,
      link,
    });
  }
}
