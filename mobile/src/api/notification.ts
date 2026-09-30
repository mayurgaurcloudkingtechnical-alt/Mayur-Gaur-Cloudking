import { apiClient } from './client';
import {
  NotificationItem,
  NotificationsListResponse,
} from '../types/notification';
import { PushTokenRegistrationResult } from '../types/device';

interface TrpcSuccessResponse<T> {
  result: {
    data: {
      json: T;
    };
  };
}

function unwrapTrpcResponse<T>(response: any): T {
  if (response?.result?.data?.json !== undefined) {
    return response.result.data.json as T;
  }
  if (response?.error?.message) {
    throw new Error(response.error.message);
  }
  return response as T;
}

export const notificationApi = {
  /**
   * Retrieves paginated notifications and total unread badge count for authenticated student.
   */
  async getMyNotifications(params: {
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
  } = {}): Promise<NotificationsListResponse> {
    const inputObj = {
      json: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        ...(params.onlyUnread !== undefined ? { onlyUnread: params.onlyUnread } : {}),
      },
    };
    const query = encodeURIComponent(JSON.stringify(inputObj));
    const raw = await apiClient.get<TrpcSuccessResponse<NotificationsListResponse>>(
      `/api/trpc/notifications.getMyNotifications?input=${query}`
    );
    return unwrapTrpcResponse<NotificationsListResponse>(raw);
  },

  /**
   * Marks a single notification as read.
   */
  async markAsRead(notificationId: string): Promise<NotificationItem> {
    const raw = await apiClient.post<TrpcSuccessResponse<NotificationItem>>(
      '/api/trpc/notifications.markAsRead',
      { json: { notificationId } }
    );
    return unwrapTrpcResponse<NotificationItem>(raw);
  },

  /**
   * Marks all unread notifications as read.
   */
  async markAllAsRead(): Promise<{ updatedCount: number }> {
    const raw = await apiClient.post<TrpcSuccessResponse<{ updatedCount: number }>>(
      '/api/trpc/notifications.markAllAsRead',
      { json: {} }
    );
    return unwrapTrpcResponse<{ updatedCount: number }>(raw);
  },

  /**
   * Registers mobile device push notification token.
   */
  async registerPushToken(payload: {
    pushToken: string;
    deviceId?: string;
    platform?: string;
  }): Promise<PushTokenRegistrationResult> {
    const raw = await apiClient.post<TrpcSuccessResponse<PushTokenRegistrationResult>>(
      '/api/trpc/notifications.registerPushToken',
      { json: payload }
    );
    return unwrapTrpcResponse<PushTokenRegistrationResult>(raw);
  },
};
