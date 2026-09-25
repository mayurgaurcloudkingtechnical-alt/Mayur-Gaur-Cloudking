export type UserRole =
  | "SUPER_ADMIN"
  | "DIRECTOR"
  | "ADMIN"
  | "MANAGER"
  | "COUNSELOR"
  | "TELECALLER"
  | "TRAINER"
  | "HR"
  | "ACCOUNTANT"
  | "PLACEMENT_OFFICER"
  | "STUDENT"
  | "MARKETING"
  | "FRANCHISE_PARTNER";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  roleCode: UserRole;
  permissions: string[];
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserProfile;
}

export interface LoginPayload {
  identifier: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: "ANDROID" | "IOS" | "WINDOWS" | "MACOS" | "DESKTOP" | "OTHER";
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}
