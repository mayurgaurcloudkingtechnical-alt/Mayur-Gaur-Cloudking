import { apiClient } from './client';
import { UserDeviceSessionItem } from '../types/device';

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

export const deviceApi = {
  /**
   * Retrieves active device sessions for authenticated user.
   */
  async getMySessions(): Promise<UserDeviceSessionItem[]> {
    const raw = await apiClient.get<TrpcSuccessResponse<UserDeviceSessionItem[]>>(
      '/api/trpc/auth.getMySessions'
    );
    return unwrapTrpcResponse<UserDeviceSessionItem[]>(raw);
  },

  /**
   * Revokes a specific device session owned by the authenticated student.
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; revokedSessionId: string }> {
    const raw = await apiClient.post<TrpcSuccessResponse<{ success: boolean; revokedSessionId: string }>>(
      '/api/trpc/auth.revokeSession',
      { json: { sessionId } }
    );
    return unwrapTrpcResponse<{ success: boolean; revokedSessionId: string }>(raw);
  },
};
