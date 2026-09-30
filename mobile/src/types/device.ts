export interface UserDeviceSessionItem {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  platform: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  isCurrentSession: boolean;
}

export interface RegisterPushTokenPayload {
  pushToken: string;
  deviceId?: string;
  platform?: string;
}

export interface PushTokenRegistrationResult {
  success: boolean;
  registered: boolean;
  pushToken: string;
}
