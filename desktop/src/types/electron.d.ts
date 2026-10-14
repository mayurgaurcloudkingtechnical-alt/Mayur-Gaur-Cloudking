export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  roleCode: string;
  permissions?: string[];
}

export interface AuthSessionData {
  authenticated: boolean;
  user?: UserProfile;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
  code?: string;
}

export interface RefreshResult {
  success: boolean;
  accessToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface ElectronAuthAPI {
  login: (credentials: { identifier: string; password: string }) => Promise<AuthSessionData>;
  restoreSession: () => Promise<AuthSessionData>;
  refreshToken: () => Promise<RefreshResult>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  getDeviceId: () => Promise<string>;
  getCurrentUser: () => Promise<UserProfile | null>;
}

export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getBackendUrl: () => Promise<string>;
  ping: () => Promise<string>;
  auth: ElectronAuthAPI;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
