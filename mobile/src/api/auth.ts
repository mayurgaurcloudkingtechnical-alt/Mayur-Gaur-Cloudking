import { apiClient } from "./client";
import { AuthSessionResponse, LoginPayload, UserProfile } from "../types";
import { TokenStorage } from "../storage/secureStore";
import { getDeviceMetadata } from "../services/device.service";

export const AuthApi = {
  /**
   * Performs native login, obtaining access and refresh tokens.
   */
  async login(credentials: { identifier: string; password: string }): Promise<AuthSessionResponse> {
    const device = getDeviceMetadata();
    const payload: LoginPayload = {
      identifier: credentials.identifier.trim(),
      password: credentials.password,
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      platform: device.platform,
    };

    const session = await apiClient<AuthSessionResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
      skipAuth: true,
    });

    await TokenStorage.saveTokens(session.accessToken, session.refreshToken);
    await TokenStorage.saveUser(session.user);
    return session;
  },

  /**
   * Refreshes the session using the stored refresh token.
   */
  async refresh(): Promise<AuthSessionResponse> {
    const refreshToken = await TokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("No refresh token stored");
    }

    try {
      const session = await apiClient<AuthSessionResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
      });

      await TokenStorage.saveTokens(session.accessToken, session.refreshToken);
      await TokenStorage.saveUser(session.user);
      return session;
    } catch (err) {
      await TokenStorage.clearSession();
      throw err;
    }
  },

  /**
   * Revokes the active session on the backend and clears local secure storage.
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = await TokenStorage.getRefreshToken();
      await apiClient("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        retryOn401: false,
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      await TokenStorage.clearSession();
    }
  },

  /**
   * Verifies current session and returns latest authenticated user profile.
   */
  async getMe(): Promise<{ user: UserProfile; session: { id: string } }> {
    return await apiClient<{ user: UserProfile; session: { id: string } }>("/api/v1/auth/me", {
      method: "GET",
    });
  },
};
