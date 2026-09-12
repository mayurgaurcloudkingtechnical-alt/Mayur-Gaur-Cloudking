import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { NotificationService } from "@/server/services/notification.service";

export const notificationRouter = router({
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
});
